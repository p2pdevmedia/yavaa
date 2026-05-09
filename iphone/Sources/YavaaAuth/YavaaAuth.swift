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

public struct StoredAccessTokenProvider: AccessTokenProviding {
    private let store: SessionTokenStore

    public init(store: SessionTokenStore) {
        self.store = store
    }

    public func currentAccessToken() async throws -> String? {
        try await store.loadAccessToken()
    }
}

public actor SessionController {
    private let apiClient: APIClient

    public init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    public func refreshSession() async -> SessionState {
        do {
            let response = try await apiClient.fetchCurrentSession()
            return SessionState(isAuthenticated: response.authenticated)
        } catch {
            return .signedOut
        }
    }
}
