public enum AppMode: String, Codable, CaseIterable, Equatable, Sendable {
    case client
    case contractor

    public static let `default`: AppMode = .client
}

public enum AppRole: String, Codable, CaseIterable, Equatable, Sendable {
    case client
    case contractor
    case admin
    case support
}

public struct UserIdentity: Codable, Equatable, Sendable {
    public let id: String
    public let email: String?

    public init(id: String, email: String?) {
        self.id = id
        self.email = email
    }
}

public struct SessionState: Equatable, Sendable {
    public let isAuthenticated: Bool
    public let mode: AppMode
    public let roles: [AppRole]

    public init(
        isAuthenticated: Bool,
        mode: AppMode = .default,
        roles: [AppRole] = []
    ) {
        self.isAuthenticated = isAuthenticated
        self.mode = mode
        self.roles = roles
    }

    public static let signedOut = SessionState(isAuthenticated: false)
}
