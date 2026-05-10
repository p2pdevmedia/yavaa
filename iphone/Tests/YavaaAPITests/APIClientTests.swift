import Foundation
import XCTest
@testable import YavaaAPI

final class APIClientTests: XCTestCase {
    func buildsWebsiteAPIRequestsWithBearerAuth() throws {
        let environment = APIEnvironment(baseURL: URL(string: "https://www.yavaa.lat")!)
        let request = try APIRequest(path: "/api/me", method: .get)
            .urlRequest(environment: environment, accessToken: "session-token")

        XCTAssertEqual(request.url?.absoluteString, "https://www.yavaa.lat/api/me")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Accept"), "application/json")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer session-token")
    }

    func testDecodesAuthenticatedMeResponseWithRoles() throws {
        let json = """
        {
          "authenticated": true,
          "configured": true,
          "reason": null,
          "identity": {
            "id": "supabase_001",
            "email": "dual@yavaa.test"
          },
          "matchedBy": "supabase_auth_id",
          "permissionContext": {
            "userId": "user_001",
            "status": "ACTIVE",
            "roles": ["client", "contractor"]
          },
          "appUser": {
            "id": "user_001",
            "email": "dual@yavaa.test",
            "displayName": "Dual User",
            "status": "ACTIVE",
            "roles": ["client", "contractor"],
            "profile": null,
            "addresses": [],
            "contractorProfile": null
          }
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let response = try decoder.decode(WebsiteMeResponse.self, from: json)

        XCTAssertTrue(response.authenticated)
        XCTAssertEqual(response.identity?.id, "supabase_001")
        XCTAssertEqual(response.appUser?.roles, [.client, .contractor])
        XCTAssertEqual(response.toSessionState().mode, .client)
    }

    func testBuildsProviderSearchRequestWithCategoryFilter() throws {
        let environment = APIEnvironment.production
        let request = try APIRequest.providerSearch(category: "home-services")
            .urlRequest(environment: environment, accessToken: nil)

        XCTAssertEqual(request.url?.absoluteString, "https://www.yavaa.lat/api/providers?category=home-services")
        XCTAssertEqual(request.httpMethod, "GET")
    }

    func testDecodesCatalogCategoriesResponse() throws {
        let json = """
        {
          "categories": [
            {
              "id": "category_001",
              "slug": "home-services",
              "name": "Home Services",
              "group": "home",
              "isInitial": true
            }
          ]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(CatalogCategoriesResponse.self, from: json)

        XCTAssertEqual(response.categories.first?.slug, "home-services")
    }

    func testEncodesBookingAcceptActionForNextAPI() throws {
        let input = BookingActionInput(action: .accept)
        let data = try JSONEncoder().encode(input)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["action"] as? String, "accept")
    }
}
