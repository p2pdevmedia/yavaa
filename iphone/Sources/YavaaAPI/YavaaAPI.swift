import Foundation
import YavaaCore

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
    public static let production = APIEnvironment(baseURL: URL(string: "https://app.yavaa.lat")!)
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

public struct OpenAPIDocumentSummary: Decodable, Equatable, Sendable {
    public let openapi: String
    public let info: Info

    public struct Info: Decodable, Equatable, Sendable {
        public let title: String
        public let version: String
    }
}
