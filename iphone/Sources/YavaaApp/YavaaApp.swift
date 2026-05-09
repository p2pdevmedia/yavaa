import Foundation
import SwiftUI
import YavaaAPI
import YavaaAuth
import YavaaCore
import YavaaDesign

@MainActor
public final class AppContainer: ObservableObject {
    @Published public private(set) var sessionState: SessionState = .signedOut
    @Published public private(set) var apiStatus: String = "Sin verificar"
    @Published public private(set) var isBootstrapping = true

    private let apiClient: APIClient
    private let sessionController: SessionController
    private var modeSelectionRevision = 0
    private var latestPickerRequestedMode: AppMode?

    public init(
        apiEnvironment: APIEnvironment = .localWebsite,
        authService: AuthenticationService? = nil
    ) {
        let tokenStore = KeychainSessionTokenStore()
        let tokenProvider = StoredAccessTokenProvider(store: tokenStore)
        let apiClient = APIClient(environment: apiEnvironment, tokenProvider: tokenProvider)

        self.apiClient = apiClient
        self.sessionController = SessionController(
            apiClient: apiClient,
            tokenStore: tokenStore,
            preferredModeStore: UserDefaultsPreferredModeStore(
                key: "lat.yavaa.iphone.preferred-mode"
            ),
            authService: authService
        )
    }

    public func bootstrap() async {
        modeSelectionRevision += 1
        isBootstrapping = true
        defer {
            isBootstrapping = false
        }

        sessionState = await sessionController.refreshSession()

        do {
            let document = try await apiClient.fetchOpenAPIDocument()
            apiStatus = "\(document.info.title) \(document.info.version)"
        } catch {
            apiStatus = "API no disponible"
        }
    }

    public func signIn(email: String, password: String) async throws {
        modeSelectionRevision += 1
        sessionState = try await sessionController.signIn(email: email, password: password)
    }

    public func signUp(email: String, password: String) async throws {
        modeSelectionRevision += 1
        sessionState = try await sessionController.signUp(email: email, password: password)
    }

    public func signOut() async {
        modeSelectionRevision += 1
        do {
            sessionState = try await sessionController.signOut()
        } catch {
            sessionState = .signedOut
        }
    }

    public func selectMode(_ mode: AppMode) async {
        if let latestPickerRequestedMode,
           latestPickerRequestedMode != mode {
            return
        }

        modeSelectionRevision += 1
        let revision = modeSelectionRevision

        do {
            let nextState = try await sessionController.selectMode(mode, currentSession: sessionState)
            guard isCurrentModeSelection(revision: revision, mode: mode) else {
                return
            }
            sessionState = nextState
        } catch {
            let refreshedState = await sessionController.refreshSession()
            guard isCurrentModeSelection(revision: revision, mode: mode) else {
                return
            }
            sessionState = refreshedState
        }
    }

    fileprivate func updateSelectedModeForPicker(_ mode: AppMode?) {
        guard let mode else {
            return
        }

        do {
            modeSelectionRevision += 1
            latestPickerRequestedMode = mode
            sessionState = try sessionState.selectingMode(mode)
        } catch {
        }
    }

    private func isCurrentModeSelection(revision: Int, mode: AppMode) -> Bool {
        revision == modeSelectionRevision
            && (latestPickerRequestedMode == nil || latestPickerRequestedMode == mode)
    }
}

public struct YavaaRootView: View {
    @StateObject private var container: AppContainer

    public init(
        apiEnvironment: APIEnvironment = .localWebsite,
        authService: AuthenticationService? = nil
    ) {
        _container = StateObject(
            wrappedValue: AppContainer(
                apiEnvironment: apiEnvironment,
                authService: authService
            )
        )
    }

    public var body: some View {
        NavigationStack {
            if container.isBootstrapping {
                bootstrappingView
            } else if container.sessionState.isAuthenticated {
                signedInShell
            } else {
                authTabs
            }
        }
        .task {
            await container.bootstrap()
        }
    }

    private var bootstrappingView: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .navigationTitle("Inicio")
    }

    private var authTabs: some View {
        TabView {
            LoginView { email, password in
                try await container.signIn(email: email, password: password)
            }
            .tabItem {
                Text("Ingresar")
            }

            SignUpView { email, password in
                try await container.signUp(email: email, password: password)
            }
            .tabItem {
                Text("Crear cuenta")
            }
        }
    }

    private var signedInShell: some View {
        VStack(alignment: .leading, spacing: YavaaSpacing.lg) {
            VStack(alignment: .leading, spacing: YavaaSpacing.sm) {
                Text("Yavaa")
                    .font(.largeTitle.weight(.bold))

                Text("Marketplace de servicios")
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: YavaaSpacing.sm) {
                Text("Website API")
                    .font(.headline)
                Text(container.apiStatus)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(YavaaColor.surface)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: YavaaSpacing.sm) {
                Text("Sesion")
                    .font(.headline)
                Text("Autenticada")
                    .foregroundStyle(.secondary)
            }

            if let account = container.sessionState.account,
               account.availableModes.count > 1 {
                ModePickerView(
                    modes: account.availableModes,
                    selectedMode: Binding(
                        get: {
                            container.sessionState.mode
                        },
                        set: { mode in
                            container.updateSelectedModeForPicker(mode)
                        }
                    ),
                    onSelect: { mode in
                        await container.selectMode(mode)
                    }
                )
            }

            Spacer()

            PrimaryActionButton("Reintentar conexion") {
                Task {
                    await container.bootstrap()
                }
            }
        }
        .padding(YavaaSpacing.lg)
        .navigationTitle("Inicio")
    }
}

private struct YavaaAppConfiguration {
    let apiEnvironment: APIEnvironment
    let authService: AuthenticationService?

    static func load(
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> YavaaAppConfiguration {
        let apiEnvironment = environment["YAVAA_API_BASE_URL"]
            .flatMap(URL.init(string:))
            .map(APIEnvironment.init(baseURL:)) ?? .production

        let authService: AuthenticationService?
        if let supabaseURLString = environment["YAVAA_SUPABASE_URL"],
           let supabaseURL = URL(string: supabaseURLString),
           let publishableKey = environment["YAVAA_SUPABASE_PUBLISHABLE_KEY"],
           !publishableKey.isEmpty {
            authService = SupabaseAuthenticationService(
                url: supabaseURL,
                publishableKey: publishableKey
            )
        } else {
            authService = nil
        }

        return YavaaAppConfiguration(
            apiEnvironment: apiEnvironment,
            authService: authService
        )
    }
}

public struct YavaaMobileApp: App {
    private let configuration = YavaaAppConfiguration.load()

    public init() {}

    public var body: some Scene {
        WindowGroup {
            YavaaRootView(
                apiEnvironment: configuration.apiEnvironment,
                authService: configuration.authService
            )
        }
    }
}
