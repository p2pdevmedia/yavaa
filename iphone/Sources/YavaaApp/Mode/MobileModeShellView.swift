import SwiftUI
import YavaaAPI
import YavaaCore
import YavaaDesign

public struct MobileModeShellView: View {
    @ObservedObject private var container: AppContainer

    public init(container: AppContainer) {
        self.container = container
    }

    public var body: some View {
        TabView {
            ForEach(activeTabs, id: \.self) { tab in
                tabView(tab)
                    .tabItem {
                        Label(tab.title, systemImage: tab.systemImageName)
                    }
            }
        }
        .navigationTitle(container.sessionState.mode?.title ?? "Yavaa")
    }

    private var activeTabs: [MobileTab] {
        guard let mode = container.sessionState.mode else {
            return [.profile]
        }

        return MobileTabMap.tabs(for: mode)
    }

    @ViewBuilder
    private func tabView(_ tab: MobileTab) -> some View {
        switch tab {
        case .home:
            ClientYavaaView(
                load: container.loadClientHome,
                loadProfile: container.loadProviderProfile
            )
        case .yavaa:
            EmergencyCreateView(
                load: container.loadEmergencyComposerData,
                create: container.createEmergency
            )
        case .offers:
            ContractorBookingsView(
                kind: .offers,
                load: container.loadBookings,
                accept: container.acceptBooking,
                reject: container.rejectBooking
            )
        case .working:
            ContractorBookingsView(
                kind: .working,
                load: container.loadBookings,
                accept: container.acceptBooking,
                reject: container.rejectBooking
            )
        case .profile:
            ProfileWorkspaceView(
                account: container.sessionState.account,
                currentMode: container.sessionState.mode,
                availableModes: container.sessionState.account?.availableModes ?? [],
                loadProfile: container.loadProfile,
                updateProfile: container.updateProfile,
                createAddress: container.createAddress,
                updateAddress: container.updateAddress,
                deleteAddress: container.deleteAddress,
                switchMode: { mode in
                    await container.selectMode(mode)
                },
                signOut: {
                    await container.signOut()
                }
            )
        }
    }
}

private struct EmergencyCreateView: View {
    let load: () async throws -> EmergencyComposerData
    let create: (EmergencyRequestInput) async throws -> Void

    @State private var categories: [CatalogCategory] = []
    @State private var addresses: [WebsiteAddress] = []
    @State private var selectedCategoryId = ""
    @State private var selectedAddressId = ""
    @State private var description = ""
    @State private var isLoading = false
    @State private var statusMessage: String?

    var body: some View {
        Form {
            Section("Urgencia") {
                Text("Para trabajos que necesitan resolverse en la brevedad.")
                    .foregroundStyle(.secondary)

                Picker("Categoria", selection: $selectedCategoryId) {
                    ForEach(categories) { category in
                        Text(category.name)
                            .tag(category.id)
                    }
                }

                Picker("Direccion", selection: $selectedAddressId) {
                    ForEach(addresses, id: \.id) { address in
                        Text(address.label)
                            .tag(address.id)
                    }
                }

                TextField("Que hay que resolver?", text: $description, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                PrimaryActionButton("Crear urgencia") {
                    Task {
                        await submit()
                    }
                }
                .disabled(!canSubmit)
                .accessibilityIdentifier("emergency.create")
            }

            if let statusMessage {
                Section {
                    Text(statusMessage)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
            }
        }
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private var canSubmit: Bool {
        !selectedCategoryId.isEmpty
            && !selectedAddressId.isEmpty
            && description.trimmingCharacters(in: .whitespacesAndNewlines).count >= 8
    }

    private func reload() async {
        isLoading = true
        statusMessage = nil
        do {
            let data = try await load()
            categories = data.categories
            addresses = data.addresses
            selectedCategoryId = selectedCategoryId.isEmpty ? data.categories.first?.id ?? "" : selectedCategoryId
            selectedAddressId = selectedAddressId.isEmpty ? data.addresses.first?.id ?? "" : selectedAddressId
        } catch {
            statusMessage = "No se pudo cargar categorias y direcciones desde la API."
        }
        isLoading = false
    }

    private func submit() async {
        isLoading = true
        statusMessage = nil
        do {
            try await create(
                EmergencyRequestInput(
                    categoryId: selectedCategoryId,
                    addressId: selectedAddressId,
                    description: description
                )
            )
            description = ""
            statusMessage = "Urgencia creada. Yavaa esta buscando constructores disponibles."
        } catch {
            statusMessage = "No se pudo crear la urgencia en /api/emergencies."
        }
        isLoading = false
    }
}

private struct ClientYavaaView: View {
    let load: (String?) async throws -> ClientHomeData
    let loadProfile: (String) async throws -> PublicProviderProfile?

    @State private var categories: [CatalogCategory] = []
    @State private var providers: [PublicProviderCard] = []
    @State private var addresses: [WebsiteAddress] = []
    @State private var selectedCategory: String?
    @State private var query = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            Section("Trabajadores") {
                if let referenceLabel = NearbyWorkerMatcher.referenceLabel(addresses: addresses) {
                    Text("Cercanos a \(referenceLabel)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Agrega una direccion en Perfil para ordenar trabajadores cercanos.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: YavaaSpacing.sm) {
                        categoryButton(title: "Todas", slug: nil)
                        ForEach(categories) { category in
                            categoryButton(title: category.name, slug: category.slug)
                        }
                    }
                    .padding(.vertical, YavaaSpacing.xs)
                }

                TextField("Buscar por nombre", text: $query)

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(YavaaColor.warning)
                }

                if isLoading {
                    ProgressView()
                }

                ForEach(filteredNearbyProviders) { provider in
                    NavigationLink {
                        ProviderProfileView(
                            providerId: provider.contractorProfileId,
                            load: loadProfile
                        )
                    } label: {
                        ProviderRow(provider: provider)
                    }
                }
            }
        }
        .task {
            await reload(category: selectedCategory)
        }
        .refreshable {
            await reload(category: selectedCategory)
        }
    }

