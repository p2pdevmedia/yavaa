import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

public enum YavaaColor {
    public static let background = systemBackground()
    public static let surface = secondaryBackground()
    public static let accent = Color(red: 0.09, green: 0.45, blue: 0.43)
    public static let warning = Color(red: 0.78, green: 0.33, blue: 0.12)

    private static func systemBackground() -> Color {
        #if canImport(UIKit)
        return Color(uiColor: .systemBackground)
        #elseif canImport(AppKit)
        return Color(nsColor: .windowBackgroundColor)
        #else
        return Color(.white)
        #endif
    }

    private static func secondaryBackground() -> Color {
        #if canImport(UIKit)
        return Color(uiColor: .secondarySystemBackground)
        #elseif canImport(AppKit)
        return Color(nsColor: .controlBackgroundColor)
        #else
        return Color(.gray.opacity(0.12))
        #endif
    }
}

public enum YavaaSpacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 24
}

public struct PrimaryActionButton: View {
    private let title: String
    private let action: () -> Void

    public init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, YavaaSpacing.md)
        }
        .buttonStyle(.borderedProminent)
        .tint(YavaaColor.accent)
    }
}
