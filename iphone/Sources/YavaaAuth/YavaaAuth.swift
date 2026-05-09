import Foundation
import Security
import Supabase
import YavaaAPI
import YavaaCore

public struct AuthSessionCredentials: Equatable, Sendable {
    public let accessToken: String
    public let refreshToken: String

    public init(accessToken: String, refreshToken: String) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
    }
}

public protocol SessionTokenStore: Sendable {
    func loadAccessToken() async throws -> String?
    func loadSessionCredentials() async throws -> AuthSessionCredentials?
    func saveAccessToken(_ token: String) async throws
    func saveSessionCredentials(_ credentials: AuthSessionCredentials) async throws
    func clearAccessToken() async throws
}

public extension SessionTokenStore {
    func loadSessionCredentials() async throws -> AuthSessionCredentials? {
        guard let accessToken = try await loadAccessToken() else {
            return nil
        }

        return AuthSessionCredentials(accessToken: accessToken, refreshToken: "")
    }

    func saveSessionCredentials(_ credentials: AuthSessionCredentials) async throws {
        try await saveAccessToken(credentials.accessToken)
    }
}

public actor InMemorySessionTokenStore: SessionTokenStore {
    private var credentials: AuthSessionCredentials?

    public init(token: String? = nil) {
        self.credentials = token.map {
            AuthSessionCredentials(accessToken: $0, refreshToken: "")
        }
    }

    public func loadAccessToken() async throws -> String? {
        credentials?.accessToken
    }

    public func loadSessionCredentials() async throws -> AuthSessionCredentials? {
        credentials
    }

    public func saveAccessToken(_ token: String) async throws {
        self.credentials = AuthSessionCredentials(accessToken: token, refreshToken: "")
    }

    public func saveSessionCredentials(_ credentials: AuthSessionCredentials) async throws {
        self.credentials = credentials
    }

    public func clearAccessToken() async throws {
        credentials = nil
    }
}

public enum KeychainSessionTokenStoreError: Error, Equatable, Sendable {
    case invalidStoredData
    case unhandledStatus(OSStatus)
}

public actor KeychainSessionTokenStore: SessionTokenStore {
    private let service: String
    private let account: String
    private let accessibility: CFString

    public init(
        service: String = "lat.yavaa.iphone.session",
        account: String = "supabase-session",
        accessibility: CFString = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    ) {
        self.service = service
        self.account = account
        self.accessibility = accessibility
    }

    public func loadAccessToken() async throws -> String? {
        try loadToken(account: accessTokenAccount)
    }

    public func loadSessionCredentials() async throws -> AuthSessionCredentials? {
        guard let accessToken = try loadToken(account: accessTokenAccount) else {
            return nil
        }

        let refreshToken = try loadToken(account: refreshTokenAccount) ?? ""
        return AuthSessionCredentials(accessToken: accessToken, refreshToken: refreshToken)
    }

    public func saveAccessToken(_ token: String) async throws {
        try saveToken(token, account: accessTokenAccount)
        try clearToken(account: refreshTokenAccount)
    }

    public func saveSessionCredentials(_ credentials: AuthSessionCredentials) async throws {
        try saveToken(credentials.accessToken, account: accessTokenAccount)
        try saveToken(credentials.refreshToken, account: refreshTokenAccount)
    }

    public func clearAccessToken() async throws {
        try clearToken(account: accessTokenAccount)
        try clearToken(account: refreshTokenAccount)
    }

    private var accessTokenAccount: String {
        "\(account).access-token"
    }

    private var refreshTokenAccount: String {
        "\(account).refresh-token"
    }

    private func loadToken(account: String) throws -> String? {
        var query = keychainQuery(account: account)
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

    private func saveToken(_ token: String, account: String) throws {
        try clearToken(account: account)
        var query = keychainQuery(account: account)
        query[kSecValueData as String] = Data(token.utf8)

        let addStatus = SecItemAdd(query as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            throw KeychainSessionTokenStoreError.unhandledStatus(addStatus)
        }
    }

    private func clearToken(account: String) throws {
        let status = SecItemDelete(keychainQuery(account: account) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainSessionTokenStoreError.unhandledStatus(status)
        }
    }

    private func keychainQuery(account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessible as String: accessibility
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

public actor UserDefaultsPreferredModeStore: PreferredModeStore {
    private let userDefaults: UserDefaults
    private let key: String

    public init(
        userDefaults: UserDefaults = .standard,
        key: String = "lat.yavaa.iphone.preferred-mode"
    ) {
        self.userDefaults = userDefaults
        self.key = key
    }

    public func loadPreferredMode() async throws -> AppMode? {
        guard let rawValue = userDefaults.string(forKey: key) else {
            return nil
        }

        return AppMode(rawValue: rawValue)
    }

    public func savePreferredMode(_ mode: AppMode) async throws {
        userDefaults.set(mode.rawValue, forKey: key)
    }

    public func clearPreferredMode() async throws {
        userDefaults.removeObject(forKey: key)
    }
}

public enum AuthServiceError: Error, Equatable, Sendable {
    case missingAccessToken
    case confirmationRequired
    case missingAuthService
}

public protocol AuthenticationService: Sendable {
    func signIn(email: String, password: String) async throws -> AuthSessionCredentials
    func signUp(email: String, password: String) async throws -> AuthSessionCredentials
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

    public func signIn(email: String, password: String) async throws -> AuthSessionCredentials {
        let session = try await client.auth.signIn(email: email, password: password)
        guard !session.accessToken.isEmpty else {
            throw AuthServiceError.missingAccessToken
        }

        return AuthSessionCredentials(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
        )
    }

    public func signUp(email: String, password: String) async throws -> AuthSessionCredentials {
        let response = try await client.auth.signUp(email: email, password: password)

        guard let session = response.session else {
            throw AuthServiceError.confirmationRequired
        }
        guard !session.accessToken.isEmpty else {
            throw AuthServiceError.missingAccessToken
        }

        return AuthSessionCredentials(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
        )
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

        let credentials = try await authService.signIn(email: email, password: password)
        try await tokenStore.saveSessionCredentials(credentials)
        return await refreshSession()
    }

    public func signUp(email: String, password: String) async throws -> SessionState {
        guard let authService else {
            throw AuthServiceError.missingAuthService
        }

        let credentials = try await authService.signUp(email: email, password: password)
        try await tokenStore.saveSessionCredentials(credentials)
        return await refreshSession()
    }

    public func selectMode(_ mode: AppMode, currentSession: SessionState) async throws -> SessionState {
        let nextState = try currentSession.selectingMode(mode)
        try await preferredModeStore.savePreferredMode(mode)
        return nextState
    }

    public func signOut() async throws -> SessionState {
        do {
            try await authService?.signOut()
        } catch {
        }

        try await tokenStore.clearAccessToken()
        try await preferredModeStore.clearPreferredMode()
        return .signedOut
    }
}
