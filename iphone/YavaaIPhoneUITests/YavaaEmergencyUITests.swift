import XCTest

final class YavaaEmergencyUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testConfiguredClientCanCreateEmergency() throws {
        guard let email = Self.credential(named: "YAVAA_E2E_EMAIL") else {
            throw XCTSkip("Set YAVAA_E2E_EMAIL to run the iPhone emergency E2E test.")
        }
        guard let password = Self.credential(named: "YAVAA_E2E_PASSWORD") else {
            throw XCTSkip("Set YAVAA_E2E_PASSWORD to run the iPhone emergency E2E test.")
        }

        let app = XCUIApplication()
        app.launch()

        signIn(app: app, email: email, password: password)
        selectClientModeIfNeeded(app: app)

        let urgenciesTab = app.tabBars.buttons["Urgencias"]
        XCTAssertTrue(urgenciesTab.waitForExistence(timeout: 15), "Urgencias tab should be visible.")
        urgenciesTab.tap()

        let descriptionField = app.textFields["Que hay que resolver?"]
        XCTAssertTrue(descriptionField.waitForExistence(timeout: 30), "Emergency description field should be visible.")
        descriptionField.tap()
        descriptionField.typeText("E2E emergencia creada desde iPhone.")

        let createButton = app.buttons["emergency.create"]
        XCTAssertTrue(createButton.waitForExistence(timeout: 5), "Create emergency button should be visible.")
        createButton.tap()

        let createdMessage = app.staticTexts["Urgencia creada. Yavaa esta buscando trabajadores disponibles."]
        let errorMessage = app.staticTexts["No se pudo crear la urgencia en /api/emergencies."]
        let deadline = Date().addingTimeInterval(45)
        while Date() < deadline {
            if createdMessage.exists {
                return
            }
            if errorMessage.exists {
                XCTFail("Emergency creation failed in the iPhone app.")
                return
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        }

        XCTFail("Expected the iPhone app to confirm emergency creation.")
    }

    private func signIn(app: XCUIApplication, email: String, password: String) {
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
            if authenticatedStatus.exists || app.tabBars.buttons["Urgencias"].exists {
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

    private func selectClientModeIfNeeded(app: XCUIApplication) {
        let clientMode = app.buttons["role-selection.mode.client"]
        if clientMode.waitForExistence(timeout: 3) {
            clientMode.tap()
            let continueButton = app.buttons["role-selection.continue"]
            XCTAssertTrue(continueButton.waitForExistence(timeout: 5), "Role selection continue button should be visible.")
            continueButton.tap()
        }
    }

    private static func credential(named name: String) -> String? {
        if let value = ProcessInfo.processInfo.environment[name], isConfiguredCredential(value) {
            return value
        }

        guard let value = Bundle(for: YavaaEmergencyUITests.self).object(forInfoDictionaryKey: name) as? String,
              isConfiguredCredential(value) else {
            return nil
        }

        return value
    }

    private static func isConfiguredCredential(_ value: String) -> Bool {
        !value.isEmpty && !value.hasPrefix("$(")
    }
}
