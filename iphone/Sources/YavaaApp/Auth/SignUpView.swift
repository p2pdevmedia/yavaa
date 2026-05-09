import SwiftUI
import YavaaAuth
import YavaaDesign

public struct SignUpView: View {
    private let onSubmit: (String, String) async throws -> Void

    @State private var email = ""
    @State private var password = ""
    @State private var message: String?
    @State private var isMessageError = false
    @State private var isSubmitting = false

    public init(onSubmit: @escaping (String, String) async throws -> Void) {
        self.onSubmit = onSubmit
    }

    public var body: some View {
        Form {
            Section {
                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .autocorrectionDisabled()

                SecureField("Password", text: $password)
                    .textContentType(.newPassword)
            } footer: {
                Text("Usa al menos 6 caracteres.")
            }

            if let message {
                Section {
                    Text(message)
                        .foregroundStyle(isMessageError ? YavaaColor.warning : .secondary)
                }
            }

            Section {
                Button {
                    submit()
                } label: {
                    if isSubmitting {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Crear cuenta")
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(isSubmitDisabled)
            }
        }
        .navigationTitle("Crear cuenta")
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSubmitDisabled: Bool {
        isSubmitting || trimmedEmail.isEmpty || password.count < 6
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
}
