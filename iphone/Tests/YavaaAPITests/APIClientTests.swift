import Foundation
import XCTest
@testable import YavaaAPI

final class APIClientTests: XCTestCase {
    func buildsWebsiteAPIRequestsWithBearerAuth() throws {
        let environment = APIEnvironment(baseURL: URL(string: "https://app.yavaa.lat")!)
        let request = try APIRequest(path: "/api/me", method: .get)
            .urlRequest(environment: environment, accessToken: "session-token")

        XCTAssertEqual(request.url?.absoluteString, "https://app.yavaa.lat/api/me")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Accept"), "application/json")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer session-token")
    }
}
