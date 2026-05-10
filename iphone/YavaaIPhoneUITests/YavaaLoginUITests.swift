import XCTest

final class YavaaLoginUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testConfiguredUserCanSignIn() throws {
        guard let email = Self.credential(named: "YAVAA_E2E_EMAIL") else {
            throw XCTSkip("Set YAVAA_E2E_EMAIL to run the iPhone login E2E test.")
        }
        guard let password = Self.credential(named: "YAVAA_E2E_PASSWORD") else {
            throw XCTSkip("Set YAVAA_E2E_PASSWORD to run the iPhone login E2E test.")
        }

        let app = XCUIApplication()
        app.launch()

        let emailField = app.textFields["login.email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 15), "Login email field should be visible.")
        emailField.tap()
        emailField.typeText(email)

        let passwordField = app.secureTextFields["login.password"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: 5), "Login password field should be visible.")
        passwordField.tap()
        passwordField.typeText(password)

        app.buttons["login.submit"].tap()

        let authenticatedStatus = app.staticTexts["session.status.authenticated"]
        let loginError = app.staticTexts["login.error"]
        let deadline = Date().addingTimeInterval(45)
        while Date() < deadline {
            if authenticatedStatus.exists {
                return
            }
            if loginError.exists {
                XCTFail("Login failed with message: \(loginError.label)")
                return
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }

        XCTFail("Expected the app to show an authenticated session after login.")
    }

    private static func credential(named name: String) -> String? {
        if let value = ProcessInfo.processInfo.environment[name], isConfiguredCredential(value) {
            return value
        }

        guard let value = Bundle(for: YavaaLoginUITests.self).object(forInfoDictionaryKey: name) as? String,
              isConfiguredCredential(value) else {
            return nil
        }

        return value
    }

    private static func isConfiguredCredential(_ value: String) -> Bool {
        !value.isEmpty && !value.hasPrefix("$(")
    }
}
