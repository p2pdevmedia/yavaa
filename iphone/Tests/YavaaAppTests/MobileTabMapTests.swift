import XCTest
import YavaaCore
@testable import YavaaApp

final class MobileTabMapTests: XCTestCase {
    func testClientModeUsesYavaaAndProfileTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .client),
            [.yavaa, .profile]
        )
    }

    func testContractorModeUsesOffersWorkingAndProfileTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .contractor),
            [.offers, .working, .profile]
        )
    }
}
