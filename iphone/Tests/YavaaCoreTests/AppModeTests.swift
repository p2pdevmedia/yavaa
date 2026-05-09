import XCTest
@testable import YavaaCore

final class AppModeTests: XCTestCase {
    func testDefaultsToClientMode() {
        XCTAssertEqual(AppMode.default, .client)
    }

    func testDerivesClientModeForClientRole() {
        let account = AccountSummary(
            id: "user_001",
            email: "client@yavaa.test",
            status: .active,
            roles: [.client]
        )

        XCTAssertEqual(account.availableModes, [.client])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .client)
    }

    func testDerivesContractorModeForContractorRole() {
        let account = AccountSummary(
            id: "user_002",
            email: "contractor@yavaa.test",
            status: .active,
            roles: [.contractor]
        )

        XCTAssertEqual(account.availableModes, [.contractor])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .contractor)
    }

    func testDerivesBothMobileModesForDualRoleAccount() {
        let account = AccountSummary(
            id: "user_003",
            email: "dual@yavaa.test",
            status: .active,
            roles: [.client, .contractor, .admin]
        )

        XCTAssertEqual(account.availableModes, [.client, .contractor])
    }

    func testRejectsUnavailableModeSelection() {
        let account = AccountSummary(
            id: "user_004",
            email: "client-only@yavaa.test",
            status: .active,
            roles: [.client]
        )
        let session = SessionState.authenticated(account: account)

        XCTAssertThrowsError(try session.selectingMode(.contractor)) { error in
            XCTAssertEqual(error as? SessionState.ModeSelectionError, .modeUnavailable)
        }
    }

    func testBlockedAccountCannotUseWorkModes() {
        let account = AccountSummary(
            id: "user_005",
            email: "blocked@yavaa.test",
            status: .blocked,
            roles: [.client, .contractor]
        )

        XCTAssertEqual(account.availableModes, [])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, nil)
    }
}
