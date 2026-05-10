import SwiftUI
import YavaaAuth
import YavaaDesign

public struct SignUpView: View {
    private let onSubmit: (String, String) async throws -> Void
    private let onGoogleSignIn: () async throws -> Void

    @State private var email = ""
    @State private var password = ""
    @State private var message: String?
    @State private var isMessageError = false
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
                        title: "Crear cuenta",
                        subtitle: "Activa tu acceso para pedir trabajos, guardar direcciones y coordinar urgencias."
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
                            }

                            VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
                                Text("Contrasena")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(YavaaColor.foreground)

                                SecureField("Minimo 6 caracteres", text: $password)
                                    .textContentType(.newPassword)
                                    .yavaaInputField()
                            }

                            Text("Usa al menos 6 caracteres.")
                                .font(.caption)
                                .foregroundStyle(YavaaColor.mutedForeground)

                            if let message {
                                YavaaStatusBanner(message, isError: isMessageError)
                            }

                            PrimaryActionButton(isSubmitting ? "Creando..." : "Crear cuenta") {
                                submit()
                            }
                            .disabled(isSubmitDisabled)

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
                        }
                    }

                    Text("La cuenta puede operar como jefe, trabajador o ambos segun los roles aprobados por Yavaa.")
                        .font(.footnote)
                        .foregroundStyle(YavaaColor.mutedForeground)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(YavaaSpacing.lg)
            }
        }
        .navigationTitle("Crear cuenta")
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSubmitDisabled: Bool {
        isSubmitting || isSigningInWithGoogle || trimmedEmail.isEmpty || password.count < 6
    }

    private func submit() {
        guard !isSubmitDisabled else {
            return
        }

        message = nil
        isMessageError = false
        isSubmitting = true

        Task {
            do {
                try await onSubmit(trimmedEmail, password)
            } catch AuthServiceError.confirmationRequired {
                message = "Cuenta creada. Revisa tu email para confirmar el acceso."
                isMessageError = false
            } catch {
                message = "No pudimos crear la cuenta. Revisa tus datos e intenta de nuevo."
                isMessageError = true
            }

            isSubmitting = false
        }
    }

    private func signInWithGoogle() {
        guard !isSigningInWithGoogle && !isSubmitting else {
            return
        }

        message = nil
        isMessageError = false
        isSigningInWithGoogle = true

        Task {
            do {
                try await onGoogleSignIn()
            } catch {
                message = "No pudimos continuar con Google. Intenta de nuevo."
                isMessageError = true
            }

            isSigningInWithGoogle = false
        }
    }
}