    private var filteredNearbyProviders: [PublicProviderCard] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let source = nearbyProviders
        guard !trimmedQuery.isEmpty else {
            return source
        }

        return source.filter { provider in
            provider.displayName.lowercased().contains(trimmedQuery)
                || (provider.bio?.lowercased().contains(trimmedQuery) ?? false)
                || provider.categories.contains { $0.name.lowercased().contains(trimmedQuery) }
        }
    }

    private var nearbyProviders: [PublicProviderCard] {
        NearbyWorkerMatcher.closestProviders(
            providers: providers,
            addresses: addresses
        )
    }

    private func categoryButton(title: String, slug: String?) -> some View {
        Button {
            selectedCategory = slug
            Task {
                await reload(category: slug)
            }
        } label: {
            Text(title)
        }
        .buttonStyle(.bordered)
        .tint(selectedCategory == slug ? YavaaColor.accent : .secondary)
    }

    private func reload(category: String?) async {
        isLoading = true
        errorMessage = nil
        do {
            let data = try await load(category)
            categories = data.categories
            providers = data.providers
            addresses = data.addresses
        } catch {
            errorMessage = "No se pudo cargar la API de Yavaa."
        }
        isLoading = false
    }
}

private struct ProviderProfileView: View {
    let providerId: String
    let load: (String) async throws -> PublicProviderProfile?

    @State private var provider: PublicProviderProfile?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            if isLoading {
                ProgressView()
            }

            if let errorMessage {
                Text(errorMessage)
                    .foregroundStyle(YavaaColor.warning)
            }

