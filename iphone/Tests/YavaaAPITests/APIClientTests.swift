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

    func testBuildsPublicProviderProfileRequest() throws {
        let environment = APIEnvironment.production
        let request = try APIRequest(path: "/api/providers/provider_001", method: .get)
            .urlRequest(environment: environment, accessToken: nil)

        XCTAssertEqual(request.url?.absoluteString, "https://www.yavaa.lat/api/providers/provider_001")
        XCTAssertEqual(request.httpMethod, "GET")
    }

    func testBuildsEmergencyListRequestForContractorBrowse() throws {
        let environment = APIEnvironment.production
        let request = try APIRequest.emergencyList(mode: .contractor)
            .urlRequest(environment: environment, accessToken: "contractor-token")

        XCTAssertEqual(request.url?.absoluteString, "https://www.yavaa.lat/api/emergencies?mode=contractor")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer contractor-token")
    }

    func testDecodesPublicProviderProfileResponse() throws {
        let json = """
        {
          "provider": {
            "contractorProfileId": "provider_001",
            "displayName": "Carlos Perez",
            "bio": "Albanil con experiencia.",
            "phone": "+5493875551234",
            "profilePhotoUrl": null,
            "acceptsEmergencies": true,
            "marketSlug": "salta",
            "marketCity": "Salta",
            "marketProvince": "Salta",
            "categories": [
              {
                "slug": "construction",
                "name": "Construccion",
                "group": "obra",
                "isPrimary": true
              }
            ],
            "workZones": [
              {
                "slug": "centro",
                "name": "Centro",
                "description": "Zona centro"
              }
            ]
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(PublicProviderProfileResponse.self, from: json)

        XCTAssertEqual(response.provider?.displayName, "Carlos Perez")
        XCTAssertEqual(response.provider?.phone, "+5493875551234")
        XCTAssertEqual(response.provider?.workZones.first?.name, "Centro")
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

    func testDecodesCatalogMarketsResponseForAddressSelectors() throws {
        let json = """
        {
          "markets": [
            {
              "id": "99999999-9999-4999-8999-999999999999",
              "slug": "salta",
              "country": "Argentina",
              "city": "Salta",
              "province": "Salta",
              "isPrimary": true,
              "workZones": [
                {
                  "id": "zone_001",
                  "slug": "centro",
                  "name": "Centro",
                  "description": "Zona centro"
                }
              ]
            }
          ],
          "locations": [
            {
              "provinceId": "66",
              "provinceName": "Salta",
              "cityId": "660028",
              "cityName": "Salta",
              "latitude": -24.7891,
              "longitude": -65.4103
            },
            {
              "provinceId": "58",
              "provinceName": "Neuquén",
              "cityId": "580105",
              "cityName": "San Martín de los Andes",
              "latitude": -40.1579,
              "longitude": -71.3534
            }
          ]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(CatalogMarketsResponse.self, from: json)

        XCTAssertEqual(response.markets.first?.province, "Salta")
        XCTAssertEqual(response.markets.first?.city, "Salta")
        XCTAssertEqual(response.markets.first?.workZones.first?.name, "Centro")
        XCTAssertEqual(response.locations.map(\.provinceName), ["Salta", "Neuquén"])
        XCTAssertEqual(response.locations.first?.latitude, -24.7891)
    }

    func testEncodesBookingAcceptActionForNextAPI() throws {
        let input = BookingActionInput(action: .accept)
        let data = try JSONEncoder().encode(input)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["action"] as? String, "accept")
    }

    func testEncodesEmergencyRequestForNextAPI() throws {
        let input = EmergencyRequestInput(
            categoryId: "88888888-8888-4888-8888-888888888888",
            addressId: "66666666-6666-4666-8666-666666666666",
            description: "Necesito resolver una perdida de agua hoy."
        )
        let data = try JSONEncoder().encode(input)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["categoryId"] as? String, "88888888-8888-4888-8888-888888888888")
        XCTAssertEqual(object?["addressId"] as? String, "66666666-6666-4666-8666-666666666666")
        XCTAssertEqual(object?["description"] as? String, "Necesito resolver una perdida de agua hoy.")
    }

    func testDecodesEmergencyEligibleAddressMarketFromMeResponse() throws {
        let json = """
        {
          "authenticated": true,
          "configured": true,
          "reason": null,
          "identity": {
            "id": "supabase_001",
            "email": "client@yavaa.test"
          },
          "matchedBy": "supabase_auth_id",
          "permissionContext": {
            "userId": "user_001",
            "status": "ACTIVE",
            "roles": ["client"]
          },
          "appUser": {
            "id": "user_001",
            "email": "client@yavaa.test",
            "displayName": "Client User",
            "status": "ACTIVE",
            "roles": ["client"],
            "profile": null,
            "addresses": [
              {
                "id": "address_001",
                "label": "Casa",
                "line1": "Av. Siempre Viva 123",
                "line2": null,
                "city": "Salta",
                "province": "Salta",
                "postalCode": "4400",
                "notes": null,
                "type": "HOME",
                "isDefault": true,
                "market": {
                  "id": "99999999-9999-4999-8999-999999999999",
                  "slug": "salta",
                  "city": "Salta",
                  "province": "Salta",
                  "country": "Argentina"
                }
              }
            ],
            "contractorProfile": null
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(WebsiteMeResponse.self, from: json)

        XCTAssertEqual(response.appUser?.addresses.first?.market?.slug, "salta")
        XCTAssertEqual(response.appUser?.addresses.first?.canCreateEmergency, true)
    }

    func testDecodesEmergencyCreateResponseFromNextAPI() throws {
        let json = """
        {
          "request": {
            "id": "44444444-4444-4444-8444-444444444444",
            "status": "DISPATCHING",
            "dispatchRound": 1,
            "expiresAt": "2026-05-09T12:30:00.000Z",
            "description": "Necesito resolver una perdida de agua hoy.",
            "acceptedAt": null,
            "cancelledAt": null,
            "createdAt": "2026-05-09T12:00:00.000Z",
            "updatedAt": "2026-05-09T12:00:00.000Z",
            "client": {
              "id": "11111111-1111-4111-8111-111111111111",
              "email": "client@yavaa.test",
              "displayName": "Client One",
              "profile": {
                "firstName": "Client",
                "lastName": "One"
              }
            },
            "category": {
              "id": "88888888-8888-4888-8888-888888888888",
              "slug": "home-services",
              "name": "Home Services"
            },
            "address": {
              "id": "66666666-6666-4666-8666-666666666666",
              "label": "Casa",
              "line1": "Main 123",
              "line2": null,
              "city": "Salta",
              "province": "Salta",
              "postalCode": "4400"
            },
            "assignedContractorProfile": null,
            "candidates": [
              {
                "id": "77777777-7777-4777-8777-777777777777",
                "contractorProfileId": "55555555-5555-4555-8555-555555555555",
                "dispatchRound": 1,
                "status": "NOTIFIED",
                "notifiedAt": "2026-05-09T12:00:00.000Z",
                "respondedAt": null,
                "responseNote": null
              }
            ]
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(EmergencyResponse.self, from: json)

        XCTAssertEqual(response.request.id, "44444444-4444-4444-8444-444444444444")
        XCTAssertEqual(response.request.candidates.first?.status, "NOTIFIED")
    }

    func testDecodesEmergencyListResponseFromNextAPI() throws {
        let json = """
        {
          "requests": [
            {
              "id": "44444444-4444-4444-8444-444444444444",
              "status": "DISPATCHING",
              "dispatchRound": 1,
              "expiresAt": "2026-05-09T12:30:00.000Z",
              "description": "Necesito resolver una perdida de agua hoy.",
              "acceptedAt": null,
              "cancelledAt": null,
              "createdAt": "2026-05-09T12:00:00.000Z",
              "updatedAt": "2026-05-09T12:00:00.000Z",
              "client": {
                "id": "11111111-1111-4111-8111-111111111111",
                "email": "client@yavaa.test",
                "displayName": "Client One",
                "profile": {
                  "firstName": "Client",
                  "lastName": "One"
                }
              },
              "category": {
                "id": "88888888-8888-4888-8888-888888888888",
                "slug": "home-services",
                "name": "Home Services"
              },
              "address": {
                "id": "66666666-6666-4666-8666-666666666666",
                "label": "Casa",
                "line1": "Main 123",
                "line2": null,
                "city": "Salta",
                "province": "Salta",
                "postalCode": "4400"
              },
              "assignedContractorProfile": null,
              "candidates": [
                {
                  "id": "77777777-7777-4777-8777-777777777777",
                  "contractorProfileId": "55555555-5555-4555-8555-555555555555",
                  "dispatchRound": 1,
                  "status": "NOTIFIED",
                  "notifiedAt": "2026-05-09T12:00:00.000Z",
                  "respondedAt": null,
                  "responseNote": null
                }
              ]
            }
          ]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder().decode(EmergencyListResponse.self, from: json)

        XCTAssertEqual(response.requests.map(\.id), ["44444444-4444-4444-8444-444444444444"])
        XCTAssertEqual(response.requests.first?.status, "DISPATCHING")
    }

    func testProfileUpdateInputOmitsEmptyFieldsRejectedByNextValidation() throws {
        let input = ProfileUpdateInput(
            displayName: "  Maria  ",
            firstName: "",
            lastName: "   ",
            phone: "",
            bio: "  Disponible por la tarde  "
        )
        let data = try JSONEncoder().encode(input)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["displayName"] as? String, "Maria")
        XCTAssertNil(object?["firstName"])
        XCTAssertNil(object?["lastName"])
        XCTAssertNil(object?["phone"])
        XCTAssertEqual(object?["bio"] as? String, "Disponible por la tarde")
    }

    func testAddressPatchInputOmitsEmptyFieldsRejectedByNextValidation() throws {
        let input = AddressPatchInput(
            label: " Casa ",
            line1: "",
            city: "   ",
            province: "Salta",
            isDefault: true
        )
        let data = try JSONEncoder().encode(input)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(object?["label"] as? String, "Casa")
        XCTAssertNil(object?["line1"])
        XCTAssertNil(object?["city"])
        XCTAssertEqual(object?["province"] as? String, "Salta")
        XCTAssertEqual(object?["isDefault"] as? Bool, true)
    }
}
