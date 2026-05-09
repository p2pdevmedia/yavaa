import XCTest
import YavaaCore
@testable import YavaaApp

final class MobileActionMapTests: XCTestCase {
    func testClientModeShowsClientActionsOnly() {
        let actions = MobileActionMap.actions(for: .client, accountStatus: .active)

        XCTAssertEqual(
            actions,
            [
                .searchServices,
                .viewProviders,
                .manageAddresses,
                .createScheduledBooking,
                .createEmergencyRequest,
                .viewBookingStatus,
                .viewBookingHistory,
                .openBookingChat,
                .uploadBookingFiles,
                .confirmCompletion,
                .reportProblem,
                .viewAccountStatus,
                .signOut
            ]
        )
    }

    func testContractorModeShowsContractorActionsOnly() {
        let actions = MobileActionMap.actions(for: .contractor, accountStatus: .active)

        XCTAssertEqual(
            actions,
            [
                .editContractorProfile,
                .manageServices,
                .manageAvailability,
                .incomingBookingRequests,
                .respondToEmergencyRequests,
                .openBookingChat,
                .uploadBookingFiles,
                .markBookingProgress,
                .viewAccountStatus,
                .signOut
            ]
        )
    }

    func testBlockedAccountShowsOnlySafeActions() {
        let actions = MobileActionMap.actions(for: .client, accountStatus: .blocked)

        XCTAssertEqual(actions, [.viewAccountStatus, .signOut])
    }

    func testSuspendedAccountShowsOnlySafeActions() {
        let actions = MobileActionMap.actions(for: .contractor, accountStatus: .suspended)

        XCTAssertEqual(actions, [.viewAccountStatus, .signOut])
    }

    func testNonActiveSessionWithoutModeShowsOnlySafeActions() {
        let account = AccountSummary(
            id: "user_blocked",
            email: "blocked@yavaa.test",
            status: .blocked,
            roles: [.client]
        )
        let session = SessionState.authenticated(account: account)

        XCTAssertEqual(MobileActionMap.actions(for: session), [.viewAccountStatus, .signOut])
    }
}
