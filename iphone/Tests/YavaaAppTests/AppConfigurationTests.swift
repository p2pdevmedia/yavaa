import XCTest
@testable import YavaaApp

final class AppConfigurationTests: XCTestCase {
    func testDefaultsToLocalWebsiteWhenRuntimeConfigurationIsMissing() {
        let configuration = YavaaAppConfiguration.load(
            environment: [:],
            bundleInfo: [:]
        )

        XCTAssertEqual(configuration.apiEnvironment.baseURL, URL(string: "http://localhost:3000"))
        XCTAssertNil(configuration.authService)
    }

    func testLoadsRuntimeConfigurationFromBundleInfoWhenEnvironmentIsEmpty() {
        let configuration = YavaaAppConfiguration.load(
            environment: [:],
            bundleInfo: [
                "YAVAA_API_BASE_URL": "https://www.yavaa.lat",
                "YAVAA_SUPABASE_URL": "https://mvzkbhnfuhjvnojncwbf.supabase.co",
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "publishable-key",
                "YAVAA_AUTH_REDIRECT_URL": "lat.yavaa.iphone://login-callback"
            ]
        )

        XCTAssertEqual(configuration.apiEnvironment.baseURL, URL(string: "https://www.yavaa.lat"))
        XCTAssertNotNil(configuration.authService)
    }

    func testEnvironmentOverridesBundleInfo() {
        let configuration = YavaaAppConfiguration.load(
            environment: [
                "YAVAA_API_BASE_URL": "https://api.override.test",
                "YAVAA_SUPABASE_URL": "https://override.supabase.co",
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "override-key",
                "YAVAA_AUTH_REDIRECT_URL": "lat.yavaa.iphone://login-callback"
            ],
            bundleInfo: [
                "YAVAA_API_BASE_URL": "https://www.yavaa.lat",
                "YAVAA_SUPABASE_URL": "https://mvzkbhnfuhjvnojncwbf.supabase.co",
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "publishable-key",
                "YAVAA_AUTH_REDIRECT_URL": "ignored://callback"
            ]
        )

        XCTAssertEqual(configuration.apiEnvironment.baseURL, URL(string: "https://api.override.test"))
        XCTAssertNotNil(configuration.authService)
    }
}
