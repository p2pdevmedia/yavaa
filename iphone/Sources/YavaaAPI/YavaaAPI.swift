import Foundation
import YavaaCore

private func trimmedRequiredString(_ value: String) -> String {
    value.trimmingCharacters(in: .whitespacesAndNewlines)
}

private func trimmedOptionalString(_ value: String?) -> String? {
    guard let value else {
        return nil
    }

    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
}

public enum APIError: Error, Equatable, Sendable {
    case invalidPath(String)
    case invalidResponse
    case statusCode(Int)
}

public enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
    case put = "PUT"
    case delete = "DELETE"
}

public struct APIEnvironment: Equatable, Sendable {
    public let baseURL: URL

    public init(baseURL: URL) {
        self.baseURL = baseURL
    }

    public static let localWebsite = APIEnvironment(baseURL: URL(string: "http://localhost:3000")!)
    public static let production = APIEnvironment(baseURL: URL(string: "https://www.yavaa.lat")!)
}

public struct APIRequest: Equatable, Sendable {
    public let path: String
    public let method: HTTPMethod
    public let queryItems: [URLQueryItem]
    public let body: Data?

    public init(
        path: String,
        method: HTTPMethod,
        queryItems: [URLQueryItem] = [],
        body: Data? = nil
    ) throws {
        guard path.hasPrefix("/api/") else {
            throw APIError.invalidPath(path)
        }

        self.path = path
        self.method = method
        self.queryItems = queryItems
        self.body = body
    }

