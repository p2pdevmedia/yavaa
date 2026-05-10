import YavaaCore

public enum MobileTab: String, CaseIterable, Equatable, Sendable {
    case home
    case yavaa
    case offers
    case working
    case profile

    public var title: String {
        switch self {
        case .home:
            return "Inicio"
        case .yavaa:
            return "Yavaa"
        case .offers:
            return "Ofertas"
        case .working:
            return "Trabajando"
        case .profile:
            return "Perfil"
        }
    }

    public var systemImageName: String {
        switch self {
        case .home:
            return "house"
        case .yavaa:
            return "bolt.badge.clock"
        case .offers:
            return "tray.full"
        case .working:
            return "hammer"
        case .profile:
            return "person.crop.circle"
        }
    }
}

public enum MobileTabMap {
    public static func tabs(for mode: AppMode) -> [MobileTab] {
        switch mode {
        case .client:
            return [.home, .yavaa, .profile]
        case .contractor:
            return [.offers, .working, .profile]
        }
    }
}
