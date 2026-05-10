import SwiftUI
import YavaaCore
import YavaaDesign

public struct RoleSelectionView: View {
    private let presentation: RoleSelectionPresentation
    private let onSelect: (AppMode) async -> Void

    @State private var selectedMode: AppMode
    @State private var hasStartedAutomaticAdvance = false

    public init(
        presentation: RoleSelectionPresentation,
        onSelect: @escaping (AppMode) async -> Void
    ) {
        self.presentation = presentation
        self.onSelect = onSelect

        switch presentation {
        case .automatic(let mode, _):
            _selectedMode = State(initialValue: mode)
        case .choice(_, let defaultMode):
            _selectedMode = State(initialValue: defaultMode)
        case .none:
            _selectedMode = State(initialValue: .client)
        }
    }

    public var body: some View {
        VStack(spacing: YavaaSpacing.lg) {
            Spacer(minLength: YavaaSpacing.md)

            VStack(spacing: YavaaSpacing.sm) {
                Text("Elegi tu lado")
                    .font(.largeTitle.weight(.bold))

                Text(selectedMode.subtitle)
                    .font(.headline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            RoleScenarioCard(mode: selectedMode)
                .accessibilityIdentifier("role-selection.scenario.\(selectedMode.rawValue)")

            switch presentation {
            case .choice(let modes, _):
                RoleModeControls(
                    modes: modes,
                    selectedMode: $selectedMode
                )

                PrimaryActionButton("Continuar como \(selectedMode.callToActionTitle)") {
                    Task {
                        await onSelect(selectedMode)
                    }
                }
                .accessibilityIdentifier("role-selection.continue")

            case .automatic(_, _):
                ProgressView()
                    .accessibilityIdentifier("role-selection.automatic-progress")

            case .none:
                EmptyView()
            }

            Spacer(minLength: YavaaSpacing.md)
        }
        .padding(YavaaSpacing.lg)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(selectedMode.background)
        .navigationTitle("Modo")
        .task(id: presentation) {
            await runAutomaticAdvanceIfNeeded()
        }
    }

    private func runAutomaticAdvanceIfNeeded() async {
        guard case .automatic(let mode, let duration) = presentation,
              !hasStartedAutomaticAdvance else {
            return
        }

        hasStartedAutomaticAdvance = true
        let nanoseconds = UInt64(duration * 1_000_000_000)
        try? await Task.sleep(nanoseconds: nanoseconds)
        await onSelect(mode)
    }
}

private struct RoleModeControls: View {
    let modes: [AppMode]
    @Binding var selectedMode: AppMode

    var body: some View {
        HStack(spacing: YavaaSpacing.sm) {
            ForEach(modes, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.55, dampingFraction: 0.78)) {
                        selectedMode = mode
                    }
                } label: {
                    VStack(spacing: YavaaSpacing.xs) {
                        Image(systemName: mode.iconSystemName)
                            .font(.title2)
                        Text(mode.pickerTitle)
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, YavaaSpacing.md)
                }
                .buttonStyle(.bordered)
                .tint(selectedMode == mode ? YavaaColor.accent : .secondary)
                .accessibilityIdentifier("role-selection.mode.\(mode.rawValue)")
            }
        }
    }
}

private struct RoleScenarioCard: View {
    let mode: AppMode

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 8)
                .fill(mode.sceneFill)

            VStack(spacing: YavaaSpacing.md) {
                HStack {
                    ForEach(0..<3, id: \.self) { index in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(mode.windowFill.opacity(0.85))
                            .frame(width: 34, height: CGFloat(46 + index * 8))
                    }
                }
                .frame(maxWidth: .infinity, alignment: mode == .client ? .leading : .trailing)

                RoleCharacter(mode: mode)
                    .frame(width: 170, height: 180)
                    .transition(.scale.combined(with: .opacity))
                    .id(mode)

                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(mode.floorFill)
                        .frame(height: 76)
                        .rotation3DEffect(
                            .degrees(mode == .contractor ? 180 : 0),
                            axis: (x: 1, y: 0, z: 0),
                            perspective: 0.35
                        )

                    Text(mode.floorTitle)
                        .font(.headline)
                        .foregroundStyle(.white)
                }
            }
            .padding(YavaaSpacing.lg)
        }
        .frame(height: 380)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .animation(.spring(response: 0.6, dampingFraction: 0.82), value: mode)
    }
}

private struct RoleCharacter: View {
    let mode: AppMode

    var body: some View {
        ZStack {
            Circle()
                .fill(mode.characterAccent.opacity(0.18))
                .frame(width: 158, height: 158)

            VStack(spacing: 0) {
                Circle()
                    .fill(Color(red: 0.92, green: 0.73, blue: 0.55))
                    .frame(width: 56, height: 56)
                    .overlay(alignment: .top) {
                        Capsule()
                            .fill(mode.hairFill)
                            .frame(width: 62, height: 22)
                            .offset(y: -4)
                    }

                RoundedRectangle(cornerRadius: 18)
                    .fill(mode.characterAccent)
                    .frame(width: 92, height: 92)
                    .overlay {
                        Image(systemName: mode.badgeSystemName)
                            .font(.largeTitle)
                    }
            }

            if mode == .contractor {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(red: 0.96, green: 0.68, blue: 0.18))
                    .frame(width: 76, height: 24)
                    .offset(y: -70)
            }
        }
    }
}

private extension AppMode {
    var pickerTitle: String {
        switch self {
        case .client:
            "Jefe"
        case .contractor:
            "Constructor"
        }
    }

    var callToActionTitle: String {
        switch self {
        case .client:
            "jefe"
        case .contractor:
            "constructor"
        }
    }

    var subtitle: String {
        switch self {
        case .client:
            "Vas a pedir, coordinar y controlar trabajos."
        case .contractor:
            "Vas a recibir solicitudes y organizar tus servicios."
        }
    }

    var iconSystemName: String {
        switch self {
        case .client:
            "person.crop.square"
        case .contractor:
            "hammer"
        }
    }

    var floorTitle: String {
        switch self {
        case .client:
            "Escenario jefe"
        case .contractor:
            "Escenario constructor"
        }
    }

    var background: Color {
        switch self {
        case .client:
            Color(red: 0.97, green: 0.98, blue: 1)
        case .contractor:
            Color(red: 0.97, green: 0.95, blue: 0.9)
        }
    }

    var sceneFill: Color {
        switch self {
        case .client:
            Color(red: 0.88, green: 0.94, blue: 0.98)
        case .contractor:
            Color(red: 0.95, green: 0.89, blue: 0.78)
        }
    }

    var windowFill: Color {
        switch self {
        case .client:
            Color(red: 0.46, green: 0.68, blue: 0.86)
        case .contractor:
            Color(red: 0.76, green: 0.43, blue: 0.23)
        }
    }

    var floorFill: Color {
        switch self {
        case .client:
            Color(red: 0.16, green: 0.38, blue: 0.54)
        case .contractor:
            Color(red: 0.56, green: 0.36, blue: 0.18)
        }
    }

    var characterAccent: Color {
        switch self {
        case .client:
            YavaaColor.accent
        case .contractor:
            YavaaColor.warning
        }
    }

    var hairFill: Color {
        switch self {
        case .client:
            Color(red: 0.18, green: 0.18, blue: 0.22)
        case .contractor:
            Color(red: 0.37, green: 0.2, blue: 0.08)
        }
    }

    var badgeSystemName: String {
        switch self {
        case .client:
            "checkmark.seal"
        case .contractor:
            "wrench.and.screwdriver"
        }
    }
}