    public func urlRequest(environment: APIEnvironment, accessToken: String?) throws -> URLRequest {
        var components = URLComponents(
            url: environment.baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = queryItems.isEmpty ? nil : queryItems

        guard let url = components?.url else {
            throw APIError.invalidPath(path)
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let accessToken, !accessToken.isEmpty {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    public static func providerSearch(category: String? = nil) throws -> APIRequest {
        try APIRequest(
            path: "/api/providers",
            method: .get,
            queryItems: category.map { [URLQueryItem(name: "category", value: $0)] } ?? []
        )
    }
}

public protocol AccessTokenProviding: Sendable {
    func currentAccessToken() async throws -> String?
}

public struct NoAccessTokenProvider: AccessTokenProviding {
    public init() {}

    public func currentAccessToken() async throws -> String? {
        nil
    }
}

public final class APIClient: @unchecked Sendable {
    private let environment: APIEnvironment
    private let tokenProvider: AccessTokenProviding
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(
        environment: APIEnvironment = .localWebsite,
        tokenProvider: AccessTokenProviding = NoAccessTokenProvider(),
        session: URLSession = .shared,
        decoder: JSONDecoder = JSONDecoder()
    ) {
        self.environment = environment
        self.tokenProvider = tokenProvider
        self.session = session
        self.decoder = decoder
        self.decoder.dateDecodingStrategy = .iso8601
    }

    public func send<Response: Decodable & Sendable>(_ request: APIRequest) async throws -> Response {
        let accessToken = try await tokenProvider.currentAccessToken()
        let urlRequest = try request.urlRequest(environment: environment, accessToken: accessToken)
        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.statusCode(httpResponse.statusCode)
        }

        return try decoder.decode(Response.self, from: data)
    }

    public func fetchCurrentSession() async throws -> WebsiteMeResponse {
        try await send(APIRequest(path: "/api/me", method: .get))
    }

    public func fetchOpenAPIDocument() async throws -> OpenAPIDocumentSummary {
        try await send(APIRequest(path: "/api/openapi", method: .get))
    }

    public func fetchCatalogCategories() async throws -> CatalogCategoriesResponse {
        try await send(APIRequest(path: "/api/catalog/categories", method: .get))
    }

    public func fetchCatalogMarkets() async throws -> CatalogMarketsResponse {
        try await send(APIRequest(path: "/api/catalog/markets", method: .get))
    }

    public func searchProviders(category: String? = nil) async throws -> PublicProvidersResponse {
        try await send(APIRequest.providerSearch(category: category))
    }

    public func fetchProviderProfile(id: String) async throws -> PublicProviderProfileResponse {
        try await send(APIRequest(path: "/api/providers/\(id)", method: .get))
    }

    public func fetchAddresses() async throws -> AddressesResponse {
        try await send(APIRequest(path: "/api/me/addresses", method: .get))
    }

    public func createAddress(_ input: AddressInput) async throws -> WebsiteMeResponse {
        try await send(
            APIRequest(
                path: "/api/me/addresses",
                method: .post,
                body: try JSONEncoder().encode(input)
            )
        )
    }

    public func updateAddress(id: String, input: AddressPatchInput) async throws -> WebsiteMeResponse {
        try await send(
            APIRequest(
                path: "/api/me/addresses/\(id)",
                method: .patch,
                body: try JSONEncoder().encode(input)
            )
        )
    }

    public func deleteAddress(id: String) async throws -> WebsiteMeResponse {
        try await send(APIRequest(path: "/api/me/addresses/\(id)", method: .delete))
    }

    public func updateProfile(_ input: ProfileUpdateInput) async throws -> WebsiteMeResponse {
        try await send(
            APIRequest(
                path: "/api/me/profile",
                method: .patch,
                body: try JSONEncoder().encode(input)
            )
        )
    }

    public func fetchBookings() async throws -> BookingsResponse {
        try await send(APIRequest(path: "/api/bookings", method: .get))
    }

    public func createEmergency(_ input: EmergencyRequestInput) async throws -> EmergencyResponse {
        try await send(
            APIRequest(
                path: "/api/emergencies",
                method: .post,
                body: try JSONEncoder().encode(input)
            )
        )
    }

    public func actOnBooking(id: String, input: BookingActionInput) async throws -> BookingResponse {
        try await send(
            APIRequest(
                path: "/api/bookings/\(id)",
                method: .patch,
                body: try JSONEncoder().encode(input)
            )
        )
    }
}

public struct WebsiteMeResponse: Decodable, Equatable, Sendable {
    public let authenticated: Bool
    public let configured: Bool
    public let reason: AuthFailureReason?
    public let identity: UserIdentity?
    public let appUser: WebsiteAppUser?
    public let matchedBy: String?
    public let permissionContext: WebsitePermissionContext?

    public func toSessionState(preferredMode: AppMode? = nil) -> SessionState {
        guard authenticated, let appUser else {
            return SessionState(isAuthenticated: false, identity: identity, reason: reason)
        }

        let account = AccountSummary(
            id: appUser.id,
            email: appUser.email,
            status: appUser.status,
            roles: appUser.roles
        )

        return SessionState.authenticated(
            identity: identity,
            account: account,
            preferredMode: preferredMode
        )
    }
}

public struct WebsitePermissionContext: Decodable, Equatable, Sendable {
    public let userId: String
    public let status: UserStatus
    public let roles: [AppRole]
}

public struct WebsiteAppUser: Decodable, Equatable, Sendable {
    public let id: String
    public let email: String
    public let displayName: String?
    public let status: UserStatus
    public let roles: [AppRole]
    public let profile: WebsiteProfile?
    public let addresses: [WebsiteAddress]
    public let contractorProfile: WebsiteContractorProfile?
}

public struct WebsiteProfile: Decodable, Equatable, Sendable {
    public let firstName: String?
    public let lastName: String?
    public let avatarUrl: String?
    public let phone: String?
    public let bio: String?
}

public struct WebsiteAddress: Decodable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let line1: String
    public let line2: String?
    public let city: String
    public let province: String
    public let postalCode: String?
    public let notes: String?
    public let type: String
    public let isDefault: Bool
    public let market: WebsiteAddressMarket?

    public init(
        id: String,
        label: String,
        line1: String,
        line2: String?,
        city: String,
        province: String,
        postalCode: String?,
        notes: String?,
        type: String,
        isDefault: Bool,
        market: WebsiteAddressMarket? = nil
    ) {
        self.id = id
        self.label = label
        self.line1 = line1
        self.line2 = line2
        self.city = city
        self.province = province
        self.postalCode = postalCode
        self.notes = notes
        self.type = type
        self.isDefault = isDefault
        self.market = market
    }

    public var canCreateEmergency: Bool {
        market != nil
    }
}

public struct WebsiteAddressMarket: Decodable, Equatable, Sendable {
    public let id: String
    public let slug: String
    public let city: String
    public let province: String
    public let country: String
}

public struct WebsiteContractorProfile: Decodable, Equatable, Sendable {
    public let id: String
    public let approvalStatus: String
    public let acceptsEmergencies: Bool
    public let dniNumber: String?
    public let dniFrontUrl: String?
    public let dniBackUrl: String?
    public let profilePhotoUrl: String?
    public let reviewNotes: String?
    public let submittedAt: String?
    public let reviewedAt: String?
    public let reviewedByUserId: String?
    public let addressId: String?
}

public struct CatalogCategoriesResponse: Decodable, Equatable, Sendable {
    public let categories: [CatalogCategory]
}

public struct CatalogMarketsResponse: Decodable, Equatable, Sendable {
    public let markets: [CatalogMarket]
    public let locations: [CatalogLocation]
}

public struct CatalogCategory: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let slug: String
    public let name: String
    public let group: String?
    public let isInitial: Bool
}

public struct CatalogMarket: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let slug: String
    public let country: String
    public let city: String
    public let province: String
    public let isPrimary: Bool
    public let workZones: [CatalogWorkZone]
}

public struct CatalogWorkZone: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let slug: String
    public let name: String
    public let description: String?
}