            if let provider {
                Section("Perfil") {
                    Text(provider.displayName)
                        .font(.title2.weight(.bold))

                    if let bio = provider.bio, !bio.isEmpty {
                        Text(bio)
                            .foregroundStyle(.secondary)
                    }

                    Text(provider.acceptsEmergencies ? "Acepta urgencias" : "No acepta urgencias")
                        .foregroundStyle(.secondary)

                    Text("Precio por hora no publicado")
                        .foregroundStyle(.secondary)
                }

                Section("Trabajos") {
                    ForEach(provider.categories, id: \.slug) { category in
                        Text(category.name)
                    }
                }

                Section("Zonas") {
                    ForEach(provider.workZones, id: \.slug) { zone in
                        VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
                            Text(zone.name)
                            if let description = zone.description, !description.isEmpty {
                                Text(description)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(provider?.displayName ?? "Trabajador")
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private func reload() async {
        isLoading = true
        errorMessage = nil
        do {
            provider = try await load(providerId)
            if provider == nil {
                errorMessage = "No se encontro el perfil publico."
            }
        } catch {
            errorMessage = "No se pudo cargar /api/providers/\(providerId)."
        }
        isLoading = false
    }
}

private struct ProviderRow: View {
    let provider: PublicProviderCard

    var body: some View {
        VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
            Text(provider.displayName)
                .font(.headline)

            if let bio = provider.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Text(providerLocation)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(provider.categories.map(\.name).joined(separator: ", "))
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, YavaaSpacing.xs)
    }

    private var providerLocation: String {
        [provider.marketCity, provider.marketProvince]
            .compactMap { $0 }
            .joined(separator: ", ")
    }
}

private enum ContractorBookingKind {
    case offers
    case working

    var title: String {
        switch self {
        case .offers:
            return "Ofertas nuevas"
        case .working:
            return "Trabajos en proceso"
        }
    }

    func includes(_ booking: BookingSummary) -> Bool {
        switch self {
        case .offers:
            return booking.status == "PENDING_ACCEPTANCE"
        case .working:
            return booking.status == "ACCEPTED"
        }
    }
}

private struct ContractorBookingsView: View {
    let kind: ContractorBookingKind
    let load: () async throws -> [BookingSummary]
    let accept: (String) async throws -> Void
    let reject: (String) async throws -> Void

    @State private var bookings: [BookingSummary] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            Section(kind.title) {
                Text("Conectado a /api/bookings")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if isLoading {
                    ProgressView()
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(YavaaColor.warning)
                }

                if visibleBookings.isEmpty && !isLoading {
                    Text("No hay trabajos para mostrar.")
                        .foregroundStyle(.secondary)
                }

                ForEach(visibleBookings) { booking in
                    BookingRow(
                        booking: booking,
                        canAct: kind == .offers,
                        accept: {
                            await actOnOffer(booking.id, action: accept)
                        },
                        reject: {
                            await actOnOffer(booking.id, action: reject)
                        }
                    )
                }
            }
        }
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private var visibleBookings: [BookingSummary] {
        bookings.filter(kind.includes)
    }

    private func reload() async {
        isLoading = true
        errorMessage = nil
        do {
            bookings = try await load()
        } catch {
            errorMessage = "No se pudo cargar /api/bookings."
        }
        isLoading = false
    }

    private func actOnOffer(_ bookingId: String, action: (String) async throws -> Void) async {
        isLoading = true
        errorMessage = nil
        do {
            try await action(bookingId)
            bookings = try await load()
        } catch {
            errorMessage = "No se pudo actualizar la oferta en /api/bookings/\(bookingId)."
        }
        isLoading = false
    }
}

private struct BookingRow: View {
    let booking: BookingSummary
    let canAct: Bool
    let accept: () async -> Void
    let reject: () async -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
            Text(booking.category.name)
                .font(.headline)
            Text(booking.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("\(booking.address.label) - \(booking.scheduledFor)")
                .font(.caption)
                .foregroundStyle(.secondary)

            if canAct {
                HStack {
                    Button("Aceptar") {
                        Task {
                            await accept()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(YavaaColor.accent)

                    Button("Rechazar") {
                        Task {
                            await reject()
                        }
                    }
                    .buttonStyle(.bordered)
                    .tint(YavaaColor.warning)
                }
                .padding(.top, YavaaSpacing.xs)
            }
        }
        .padding(.vertical, YavaaSpacing.xs)
    }
}

private struct ProfileWorkspaceView: View {
    let account: AccountSummary?
    let currentMode: AppMode?
    let availableModes: [AppMode]
    let loadProfile: () async throws -> WebsiteAppUser?
    let updateProfile: (ProfileUpdateInput) async throws -> Void
    let createAddress: (AddressInput) async throws -> Void
    let updateAddress: (String, AddressPatchInput) async throws -> Void
    let deleteAddress: (String) async throws -> Void
    let switchMode: (AppMode) async -> Void
    let signOut: () async -> Void

    @State private var appUser: WebsiteAppUser?
    @State private var displayName = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phone = ""
    @State private var bio = ""
    @State private var editingAddress: WebsiteAddress?
    @State private var addressLabel = ""
    @State private var addressLine1 = ""
    @State private var addressCity = ""
    @State private var addressProvince = ""
    @State private var isDefaultAddress = false
    @State private var isLoading = false
    @State private var statusMessage: String?

    var body: some View {
        Form {
            Section("Perfil") {
                Text(account?.email ?? "Cuenta Yavaa")
                    .foregroundStyle(.secondary)

                TextField("Nombre visible", text: $displayName)
                TextField("Nombre", text: $firstName)
                TextField("Apellido", text: $lastName)
                TextField("Telefono", text: $phone)
                TextField("Bio", text: $bio, axis: .vertical)
            }

            Section {
                PrimaryActionButton("Guardar perfil") {
                    Task {
                        await saveProfile()
                    }
                }
                .accessibilityIdentifier("profile.save")
            }

            Section("Direcciones") {
                ForEach(appUser?.addresses ?? [], id: \.id) { address in
                    VStack(alignment: .leading, spacing: YavaaSpacing.xs) {
                        Text(address.label)
                            .font(.headline)
                        Text("\(address.line1), \(address.city)")
                            .foregroundStyle(.secondary)
                        HStack {
                            Button("Editar") {
                                startEditing(address)
                            }
                            Button("Borrar") {
                                Task {
                                    await removeAddress(address)
                                }
                            }
                            .foregroundStyle(YavaaColor.warning)
                        }
                    }
                    .padding(.vertical, YavaaSpacing.xs)
                }

                TextField("Etiqueta", text: $addressLabel)
                TextField("Direccion", text: $addressLine1)
                TextField("Ciudad", text: $addressCity)
                TextField("Provincia", text: $addressProvince)
                Toggle("Predeterminada", isOn: $isDefaultAddress)

                Button(editingAddress == nil ? "Crear direccion" : "Guardar direccion") {
                    Task {
                        await saveAddress()
                    }
                }
                .disabled(!canSaveAddress)
            }

            if let alternateMode {
                Section("Modo") {
                    Button("Cambiar a \(alternateMode.profileSwitchTitle)") {
                        Task {
                            await switchMode(alternateMode)
                        }
                    }
                }
            }

            Section {
                Button("Salir") {
                    Task {
                        await signOut()
                    }
                }
                .foregroundStyle(YavaaColor.warning)
            }

            if let statusMessage {
                Section {
                    Text(statusMessage)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .overlay {
            if isLoading {
                ProgressView()
            }
        }
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private var alternateMode: AppMode? {
        availableModes.first { $0 != currentMode }
    }

    private var canSaveAddress: Bool {
        !addressLabel.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !addressLine1.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !addressCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !addressProvince.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func reload() async {
        isLoading = true
        statusMessage = nil
        do {
            let user = try await loadProfile()
            apply(user)
        } catch {
            statusMessage = "No se pudo cargar /api/me."
        }
        isLoading = false
    }

    private func saveProfile() async {
        isLoading = true
        do {
            try await updateProfile(
                ProfileUpdateInput(
                    displayName: displayName,
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    bio: bio
                )
            )
            statusMessage = "Perfil guardado."
            await reload()
        } catch {
            statusMessage = "No se pudo guardar el perfil."
        }
        isLoading = false
    }

    private func saveAddress() async {
        isLoading = true
        do {
            if let editingAddress {
                try await updateAddress(
                    editingAddress.id,
                    AddressPatchInput(
                        label: addressLabel,
                        line1: addressLine1,
                        city: addressCity,
                        province: addressProvince,
                        isDefault: isDefaultAddress
                    )
                )
            } else {
                try await createAddress(
                    AddressInput(
                        label: addressLabel,
                        line1: addressLine1,
                        city: addressCity,
                        province: addressProvince,
                        isDefault: isDefaultAddress
                    )
                )
            }
            clearAddressForm()
            statusMessage = "Direccion guardada."
            await reload()
        } catch {
            statusMessage = "No se pudo guardar la direccion."
        }
        isLoading = false
    }

    private func removeAddress(_ address: WebsiteAddress) async {
        isLoading = true
        do {
            try await deleteAddress(address.id)
            statusMessage = "Direccion borrada."
            await reload()
        } catch {
            statusMessage = "No se pudo borrar la direccion desde la API."
        }
        isLoading = false
    }

    private func apply(_ user: WebsiteAppUser?) {
        appUser = user
        displayName = user?.displayName ?? ""
        firstName = user?.profile?.firstName ?? ""
        lastName = user?.profile?.lastName ?? ""
        phone = user?.profile?.phone ?? ""
        bio = user?.profile?.bio ?? ""
    }

    private func startEditing(_ address: WebsiteAddress) {
        editingAddress = address
        addressLabel = address.label
        addressLine1 = address.line1
        addressCity = address.city
        addressProvince = address.province
        isDefaultAddress = address.isDefault
    }

    private func clearAddressForm() {
        editingAddress = nil
        addressLabel = ""
        addressLine1 = ""
        addressCity = ""
        addressProvince = ""
        isDefaultAddress = false
    }
}

public struct ClientHomeData: Equatable, Sendable {
    public let categories: [CatalogCategory]
    public let providers: [PublicProviderCard]
    public let addresses: [WebsiteAddress]

    public init(
        categories: [CatalogCategory],
        providers: [PublicProviderCard],
        addresses: [WebsiteAddress]
    ) {
        self.categories = categories
        self.providers = providers
        self.addresses = addresses
    }
}

public struct EmergencyComposerData: Equatable, Sendable {
    public let categories: [CatalogCategory]
    public let addresses: [WebsiteAddress]

    public init(categories: [CatalogCategory], addresses: [WebsiteAddress]) {
        self.categories = categories
        self.addresses = addresses
    }
}

private extension AppMode {
    var title: String {
        switch self {
        case .client:
            return "Jefe"
        case .contractor:
            return "Constructor"
        }
    }

    var profileSwitchTitle: String {
        switch self {
        case .client:
            return "jefe"
        case .contractor:
            return "constructor"
        }
    }
}
