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

public enum UserStatus: String, Codable, CaseIterable, Equatable, Sendable {
    case active = "ACTIVE"
    case suspended = "SUSPENDED"
    case blocked = "BLOCKED"
}

public enum AuthFailureReason: String, Codable, CaseIterable, Equatable, Sendable {
    case missingToken = "missing-token"
    case supabaseNotConfigured = "supabase-not-configured"
    case invalidToken = "invalid-token"
}

public struct UserIdentity: Codable, Equatable, Sendable {
    public let id: String
    public let email: String?

    public init(id: String, email: String?) {
        self.id = id
        self.email = email
    }
}

public struct AccountSummary: Codable, Equatable, Sendable {
    public let id: String
    public let email: String
    public let status: UserStatus
    public let roles: [AppRole]

    public init(
        id: String,
        email: String,
        status: UserStatus,
        roles: [AppRole]
    ) {
        self.id = id
        self.email = email
        self.status = status
        self.roles = roles
    }

    public var availableModes: [AppMode] {
        guard status == .active else {
            return []
        }

        var modes: [AppMode] = []
        if roles.contains(.client) {
            modes.append(.client)
        }
        if roles.contains(.contractor) {
            modes.append(.contractor)
        }
        return modes
    }
}

public struct SessionState: Equatable, Sendable {
    public enum ModeSelectionError: Error, Equatable, Sendable {
        case unauthenticated
        case modeUnavailable
    }

    public let isAuthenticated: Bool
    public let identity: UserIdentity?
    public let account: AccountSummary?
    public let mode: AppMode?
    public let reason: AuthFailureReason?

    public init(
        isAuthenticated: Bool,
        identity: UserIdentity? = nil,
        account: AccountSummary? = nil,
        mode: AppMode? = nil,
        reason: AuthFailureReason? = nil
    ) {
        self.isAuthenticated = isAuthenticated
        self.identity = identity
        self.account = account
        self.mode = mode
        self.reason = reason
    }

    public static let signedOut = SessionState(isAuthenticated: false)

    public static func authenticated(
        identity: UserIdentity? = nil,
        account: AccountSummary,
        preferredMode: AppMode? = nil
    ) -> SessionState {
        let availableModes = account.availableModes
        let selectedMode: AppMode?
        if let preferredMode, availableModes.contains(preferredMode) {
            selectedMode = preferredMode
        } else {
            selectedMode = availableModes.first
        }

        return SessionState(
            isAuthenticated: true,
            identity: identity,
            account: account,
            mode: selectedMode
        )
    }

    public func selectingMode(_ selectedMode: AppMode) throws -> SessionState {
        guard isAuthenticated, let account else {
            throw ModeSelectionError.unauthenticated
        }
        guard account.availableModes.contains(selectedMode) else {
            throw ModeSelectionError.modeUnavailable
        }

        return SessionState(
            isAuthenticated: true,
            identity: identity,
            account: account,
            mode: selectedMode,
            reason: reason
        )
    }
}