public struct CatalogLocation: Decodable, Equatable, Identifiable, Sendable {
    public let provinceId: String
    public let provinceName: String
    public let cityId: String
    public let cityName: String
    public let latitude: Double?
    public let longitude: Double?

    public var id: String {
        "\(provinceId)-\(cityId)"
    }
}

public struct PublicProvidersResponse: Decodable, Equatable, Sendable {
    public let items: [PublicProviderCard]
}

public struct PublicProviderProfileResponse: Decodable, Equatable, Sendable {
    public let provider: PublicProviderProfile?
}

public struct PublicProviderCard: Decodable, Equatable, Identifiable, Sendable {
    public let contractorProfileId: String
    public let displayName: String
    public let bio: String?
    public let profilePhotoUrl: String?
    public let acceptsEmergencies: Bool
    public let marketSlug: String?
    public let marketCity: String?
    public let marketProvince: String?
    public let categories: [PublicProviderCategory]

    public var id: String {
        contractorProfileId
    }

    public init(
        contractorProfileId: String,
        displayName: String,
        bio: String?,
        profilePhotoUrl: String?,
        acceptsEmergencies: Bool,
        marketSlug: String?,
        marketCity: String?,
        marketProvince: String?,
        categories: [PublicProviderCategory]
    ) {
        self.contractorProfileId = contractorProfileId
        self.displayName = displayName
        self.bio = bio
        self.profilePhotoUrl = profilePhotoUrl
        self.acceptsEmergencies = acceptsEmergencies
        self.marketSlug = marketSlug
        self.marketCity = marketCity
        self.marketProvince = marketProvince
        self.categories = categories
    }
}

public struct PublicProviderCategory: Decodable, Equatable, Sendable {
    public let slug: String
    public let name: String
    public let group: String?
    public let isPrimary: Bool

    public init(slug: String, name: String, group: String?, isPrimary: Bool) {
        self.slug = slug
        self.name = name
        self.group = group
        self.isPrimary = isPrimary
    }
}

public struct PublicProviderProfile: Decodable, Equatable, Identifiable, Sendable {
    public let contractorProfileId: String
    public let displayName: String
    public let bio: String?
    public let phone: String?
    public let profilePhotoUrl: String?
    public let acceptsEmergencies: Bool
    public let marketSlug: String?
    public let marketCity: String?
    public let marketProvince: String?
    public let categories: [PublicProviderCategory]
    public let workZones: [PublicProviderWorkZone]

    public var id: String {
        contractorProfileId
    }
}

public struct PublicProviderWorkZone: Decodable, Equatable, Sendable {
    public let slug: String
    public let name: String
    public let description: String?
}

public struct AddressesResponse: Decodable, Equatable, Sendable {
    public let addresses: [WebsiteAddress]
}

public struct ProfileUpdateInput: Encodable, Equatable, Sendable {
    public let displayName: String?
    public let firstName: String?
    public let lastName: String?
    public let avatarUrl: String?
    public let phone: String?
    public let bio: String?

    public init(
        displayName: String? = nil,
        firstName: String? = nil,
        lastName: String? = nil,
        avatarUrl: String? = nil,
        phone: String? = nil,
        bio: String? = nil
    ) {
        self.displayName = trimmedOptionalString(displayName)
        self.firstName = trimmedOptionalString(firstName)
        self.lastName = trimmedOptionalString(lastName)
        self.avatarUrl = trimmedOptionalString(avatarUrl)
        self.phone = trimmedOptionalString(phone)
        self.bio = trimmedOptionalString(bio)
    }
}

public struct AddressInput: Encodable, Equatable, Sendable {
    public let label: String
    public let line1: String
    public let line2: String?
    public let city: String
    public let province: String
    public let postalCode: String?
    public let notes: String?
    public let type: String
    public let isDefault: Bool
    public let marketId: String?

    public init(
        label: String,
        line1: String,
        line2: String? = nil,
        city: String,
        province: String,
        postalCode: String? = nil,
        notes: String? = nil,
        type: String = "HOME",
        isDefault: Bool = false,
        marketId: String? = nil
    ) {
        self.label = trimmedRequiredString(label)
        self.line1 = trimmedRequiredString(line1)
        self.line2 = trimmedOptionalString(line2)
        self.city = trimmedRequiredString(city)
        self.province = trimmedRequiredString(province)
        self.postalCode = trimmedOptionalString(postalCode)
        self.notes = trimmedOptionalString(notes)
        self.type = type
        self.isDefault = isDefault
        self.marketId = marketId
    }
}

public struct AddressPatchInput: Encodable, Equatable, Sendable {
    public let label: String?
    public let line1: String?
    public let line2: String?
    public let city: String?
    public let province: String?
    public let postalCode: String?
    public let notes: String?
    public let type: String?
    public let isDefault: Bool?
    public let marketId: String?

