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
    @Published public private(set) var roleSelectionPresentation: RoleSelectionPresentation = .none

    private let apiClient: APIClient
    private let sessionController: SessionController
    private var modeSelectionRevision = 0
    private var latestPickerRequestedMode: AppMode?
    private var completedRoleSelectionAccountID: String?

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
        completedRoleSelectionAccountID = nil
        presentRoleSelectionIfNeeded(for: sessionState)
    }

    public func signUp(email: String, password: String) async throws {
        modeSelectionRevision += 1
        sessionState = try await sessionController.signUp(email: email, password: password)
        completedRoleSelectionAccountID = nil
        presentRoleSelectionIfNeeded(for: sessionState)
    }

    public func signOut() async {
        modeSelectionRevision += 1
        do {
            sessionState = try await sessionController.signOut()
        } catch {
            sessionState = .signedOut
        }
        roleSelectionPresentation = .none
        completedRoleSelectionAccountID = nil
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

    public func finishRoleSelection(with mode: AppMode) async {
        completedRoleSelectionAccountID = sessionState.account?.id
        roleSelectionPresentation = .none
        await selectMode(mode)
    }

    public func loadClientHome(category: String?) async throws -> ClientHomeData {
        async let categories = apiClient.fetchCatalogCategories()
        async let providers = apiClient.searchProviders(category: category)
        let loadedCategories = try await categories
        let loadedProviders = try await providers

        return ClientHomeData(
            categories: loadedCategories.categories,
            providers: loadedProviders.items
        )
    }

    public func loadBookings() async throws -> [BookingSummary] {
        try await apiClient.fetchBookings().bookings
    }

    public func acceptBooking(_ bookingId: String) async throws {
        _ = try await apiClient.actOnBooking(
            id: bookingId,
            input: BookingActionInput(action: .accept)
        )
    }

    public func rejectBooking(_ bookingId: String) async throws {
        _ = try await apiClient.actOnBooking(
            id: bookingId,
            input: BookingActionInput(action: .reject)
        )
    }

    public func loadProfile() async throws -> WebsiteAppUser? {
        let response = try await apiClient.fetchCurrentSession()
        applySessionResponse(response)
        return response.appUser
    }

    public func updateProfile(_ input: ProfileUpdateInput) async throws {
        let response = try await apiClient.updateProfile(input)
        applySessionResponse(response)
    }

    public func createAddress(_ input: AddressInput) async throws {
        let response = try await apiClient.createAddress(input)
        applySessionResponse(response)
    }

    public func updateAddress(id: String, input: AddressPatchInput) async throws {
        let response = try await apiClient.updateAddress(id: id, input: input)
        applySessionResponse(response)
    }

    public func deleteAddress(id: String) async throws {
        let response = try await apiClient.deleteAddress(id: id)
        applySessionResponse(response)
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

    private func presentRoleSelectionIfNeeded(for state: SessionState) {
        guard let account = state.account else {
            roleSelectionPresentation = .none
            return
        }

        let presentation = RoleSelectionPresentation.presentation(for: state)
        guard presentation != .none,
              completedRoleSelectionAccountID != account.id else {
            roleSelectionPresentation = .none
            return
        }

        roleSelectionPresentation = presentation
    }

    private func applySessionResponse(_ response: WebsiteMeResponse) {
        sessionState = response.toSessionState(preferredMode: sessionState.mode)
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
            } else if container.roleSelectionPresentation != .none {
                RoleSelectionView(
                    presentation: container.roleSelectionPresentation
                ) { mode in
                    await container.finishRoleSelection(with: mode)
                }
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
        MobileModeShellView(container: container)
    }
}

struct YavaaAppConfiguration {
    let apiEnvironment: APIEnvironment
    let authService: AuthenticationService?

    static func load(
        environment: [String: String] = ProcessInfo.processInfo.environment,
        bundleInfo: [String: Any] = Bundle.main.infoDictionary ?? [:]
    ) -> YavaaAppConfiguration {
        let apiEnvironment = configurationValue(
            "YAVAA_API_BASE_URL",
            environment: environment,
            bundleInfo: bundleInfo
        )
            .flatMap(URL.init(string:))
            .map(APIEnvironment.init(baseURL:)) ?? .production

        let authService: AuthenticationService?
        if let supabaseURLString = configurationValue(
            "YAVAA_SUPABASE_URL",
            environment: environment,
            bundleInfo: bundleInfo
        ),
           let supabaseURL = URL(string: supabaseURLString),
           let publishableKey = configurationValue(
                "YAVAA_SUPABASE_PUBLISHABLE_KEY",
                environment: environment,
                bundleInfo: bundleInfo
           ),
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

    private static func configurationValue(
        _ key: String,
        environment: [String: String],
        bundleInfo: [String: Any]
    ) -> String? {
        if let value = environment[key], !value.isEmpty {
            return value
        }

        return bundleInfo[key] as? String
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
