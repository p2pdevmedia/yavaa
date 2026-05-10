import XCTest
import YavaaCore
@testable import YavaaApp

final class MobileTabMapTests: XCTestCase {
    func testClientModeUsesInicioYavaaAndProfileTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .client),
            [.home, .yavaa, .profile]
        )
    }

    func testContractorModeUsesOffersWorkingAndProfileTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .contractor),
            [.offers, .working, .profile]
        )
    }
}