    private enum CodingKeys: String, CodingKey {
        case label
        case line1
        case line2
        case city
        case province
        case postalCode
        case notes
        case type
        case isDefault
        case marketId
    }

    public init(
        label: String? = nil,
        line1: String? = nil,
        line2: String? = nil,
        city: String? = nil,
        province: String? = nil,
        postalCode: String? = nil,
        notes: String? = nil,
        type: String? = nil,
        isDefault: Bool? = nil,
        marketId: String? = nil
    ) {
        self.label = trimmedOptionalString(label)
        self.line1 = trimmedOptionalString(line1)
        self.line2 = trimmedOptionalString(line2)
        self.city = trimmedOptionalString(city)
        self.province = trimmedOptionalString(province)
        self.postalCode = trimmedOptionalString(postalCode)
        self.notes = trimmedOptionalString(notes)
        self.type = trimmedOptionalString(type)
        self.isDefault = isDefault
        self.marketId = marketId
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(label, forKey: .label)
        try container.encodeIfPresent(line1, forKey: .line1)
        try container.encodeIfPresent(line2, forKey: .line2)
        try container.encodeIfPresent(city, forKey: .city)
        try container.encodeIfPresent(province, forKey: .province)
        try container.encodeIfPresent(postalCode, forKey: .postalCode)
        try container.encodeIfPresent(notes, forKey: .notes)
        try container.encodeIfPresent(type, forKey: .type)
        try container.encodeIfPresent(isDefault, forKey: .isDefault)
        try container.encodeIfPresent(marketId, forKey: .marketId)
    }
}

public struct BookingsResponse: Decodable, Equatable, Sendable {
    public let bookings: [BookingSummary]
}

public struct BookingResponse: Decodable, Equatable, Sendable {
    public let booking: BookingSummary
}

public enum BookingAction: String, Encodable, Equatable, Sendable {
    case accept
    case reject
    case cancel
    case requestReschedule = "request_reschedule"
}

public struct BookingActionInput: Encodable, Equatable, Sendable {
    public let action: BookingAction
    public let note: String?

    public init(action: BookingAction, note: String? = nil) {
        self.action = action
        self.note = note
    }
}

public struct BookingSummary: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let status: String
    public let scheduledFor: String
    public let description: String
    public let contractorNote: String?
    public let decisionReason: String?
    public let rescheduleRequestedAt: String?
    public let acceptedAt: String?
    public let rejectedAt: String?
    public let cancelledAt: String?
    public let createdAt: String
    public let updatedAt: String
    public let client: BookingUser
    public let contractorProfile: BookingContractorProfile
    public let category: BookingCategory
    public let address: BookingAddress
}

public struct BookingUser: Decodable, Equatable, Sendable {
    public let id: String
    public let email: String
    public let displayName: String?
    public let profile: BookingUserProfile?
}

public struct BookingUserProfile: Decodable, Equatable, Sendable {
    public let firstName: String?
    public let lastName: String?
}

public struct BookingContractorProfile: Decodable, Equatable, Sendable {
    public let id: String
    public let user: BookingUser
}

public struct BookingCategory: Decodable, Equatable, Sendable {
    public let id: String
    public let slug: String
    public let name: String
}

public struct BookingAddress: Decodable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let line1: String
    public let line2: String?
    public let city: String
    public let province: String
    public let postalCode: String?
}

public struct EmergencyRequestInput: Encodable, Equatable, Sendable {
    public let categoryId: String
    public let addressId: String
    public let description: String

    public init(categoryId: String, addressId: String, description: String) {
        self.categoryId = categoryId
        self.addressId = addressId
        self.description = description
    }
}

public struct EmergencyResponse: Decodable, Equatable, Sendable {
    public let request: EmergencyRequestSummary
}

public struct EmergencyRequestSummary: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let status: String
    public let dispatchRound: Int
    public let expiresAt: String
    public let description: String
    public let acceptedAt: String?
    public let cancelledAt: String?
    public let createdAt: String
    public let updatedAt: String
    public let client: BookingUser
    public let category: BookingCategory
    public let address: BookingAddress
    public let assignedContractorProfile: BookingContractorProfile?
    public let candidates: [EmergencyCandidateSummary]
}

public struct EmergencyCandidateSummary: Decodable, Equatable, Identifiable, Sendable {
    public let id: String
    public let contractorProfileId: String
    public let dispatchRound: Int
    public let status: String
    public let notifiedAt: String
    public let respondedAt: String?
    public let responseNote: String?
}

public struct OpenAPIDocumentSummary: Decodable, Equatable, Sendable {
    public let openapi: String
    public let info: Info

    public struct Info: Decodable, Equatable, Sendable {
        public let title: String
        public let version: String
    }
}
