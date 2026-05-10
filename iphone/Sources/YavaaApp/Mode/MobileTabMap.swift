import YavaaCore

public enum MobileTab: String, CaseIterable, Equatable, Sendable {
    case home
    case urgencies
    case myHomes
    case workers
    case myClients
    case profile

    public var title: String {
        switch self {
        case .home:
            return "Inicio"
        case .urgencies:
            return "Urgencias"
        case .myHomes:
            return "Mis Casas"
        case .workers:
            return "Trabajadores"
        case .myClients:
            return "Mis Clientes"
        case .profile:
            return "Perfil"
        }
    }

    public var systemImageName: String {
        switch self {
        case .home:
            return "house"
        case .urgencies:
            return "bolt.badge.clock"
        case .myHomes:
            return "house.lodge"
        case .workers:
            return "hammer"
        case .myClients:
            return "person.2"
        case .profile:
            return "person.crop.circle"
        }
    }
}

public enum MobileUrgenciesIntent: Equatable, Sendable {
    case draftBeforeAuth
    case publishEmergency
    case browseEmergencies
}

public enum MobileTabMap {
    public static let guestTabs: [MobileTab] = [.home, .urgencies, .profile]

    public static func tabs(for mode: AppMode) -> [MobileTab] {
        switch mode {
        case .client:
            return [.home, .urgencies, .myHomes, .workers, .profile]
        case .contractor:
            return [.home, .urgencies, .myClients, .profile]
        }
    }

    public static func urgenciesIntent(for mode: AppMode?) -> MobileUrgenciesIntent {
        switch mode {
        case .client:
            return .publishEmergency
        case .contractor:
            return .browseEmergencies
        case nil:
            return .draftBeforeAuth
        }
    }
}
