import XCTest
@testable import YavaaCore

final class AppModeTests: XCTestCase {
    func defaultsToClientMode() {
        XCTAssertEqual(AppMode.default, .client)
    }
}
