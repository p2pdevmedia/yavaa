import SwiftUI
import YavaaDesign

public struct LoginView: View {
    private let onSubmit: (String, String) async throws -> Void

    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
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
                    .textContentType(.password)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(YavaaColor.warning)
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
                        Text("Ingresar")
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(isSubmitDisabled)
            }
        }
        .navigationTitle("Ingresar")
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var isSubmitDisabled: Bool {
        isSubmitting || trimmedEmail.isEmpty || password.isEmpty
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
}
