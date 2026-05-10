import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

public enum YavaaColor {
    public static let background = Color(red: 0.94, green: 0.91, blue: 0.86)
    public static let backgroundTop = Color(red: 1.0, green: 0.98, blue: 0.94)
    public static let surface = Color(red: 1.0, green: 0.98, blue: 0.94)
    public static let mutedSurface = Color(red: 0.91, green: 0.87, blue: 0.80)
    public static let border = Color(red: 0.78, green: 0.70, blue: 0.60)
    public static let foreground = Color(red: 0.12, green: 0.09, blue: 0.07)
    public static let mutedForeground = Color(red: 0.43, green: 0.36, blue: 0.31)
    public static let accent = Color(red: 0.75, green: 0.28, blue: 0.17)
    public static let secondaryAccent = Color(red: 0.21, green: 0.42, blue: 0.24)
    public static let warning = Color(red: 0.72, green: 0.12, blue: 0.10)

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
    public static let xl: CGFloat = 32
}

public struct YavaaBackground: View {
    public init() {}

    public var body: some View {
        LinearGradient(
            colors: [
                YavaaColor.backgroundTop,
                YavaaColor.background
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}

public struct YavaaCard<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .padding(YavaaSpacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(YavaaColor.surface)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(YavaaColor.border.opacity(0.72), lineWidth: 1)
            }
            .shadow(color: Color.black.opacity(0.06), radius: 18, y: 10)
    }
}

public struct YavaaBrandHeader: View {
    private let title: String
    private let subtitle: String

    public init(title: String, subtitle: String) {
        self.title = title
        self.subtitle = subtitle
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: YavaaSpacing.sm) {
            Text("Yavaa")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundStyle(YavaaColor.foreground)

            Text(title)
                .font(.title2.weight(.semibold))
                .foregroundStyle(YavaaColor.foreground)

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(YavaaColor.mutedForeground)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

public struct YavaaStatusBanner: View {
    private let message: String
    private let isError: Bool

    public init(_ message: String, isError: Bool = false) {
        self.message = message
        self.isError = isError
    }

    public var body: some View {
        Text(message)
            .font(.footnote)
            .foregroundStyle(isError ? YavaaColor.warning : YavaaColor.mutedForeground)
            .padding(YavaaSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background((isError ? YavaaColor.warning : YavaaColor.mutedForeground).opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke((isError ? YavaaColor.warning : YavaaColor.border).opacity(0.35), lineWidth: 1)
            }
    }
}

private struct YavaaInputFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(.horizontal, YavaaSpacing.md)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.64))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay {
                RoundedRectangle(cornerRadius: 8)
                    .stroke(YavaaColor.border.opacity(0.7), lineWidth: 1)
            }
            .foregroundStyle(YavaaColor.foreground)
    }
}

public extension View {
    func yavaaInputField() -> some View {
        modifier(YavaaInputFieldModifier())
    }
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
                .padding(.vertical, 14)
        }
        .buttonStyle(.borderedProminent)
        .tint(YavaaColor.accent)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
