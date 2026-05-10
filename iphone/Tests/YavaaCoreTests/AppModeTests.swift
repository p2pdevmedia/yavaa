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

        XCTAssertEqual(account.availableModes, [.client, .contractor])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .client)
    }

    func testDerivesContractorModeForContractorRole() {
        let account = AccountSummary(
            id: "user_002",
            email: "contractor@yavaa.test",
            status: .active,
            roles: [.contractor]
        )

        XCTAssertEqual(account.availableModes, [.client, .contractor])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .client)
        XCTAssertEqual(SessionState.authenticated(account: account, preferredMode: .contractor).mode, .contractor)
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

    func testAllowsSelectingModeBeforeRoleExistsForOnboarding() {
        let account = AccountSummary(
            id: "user_004",
            email: "client-only@yavaa.test",
            status: .active,
            roles: [.client]
        )
        let session = SessionState.authenticated(account: account)

        XCTAssertEqual(try session.selectingMode(.contractor).mode, .contractor)
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

    func testAccountWithoutRolesCanChooseBothModesForOnboarding() {
        let account = AccountSummary(
            id: "user_006",
            email: "new@yavaa.test",
            status: .active,
            roles: []
        )

        XCTAssertEqual(account.availableModes, [.client, .contractor])
        XCTAssertEqual(SessionState.authenticated(account: account).mode, .client)
        XCTAssertEqual(SessionState.authenticated(account: account, preferredMode: .contractor).mode, .contractor)
    }
}
