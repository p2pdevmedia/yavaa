import Foundation
import YavaaCore

public enum RoleSelectionPresentation: Equatable, Sendable {
    case none
    case automatic(mode: AppMode, duration: TimeInterval)
    case choice(modes: [AppMode], defaultMode: AppMode)

    public static let defaultAutomaticDuration: TimeInterval = 1

    public static func presentation(for session: SessionState) -> RoleSelectionPresentation {
        guard let account = session.account,
              account.status == .active else {
            return .none
        }

        let modes = account.availableModes
        guard let defaultMode = modes.first else {
            return .none
        }

        if modes.count == 1 {
            return .automatic(
                mode: defaultMode,
                duration: defaultAutomaticDuration
            )
        }

        return .choice(
            modes: modes,
            defaultMode: modes.contains(.client) ? .client : defaultMode
        )
    }
}
