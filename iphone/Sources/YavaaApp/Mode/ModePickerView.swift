import SwiftUI
import YavaaCore

public struct ModePickerView: View {
    private let modes: [AppMode]
    @Binding private var selectedMode: AppMode?
    private let onSelect: (AppMode) async -> Void

    public init(
        modes: [AppMode],
        selectedMode: Binding<AppMode?>,
        onSelect: @escaping (AppMode) async -> Void
    ) {
        self.modes = modes
        self._selectedMode = selectedMode
        self.onSelect = onSelect
    }

    public var body: some View {
        Picker("Modo", selection: $selectedMode) {
            ForEach(modes, id: \.self) { mode in
                Text(mode.title)
                    .tag(Optional(mode))
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: selectedMode) { _, mode in
            guard let mode else {
                return
            }

            Task {
                await onSelect(mode)
            }
        }
    }
}

private extension AppMode {
    var title: String {
        switch self {
        case .client:
            "Jefe"
        case .contractor:
            "Trabajador"
        }
    }
}
