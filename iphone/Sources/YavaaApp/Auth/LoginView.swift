import SwiftUI
import YavaaDesign

public struct LoginView: View {
    private let onSubmit: (String, String) async throws -> Void
    private let onGoogleSignIn: () async throws -> Void

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false
    @State private var isSigningInWithGoogle = false

    public init(
        onSubmit: @escaping (String, String) async throws -> Void,
        onGoogleSignIn: @escaping () async throws -> Void
    ) {
        self.onSubmit = onSubmit
        self.onGoogleSignIn = onGoogleSignIn
    }

    public var body: some View {
        ZStack {
            YavaaBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: YavaaSpacing.lg) {
                    YavaaBrandHeader(
                        title: "Iniciar sesion",
                        subtitle: "Entra con tu correo para coordinar trabajos, urgencias y conversaciones."
                    )

                    YavaaCard {
                        VStack(alignment: .leading, spacing: YavaaSpacing.md) {
                            VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
                                Text("Correo electronico")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(YavaaColor.foreground)

                                TextField("tu@email.com", text: $email)
                                    .textContentType(.emailAddress)
                                    .autocorrectionDisabled()
                                    .yavaaInputField()
                                    .accessibilityIdentifier("login.email")
                            }

                            VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
                                Text("Contrasena")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(YavaaColor.foreground)

                                SecureField("Minimo 6 caracteres", text: $password)
                                    .textContentType(.password)
                                    .yavaaInputField()
                                    .accessibilityIdentifier("login.password")
                            }

                            if let errorMessage {
                                YavaaStatusBanner(errorMessage, isError: true)
                                    .accessibilityIdentifier("login.error")
                            }

                            PrimaryActionButton(isSubmitting ? "Ingresando..." : "Ingresar") {
                                submit()
                            }
                            .disabled(isSubmitDisabled)
                            .accessibilityIdentifier("login.submit")

                            Button {
                                signInWithGoogle()
                            } label: {
                                HStack(spacing: YavaaSpacing.sm) {
                                    Text("G")
                                        .font(.headline.weight(.bold))

                                    Text(isSigningInWithGoogle ? "Conectando..." : "Continuar con Google")
                                        .font(.headline)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                            }
                            .buttonStyle(.bordered)
                            .tint(YavaaColor.foreground)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .disabled(isSigningInWithGoogle || isSubmitting)
                            .accessibilityIdentifier("login.google")
                        }
                    }

                    Text("Yavaa conecta clientes, trabajadores y agentes con reglas claras y datos confiables.")
                        .font(.footnote)
                        .foregroundStyle(YavaaColor.mutedForeground)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(YavaaSpacing.lg)
            }
        }
        .navigationTitle("Ingresar")
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSubmitDisabled: Bool {
        isSubmitting || isSigningInWithGoogle || trimmedEmail.isEmpty || password.isEmpty
    }

    private func submit() {
        guard !isSubmitDisabled else {
            return
        }

        errorMessage = nil
        isSubmitting = true

        Task {
            do {
                try await onSubmit(trimmedEmail, password)
            } catch {
                errorMessage = "No pudimos iniciar sesion. Revisa tus datos e intenta de nuevo."
            }

            isSubmitting = false
        }
    }

    private func signInWithGoogle() {
        guard !isSigningInWithGoogle && !isSubmitting else {
            return
        }

        errorMessage = nil
        isSigningInWithGoogle = true

        Task {
            do {
                try await onGoogleSignIn()
            } catch {
                errorMessage = "No pudimos iniciar sesion con Google. Intenta de nuevo."
            }

            isSigningInWithGoogle = false
        }
    }
}
