import YavaaCore

public enum MobileAction: String, CaseIterable, Equatable, Sendable {
    case searchServices
    case viewProviders
    case manageAddresses
    case createScheduledBooking
    case createEmergencyRequest
    case viewBookingStatus
    case viewBookingHistory
    case openBookingChat
    case uploadBookingFiles
    case confirmCompletion
    case reportProblem
    case editContractorProfile
    case manageServices
    case manageAvailability
    case incomingBookingRequests
    case respondToEmergencyRequests
    case markBookingProgress
    case viewAccountStatus
    case signOut

    public var title: String {
        switch self {
        case .searchServices:
            return "Buscar servicios"
        case .viewProviders:
            return "Ver proveedores"
        case .manageAddresses:
            return "Direcciones"
        case .createScheduledBooking:
            return "Reservar"
        case .createEmergencyRequest:
            return "Emergencia"
        case .viewBookingStatus:
            return "Estado de reservas"
        case .viewBookingHistory:
            return "Historial"
        case .openBookingChat:
            return "Chat"
        case .uploadBookingFiles:
            return "Archivos"
        case .confirmCompletion:
            return "Confirmar trabajo"
        case .reportProblem:
            return "Reportar problema"
        case .editContractorProfile:
            return "Perfil contratista"
        case .manageServices:
            return "Servicios"
        case .manageAvailability:
            return "Disponibilidad"
        case .incomingBookingRequests:
            return "Solicitudes"
        case .respondToEmergencyRequests:
            return "Urgencias"
        case .markBookingProgress:
            return "Avance del trabajo"
        case .viewAccountStatus:
            return "Estado de cuenta"
        case .signOut:
            return "Salir"
        }
    }

    public var isImplementedInCurrentSlice: Bool {
        switch self {
        case .viewAccountStatus, .signOut:
            return true
        case .searchServices,
             .viewProviders,
             .manageAddresses,
             .createScheduledBooking,
             .createEmergencyRequest,
             .viewBookingStatus,
             .viewBookingHistory,
             .openBookingChat,
             .uploadBookingFiles,
             .confirmCompletion,
             .reportProblem,
             .editContractorProfile,
             .manageServices,
             .manageAvailability,
             .incomingBookingRequests,
             .respondToEmergencyRequests,
             .markBookingProgress:
            return false
        }
    }
}

public enum MobileActionMap {
    public static func actions(for session: SessionState) -> [MobileAction] {
        guard let account = session.account else {
            return []
        }

        guard account.status == .active else {
            return safeActions
        }

        guard let mode = session.mode else {
            return safeActions
        }

        return actions(for: mode, accountStatus: account.status)
    }

    public static func actions(for mode: AppMode, accountStatus: UserStatus) -> [MobileAction] {
        guard accountStatus == .active else {
            return safeActions
        }

        switch mode {
        case .client:
            return [
                .searchServices,
                .viewProviders,
                .manageAddresses,
                .createScheduledBooking,
                .createEmergencyRequest,
                .viewBookingStatus,
                .viewBookingHistory,
                .openBookingChat,
                .uploadBookingFiles,
                .confirmCompletion,
                .reportProblem,
                .viewAccountStatus,
                .signOut
            ]
        case .contractor:
            return [
                .editContractorProfile,
                .manageServices,
                .manageAvailability,
                .incomingBookingRequests,
                .respondToEmergencyRequests,
                .openBookingChat,
                .uploadBookingFiles,
                .markBookingProgress,
                .viewAccountStatus,
                .signOut
            ]
        }
    }

    private static let safeActions: [MobileAction] = [.viewAccountStatus, .signOut]
}
