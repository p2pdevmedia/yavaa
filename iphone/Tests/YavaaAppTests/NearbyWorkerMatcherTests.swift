import XCTest
import YavaaAPI
@testable import YavaaApp

final class NearbyWorkerMatcherTests: XCTestCase {
    func testPrioritizesWorkersInTheDefaultAddressCityAndProvince() {
        let addresses = [
            makeAddress(city: "Salta", province: "Salta", isDefault: true)
        ]
        let near = makeProvider(id: "near", city: "Salta", province: "Salta")
        let far = makeProvider(id: "far", city: "Cordoba", province: "Cordoba")

        XCTAssertEqual(
            NearbyWorkerMatcher.closestProviders(providers: [far, near], addresses: addresses),
            [near]
        )
    }

    func testFallsBackToAllWorkersWhenNoMarketMatchesTheClientAddress() {
        let addresses = [
            makeAddress(city: "Salta", province: "Salta", isDefault: true)
        ]
        let far = makeProvider(id: "far", city: "Cordoba", province: "Cordoba")

        XCTAssertEqual(
            NearbyWorkerMatcher.closestProviders(providers: [far], addresses: addresses),
            [far]
        )
    }

    func testUsesFirstAddressWhenThereIsNoDefaultAddress() {
        let addresses = [
            makeAddress(city: "Neuquen", province: "Neuquen", isDefault: false)
        ]
        let near = makeProvider(id: "near", city: "Neuquen", province: "Neuquen")

        XCTAssertEqual(
            NearbyWorkerMatcher.closestProviders(providers: [near], addresses: addresses),
            [near]
        )
        XCTAssertEqual(NearbyWorkerMatcher.referenceLabel(addresses: addresses), "Neuquen, Neuquen")
    }

    private func makeAddress(city: String, province: String, isDefault: Bool) -> WebsiteAddress {
        WebsiteAddress(
            id: UUID().uuidString,
            label: "Casa",
            line1: "Main 123",
            line2: nil,
            city: city,
            province: province,
            postalCode: nil,
            notes: nil,
            type: "HOME",
            isDefault: isDefault
        )
    }

    private func makeProvider(id: String, city: String, province: String) -> PublicProviderCard {
        PublicProviderCard(
            contractorProfileId: id,
            displayName: id,
            bio: nil,
            profilePhotoUrl: nil,
            acceptsEmergencies: true,
            marketSlug: city.lowercased(),
            marketCity: city,
            marketProvince: province,
            categories: [
                PublicProviderCategory(
                    slug: "construction",
                    name: "Construction",
                    group: "construction",
                    isPrimary: true
                )
            ]
        )
    }
}
