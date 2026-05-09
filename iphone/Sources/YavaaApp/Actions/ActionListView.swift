import SwiftUI

public struct ActionListView: View {
    public let actions: [MobileAction]
    public let onSelect: (MobileAction) -> Void

    public init(actions: [MobileAction], onSelect: @escaping (MobileAction) -> Void) {
        self.actions = actions
        self.onSelect = onSelect
    }

    public var body: some View {
        List(actions, id: \.self) { action in
            Button {
                onSelect(action)
            } label: {
                Text(action.title)
                    .foregroundStyle(action.isImplementedInCurrentSlice ? Color.primary : Color.secondary)
            }
            .disabled(!action.isImplementedInCurrentSlice)
        }
    }
}
