import Foundation
import SwiftUI
import YavaaDesign

public struct GuestEmergencyDraft: Codable, Equatable, Sendable {
    public var category: String
    public var address: String
    public var description: String
    public var contactPhone: String

    public init(
        category: String = "",
        address: String = "",
        description: String = "",
        contactPhone: String = ""
    ) {
        self.category = category
        self.address = address
        self.description = description
        self.contactPhone = contactPhone
    }

    public var hasContent: Bool {
        !category.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !address.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !contactPhone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

public struct GuestMobileShellView: View {
    private let signIn: (String, String) async throws -> Void
    private let signUp: (String, String) async throws -> Void
    private let googleSignIn: () async throws -> Void
    private let emergencySignIn: (String, String) async throws -> Void
    private let emergencySignUp: (String, String) async throws -> Void
    private let emergencyGoogleSignIn: () async throws -> Void

    @State private var selectedTab: MobileTab = .home

    public init(
        signIn: @escaping (String, String) async throws -> Void,
        signUp: @escaping (String, String) async throws -> Void,
        googleSignIn: @escaping () async throws -> Void,
        emergencySignIn: @escaping (String, String) async throws -> Void,
        emergencySignUp: @escaping (String, String) async throws -> Void,
        emergencyGoogleSignIn: @escaping () async throws -> Void
    ) {
        self.signIn = signIn
        self.signUp = signUp
        self.googleSignIn = googleSignIn
        self.emergencySignIn = emergencySignIn
        self.emergencySignUp = emergencySignUp
        self.emergencyGoogleSignIn = emergencyGoogleSignIn
    }

    public var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                GuestHomeView()
                    .navigationTitle("Inicio")
            }
            .tabItem {
                Label("Inicio", systemImage: MobileTab.home.systemImageName)
            }
            .tag(MobileTab.home)

            NavigationStack {
                GuestEmergencyDraftView {
                    selectedTab = .profile
                }
                .navigationTitle("Urgencias")
            }
            .tabItem {
                Label("Urgencias", systemImage: MobileTab.urgencies.systemImageName)
            }
            .tag(MobileTab.urgencies)

            NavigationStack {
                GuestProfileAuthView(
                    signIn: signIn,
                    signUp: signUp,
                    googleSignIn: googleSignIn,
                    emergencySignIn: emergencySignIn,
                    emergencySignUp: emergencySignUp,
                    emergencyGoogleSignIn: emergencyGoogleSignIn
                )
                .navigationTitle("Perfil")
            }
            .tabItem {
                Label("Perfil", systemImage: MobileTab.profile.systemImageName)
            }
            .tag(MobileTab.profile)
        }
        #if os(iOS)
        .toolbar(.visible, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarBackground(YavaaColor.surface, for: .tabBar)
        #endif
    }
}

private struct GuestHomeView: View {
    var body: some View {
        List {
            Section("Inicio") {
                Text("Explora Yavaa, prepara urgencias y entra desde Perfil cuando quieras pedir o trabajar.")
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct GuestEmergencyDraftView: View {
    let continueToAuth: () -> Void

    @AppStorage("lat.yavaa.iphone.public-emergency-draft")
    private var storedDraft = ""
    @State private var draft = GuestEmergencyDraft()

    var body: some View {
        Form {
            Section("Urgencia") {
                TextField("Tipo de trabajo", text: $draft.category)
                TextField("Direccion o propiedad", text: $draft.address)
                TextField("Que esta pasando?", text: $draft.description, axis: .vertical)
                    .lineLimit(3...6)
                TextField("Telefono de contacto", text: $draft.contactPhone)
                    #if os(iOS)
                    .keyboardType(.phonePad)
                    #endif
            }

            Section {
                PrimaryActionButton("Iniciar sesion para enviar") {
                    saveDraft()
                    continueToAuth()
                }
                .disabled(!draft.hasContent)
            }

            Section {
                Text("Guardamos este borrador en el dispositivo. Despues del login desde esta urgencia, Yavaa entra directo como Jefe.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .onAppear {
            draft = decodeDraft(storedDraft)
        }
        .onChange(of: draft) { _, _ in
            saveDraft()
        }
    }

    private func saveDraft() {
        guard let encoded = try? JSONEncoder().encode(draft),
              let stringValue = String(data: encoded, encoding: .utf8) else {
            return
        }

        storedDraft = stringValue
    }

    private func decodeDraft(_ value: String) -> GuestEmergencyDraft {
        guard let data = value.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(GuestEmergencyDraft.self, from: data) else {
            return GuestEmergencyDraft()
        }

        return decoded
    }
}

private struct GuestProfileAuthView: View {
    let signIn: (String, String) async throws -> Void
    let signUp: (String, String) async throws -> Void
    let googleSignIn: () async throws -> Void
    let emergencySignIn: (String, String) async throws -> Void
    let emergencySignUp: (String, String) async throws -> Void
    let emergencyGoogleSignIn: () async throws -> Void

    @AppStorage("lat.yavaa.iphone.public-emergency-draft")
    private var storedDraft = ""

    var body: some View {
        TabView {
            LoginView(
                onSubmit: activeSignIn,
                onGoogleSignIn: activeGoogleSignIn
            )
            .tabItem {
                Text("Ingresar")
            }

            SignUpView(
                onSubmit: activeSignUp,
                onGoogleSignIn: activeGoogleSignIn
            )
            .tabItem {
                Text("Crear cuenta")
            }
        }
    }

    private var hasEmergencyDraft: Bool {
        guard let data = storedDraft.data(using: .utf8),
              let draft = try? JSONDecoder().decode(GuestEmergencyDraft.self, from: data) else {
            return false
        }

        return draft.hasContent
    }

    private func activeSignIn(email: String, password: String) async throws {
        if hasEmergencyDraft {
            try await emergencySignIn(email, password)
        } else {
            try await signIn(email, password)
        }
    }

    private func activeSignUp(email: String, password: String) async throws {
        if hasEmergencyDraft {
            try await emergencySignUp(email, password)
        } else {
            try await signUp(email, password)
        }
    }

    private func activeGoogleSignIn() async throws {
        if hasEmergencyDraft {
            try await emergencyGoogleSignIn()
        } else {
            try await googleSignIn()
        }
    }
}
