import SwiftUI
import YavaaAPI
import YavaaAuth
import YavaaCore
import YavaaDesign

@MainActor
public final class AppContainer: ObservableObject {
    @Published public private(set) var sessionState: SessionState = .signedOut
    @Published public private(set) var apiStatus: String = "Sin verificar"

    private let apiClient: APIClient
    private let sessionController: SessionController

    public init(apiEnvironment: APIEnvironment = .localWebsite) {
        let tokenStore = InMemorySessionTokenStore()
        let tokenProvider = StoredAccessTokenProvider(store: tokenStore)
        let apiClient = APIClient(environment: apiEnvironment, tokenProvider: tokenProvider)

        self.apiClient = apiClient
        self.sessionController = SessionController(apiClient: apiClient)
    }

    public func bootstrap() async {
        sessionState = await sessionController.refreshSession()

        do {
            let document = try await apiClient.fetchOpenAPIDocument()
            apiStatus = "\(document.info.title) \(document.info.version)"
        } catch {
            apiStatus = "API no disponible"
        }
    }
}

public struct YavaaRootView: View {
    @StateObject private var container: AppContainer

    public init(apiEnvironment: APIEnvironment = .localWebsite) {
        _container = StateObject(wrappedValue: AppContainer(apiEnvironment: apiEnvironment))
    }

    public var body: some View {
        NavigationStack {
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
                    Text(container.sessionState.isAuthenticated ? "Autenticada" : "Sin iniciar sesion")
                        .foregroundStyle(.secondary)
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
        .task {
            await container.bootstrap()
        }
    }
}

public struct YavaaMobileApp: App {
    public init() {}

    public var body: some Scene {
        WindowGroup {
            YavaaRootView()
        }
    }
}
