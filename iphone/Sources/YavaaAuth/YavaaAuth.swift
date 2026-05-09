import Foundation
import Security
import Supabase
import YavaaAPI
import YavaaCore

public protocol SessionTokenStore: Sendable {
    func loadAccessToken() async throws -> String?
    func saveAccessToken(_ token: String) async throws
    func clearAccessToken() async throws
}

public actor InMemorySessionTokenStore: SessionTokenStore {
    private var token: String?

    public init(token: String? = nil) {
        self.token = token
    }

    public func loadAccessToken() async throws -> String? {
        token
    }

    public func saveAccessToken(_ token: String) async throws {
        self.token = token
    }

    public func clearAccessToken() async throws {
        token = nil
    }
}

public enum KeychainSessionTokenStoreError: Error, Equatable, Sendable {
    case invalidStoredData
    case unhandledStatus(OSStatus)
}

public actor KeychainSessionTokenStore: SessionTokenStore {
    private let service: String
    private let account: String

    public init(
        service: String = "lat.yavaa.iphone.session",
        account: String = "supabase-access-token"
    ) {
        self.service = service
        self.account = account
    }

    public func loadAccessToken() async throws -> String? {
        var query = keychainQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess else {
            throw KeychainSessionTokenStoreError.unhandledStatus(status)
        }
        guard
            let data = item as? Data,
            let token = String(data: data, encoding: .utf8)
        else {
            throw KeychainSessionTokenStoreError.invalidStoredData
        }

        return token
    }

    public func saveAccessToken(_ token: String) async throws {
        let deleteStatus = SecItemDelete(keychainQuery() as CFDictionary)
        guard deleteStatus == errSecSuccess || deleteStatus == errSecItemNotFound else {
            throw KeychainSessionTokenStoreError.unhandledStatus(deleteStatus)
        }

        var query = keychainQuery()
        query[kSecValueData as String] = Data(token.utf8)

        let addStatus = SecItemAdd(query as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            throw KeychainSessionTokenStoreError.unhandledStatus(addStatus)
        }
    }

    public func clearAccessToken() async throws {
        let status = SecItemDelete(keychainQuery() as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainSessionTokenStoreError.unhandledStatus(status)
        }
    }

    private func keychainQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
    }
}

public struct StoredAccessTokenProvider: AccessTokenProviding {
    private let store: SessionTokenStore

    public init(store: SessionTokenStore) {
        self.store = store
    }

    public func currentAccessToken() async throws -> String? {
        try await store.loadAccessToken()
    }
}

public protocol PreferredModeStore: Sendable {
    func loadPreferredMode() async throws -> AppMode?
    func savePreferredMode(_ mode: AppMode) async throws
    func clearPreferredMode() async throws
}

public actor InMemoryPreferredModeStore: PreferredModeStore {
    private var mode: AppMode?

    public init(mode: AppMode? = nil) {
        self.mode = mode
    }

    public func loadPreferredMode() async throws -> AppMode? {
        mode
    }

    public func savePreferredMode(_ mode: AppMode) async throws {
        self.mode = mode
    }

    public func clearPreferredMode() async throws {
        mode = nil
    }
}

public enum AuthServiceError: Error, Equatable, Sendable {
    case missingAccessToken
    case missingAuthService
}

public protocol AuthenticationService: Sendable {
    func signIn(email: String, password: String) async throws -> String
    func signUp(email: String, password: String) async throws -> String
    func signOut() async throws
}

public final class SupabaseAuthenticationService: AuthenticationService, @unchecked Sendable {
    private let client: SupabaseClient

    public init(url: URL, publishableKey: String) {
        self.client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: publishableKey,
            options: .init()
        )
    }

    public func signIn(email: String, password: String) async throws -> String {
        let session = try await client.auth.signIn(email: email, password: password)
        return session.accessToken
    }

    public func signUp(email: String, password: String) async throws -> String {
        let response = try await client.auth.signUp(email: email, password: password)

        guard let accessToken = response.session?.accessToken else {
            throw AuthServiceError.missingAccessToken
        }

        return accessToken
    }

    public func signOut() async throws {
        try await client.auth.signOut()
    }
}

public actor SessionController {
    private let apiClient: APIClient
    private let tokenStore: SessionTokenStore
    private let preferredModeStore: PreferredModeStore
    private let authService: AuthenticationService?

    public init(apiClient: APIClient) {
        let tokenStore = InMemorySessionTokenStore()

        self.apiClient = apiClient
        self.tokenStore = tokenStore
        self.preferredModeStore = InMemoryPreferredModeStore()
        self.authService = nil
    }

    public init(
        apiClient: APIClient,
        tokenStore: SessionTokenStore,
        preferredModeStore: PreferredModeStore,
        authService: AuthenticationService? = nil
    ) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
        self.preferredModeStore = preferredModeStore
        self.authService = authService
    }

    public func refreshSession() async -> SessionState {
        do {
            let preferredMode = try await preferredModeStore.loadPreferredMode()
            let response = try await apiClient.fetchCurrentSession()
            return response.toSessionState(preferredMode: preferredMode)
        } catch {
            return .signedOut
        }
    }

    public func signIn(email: String, password: String) async throws -> SessionState {
        guard let authService else {
            throw AuthServiceError.missingAuthService
        }

        let accessToken = try await authService.signIn(email: email, password: password)
        try await tokenStore.saveAccessToken(accessToken)
        return await refreshSession()
    }

    public func signUp(email: String, password: String) async throws -> SessionState {
        guard let authService else {
            throw AuthServiceError.missingAuthService
        }

        let accessToken = try await authService.signUp(email: email, password: password)
        try await tokenStore.saveAccessToken(accessToken)
        return await refreshSession()
    }

    public func selectMode(_ mode: AppMode, currentSession: SessionState) async throws -> SessionState {
        let nextState = try currentSession.selectingMode(mode)
        try await preferredModeStore.savePreferredMode(mode)
        return nextState
    }

    public func signOut() async throws -> SessionState {
        try await authService?.signOut()
        try await tokenStore.clearAccessToken()
        try await preferredModeStore.clearPreferredMode()
        return .signedOut
    }
}
