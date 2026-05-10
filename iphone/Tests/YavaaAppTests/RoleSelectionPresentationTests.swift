import XCTest
import YavaaCore
@testable import YavaaApp

final class RoleSelectionPresentationTests: XCTestCase {
    func testClientOnlyAccountStillRequiresExplicitModeChoice() {
        let session = SessionState.authenticated(
            account: AccountSummary(
                id: "user_client",
                email: "client@yavaa.test",
                status: .active,
                roles: [.client]
            )
        )

        XCTAssertEqual(
            RoleSelectionPresentation.presentation(for: session),
            .choice(modes: [.client, .contractor], defaultMode: .client)
        )
    }

    func testDualRoleAccountRequiresExplicitModeChoice() {
        let session = SessionState.authenticated(
            account: AccountSummary(
                id: "user_dual",
                email: "dual@yavaa.test",
                status: .active,
                roles: [.client, .contractor]
            )
        )

        XCTAssertEqual(
            RoleSelectionPresentation.presentation(for: session),
            .choice(modes: [.client, .contractor], defaultMode: .client)
        )
    }

    func testContractorOnlyAccountStillRequiresExplicitModeChoice() {
        let session = SessionState.authenticated(
            account: AccountSummary(
                id: "user_contractor",
                email: "trabajador@yavaa.test",
                status: .active,
                roles: [.contractor]
            )
        )

        XCTAssertEqual(
            RoleSelectionPresentation.presentation(for: session),
            .choice(modes: [.client, .contractor], defaultMode: .client)
        )
    }

    func testBlockedAccountSkipsRoleSelection() {
        let session = SessionState.authenticated(
            account: AccountSummary(
                id: "user_blocked",
                email: "blocked@yavaa.test",
                status: .blocked,
                roles: [.client, .contractor]
            )
        )

        XCTAssertEqual(RoleSelectionPresentation.presentation(for: session), .none)
    }
}
