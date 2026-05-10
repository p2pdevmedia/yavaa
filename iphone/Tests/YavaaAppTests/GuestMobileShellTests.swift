import XCTest
@testable import YavaaApp

final class GuestMobileShellTests: XCTestCase {
    func testGuestEmergencyDraftDefaultsToEmptyAndCanDetectContent() {
        let draft = GuestEmergencyDraft()

        XCTAssertFalse(draft.hasContent)
        XCTAssertEqual(draft.category, "")
        XCTAssertEqual(draft.address, "")
        XCTAssertEqual(draft.description, "")
        XCTAssertEqual(draft.contactPhone, "")
    }

    func testGuestEmergencyDraftDetectsTypedContent() {
        let draft = GuestEmergencyDraft(
            category: "Plomeria",
            address: "Casa centro",
            description: "Pierde agua",
            contactPhone: ""
        )

        XCTAssertTrue(draft.hasContent)
    }
}
