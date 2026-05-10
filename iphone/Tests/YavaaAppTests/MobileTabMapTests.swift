import XCTest
import YavaaCore
@testable import YavaaApp

final class MobileTabMapTests: XCTestCase {
    func testGuestModeUsesInicioUrgenciasAndPerfilTabs() {
        XCTAssertEqual(
            MobileTabMap.guestTabs,
            [.home, .urgencies, .profile]
        )
        XCTAssertEqual(MobileTabMap.guestTabs.map(\.title), ["Inicio", "Urgencias", "Perfil"])
    }

    func testClientModeUsesJefeBottomTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .client),
            [.home, .urgencies, .myHomes, .workers, .profile]
        )
        XCTAssertEqual(MobileTabMap.tabs(for: .client).map(\.title), [
            "Inicio",
            "Urgencias",
            "Mis Casas",
            "Trabajadores",
            "Perfil"
        ])
    }

    func testContractorModeUsesTrabajadorBottomTabs() {
        XCTAssertEqual(
            MobileTabMap.tabs(for: .contractor),
            [.home, .urgencies, .myClients, .profile]
        )
        XCTAssertEqual(MobileTabMap.tabs(for: .contractor).map(\.title), [
            "Inicio",
            "Urgencias",
            "Mis Clientes",
            "Perfil"
        ])
    }

    func testUrgenciasKeepsModeSpecificIntent() {
        XCTAssertEqual(MobileTabMap.urgenciesIntent(for: nil), .draftBeforeAuth)
        XCTAssertEqual(MobileTabMap.urgenciesIntent(for: .client), .manageCreatedEmergencies)
        XCTAssertEqual(MobileTabMap.urgenciesIntent(for: .contractor), .browseEmergencies)
    }
}
