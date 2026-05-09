import XCTest
@testable import YavaaApp

final class AppConfigurationTests: XCTestCase {
    func testLoadsRuntimeConfigurationFromBundleInfoWhenEnvironmentIsEmpty() {
        let configuration = YavaaAppConfiguration.load(
            environment: [:],
            bundleInfo: [
                "YAVAA_API_BASE_URL": "https://www.yavaa.lat",
                "YAVAA_SUPABASE_URL": "https://mvzkbhnfuhjvnojncwbf.supabase.co",
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "publishable-key"
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
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "override-key"
            ],
            bundleInfo: [
                "YAVAA_API_BASE_URL": "https://www.yavaa.lat",
                "YAVAA_SUPABASE_URL": "https://mvzkbhnfuhjvnojncwbf.supabase.co",
                "YAVAA_SUPABASE_PUBLISHABLE_KEY": "publishable-key"
            ]
        )

        XCTAssertEqual(configuration.apiEnvironment.baseURL, URL(string: "https://api.override.test"))
        XCTAssertNotNil(configuration.authService)
    }
}
