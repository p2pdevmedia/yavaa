import Foundation

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

    public func fetchCurrentSession() async throws -> WebsiteSessionResponse {
        try await send(APIRequest(path: "/api/me", method: .get))
    }

    public func fetchOpenAPIDocument() async throws -> OpenAPIDocumentSummary {
        try await send(APIRequest(path: "/api/openapi", method: .get))
    }
}

public struct WebsiteSessionResponse: Decodable, Equatable, Sendable {
    public let authenticated: Bool
    public let configured: Bool
    public let reason: String?
    public let identity: WebsiteIdentity?
}

public struct WebsiteIdentity: Decodable, Equatable, Sendable {
    public let id: String
    public let email: String?
}

public struct OpenAPIDocumentSummary: Decodable, Equatable, Sendable {
    public let openapi: String
    public let info: Info

    public struct Info: Decodable, Equatable, Sendable {
        public let title: String
        public let version: String
    }
}
