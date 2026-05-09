import XCTest
import YavaaCore
@testable import YavaaAPI
@testable import YavaaAuth

private actor StubTokenStore: SessionTokenStore {
    var token: String?

    init(token: String? = nil) {
        self.token = token
    }

    func loadAccessToken() async throws -> String? {
        token
    }

    func saveAccessToken(_ token: String) async throws {
        self.token = token
    }

    func clearAccessToken() async throws {
        token = nil
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

    func testPreferredModeStorePersistsValidMode() async throws {
        let store = InMemoryPreferredModeStore()

        try await store.savePreferredMode(.contractor)

        XCTAssertEqual(try await store.loadPreferredMode(), .contractor)
    }
}
