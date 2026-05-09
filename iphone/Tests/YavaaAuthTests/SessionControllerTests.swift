import XCTest
import YavaaCore
@testable import YavaaAPI
@testable import YavaaAuth

private actor StubTokenStore: SessionTokenStore {
    var credentials: AuthSessionCredentials?

    init(token: String? = nil) {
        self.credentials = token.map {
            AuthSessionCredentials(accessToken: $0, refreshToken: "refresh-token")
        }
    }

    func loadAccessToken() async throws -> String? {
        credentials?.accessToken
    }

    func loadSessionCredentials() async throws -> AuthSessionCredentials? {
        credentials
    }

    func saveAccessToken(_ token: String) async throws {
        self.credentials = AuthSessionCredentials(accessToken: token, refreshToken: "")
    }

    func saveSessionCredentials(_ credentials: AuthSessionCredentials) async throws {
        self.credentials = credentials
    }

    func clearAccessToken() async throws {
        credentials = nil
    }
}

private actor StubAuthService: AuthenticationService {
    enum StubError: Error {
        case signOutFailed
    }

    private let shouldThrowOnSignOut: Bool
    private let shouldRequireConfirmationOnSignUp: Bool

    init(
        shouldThrowOnSignOut: Bool = false,
        shouldRequireConfirmationOnSignUp: Bool = false
    ) {
        self.shouldThrowOnSignOut = shouldThrowOnSignOut
        self.shouldRequireConfirmationOnSignUp = shouldRequireConfirmationOnSignUp
    }

    func signIn(email: String, password: String) async throws -> AuthSessionCredentials {
        AuthSessionCredentials(accessToken: "access-token", refreshToken: "refresh-token")
    }

    func signUp(email: String, password: String) async throws -> AuthSessionCredentials {
        if shouldRequireConfirmationOnSignUp {
            throw AuthServiceError.confirmationRequired
        }

        AuthSessionCredentials(accessToken: "access-token", refreshToken: "refresh-token")
    }

    func signOut() async throws {
        if shouldThrowOnSignOut {
            throw StubError.signOutFailed
        }
    }
}

final class SessionControllerTests: XCTestCase {
    func testSignOutClearsStoredTokenAndSession() async throws {
        let store = StubTokenStore(token: "access-token")
        let controller = SessionController(
            apiClient: APIClient(),
            tokenStore: store,
            preferredModeStore: InMemoryPreferredModeStore()
        )

        let state = try await controller.signOut()

        XCTAssertFalse(state.isAuthenticated)
        XCTAssertNil(try await store.loadAccessToken())
    }

    func testSignOutClearsLocalStateWhenRemoteSignOutThrows() async throws {
        let tokenStore = StubTokenStore(token: "access-token")
        let preferredModeStore = InMemoryPreferredModeStore(mode: .contractor)
        let controller = SessionController(
            apiClient: APIClient(),
            tokenStore: tokenStore,
            preferredModeStore: preferredModeStore,
            authService: StubAuthService(shouldThrowOnSignOut: true)
        )

        let state = try await controller.signOut()

        XCTAssertFalse(state.isAuthenticated)
        XCTAssertNil(try await tokenStore.loadAccessToken())
        XCTAssertNil(try await preferredModeStore.loadPreferredMode())
    }

    func testSignUpConfirmationRequiredLeavesTokenStoreEmpty() async throws {
        let tokenStore = StubTokenStore()
        let controller = SessionController(
            apiClient: APIClient(),
            tokenStore: tokenStore,
            preferredModeStore: InMemoryPreferredModeStore(),
            authService: StubAuthService(shouldRequireConfirmationOnSignUp: true)
        )

        do {
            _ = try await controller.signUp(email: "new@yavaa.test", password: "password")
            XCTFail("Expected signUp to require confirmation")
        } catch let error as AuthServiceError {
            XCTAssertEqual(error, .confirmationRequired)
        } catch {
            XCTFail("Expected confirmationRequired, got \(error)")
        }

        XCTAssertNil(try await tokenStore.loadAccessToken())
    }

    func testInMemorySessionTokenStoreSavesCredentialsAndExposesAccessToken() async throws {
        let store = InMemorySessionTokenStore()
        let credentials = AuthSessionCredentials(
            accessToken: "access-token",
            refreshToken: "refresh-token"
        )

        try await store.saveSessionCredentials(credentials)

        XCTAssertEqual(try await store.loadAccessToken(), "access-token")
        XCTAssertEqual(try await store.loadSessionCredentials(), credentials)
    }

    func testPreferredModeStorePersistsValidMode() async throws {
        let store = InMemoryPreferredModeStore()

        try await store.savePreferredMode(.contractor)

        XCTAssertEqual(try await store.loadPreferredMode(), .contractor)
    }

    func testUserDefaultsPreferredModeStorePersistsAndClearsMode() async throws {
        let suiteName = "lat.yavaa.tests.preferred-mode.\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defaults.removePersistentDomain(forName: suiteName)
        defer {
            defaults.removePersistentDomain(forName: suiteName)
        }

        let key = "preferred-mode"
        let store = UserDefaultsPreferredModeStore(userDefaults: defaults, key: key)

        XCTAssertNil(try await store.loadPreferredMode())

        try await store.savePreferredMode(.contractor)

        let secondStore = UserDefaultsPreferredModeStore(userDefaults: defaults, key: key)
        XCTAssertEqual(try await secondStore.loadPreferredMode(), .contractor)

        try await secondStore.clearPreferredMode()

        XCTAssertNil(try await store.loadPreferredMode())
    }
}
