import Foundation
import YavaaAPI

public enum NearbyWorkerMatcher {
    public static func closestProviders(
        providers: [PublicProviderCard],
        addresses: [WebsiteAddress]
    ) -> [PublicProviderCard] {
        guard let referenceAddress = addresses.first(where: \.isDefault) ?? addresses.first else {
            return providers
        }

        let matchingProviders = providers.filter { provider in
            guard let city = provider.marketCity,
                  let province = provider.marketProvince else {
                return false
            }

            return city.localizedCaseInsensitiveCompare(referenceAddress.city) == .orderedSame
                && province.localizedCaseInsensitiveCompare(referenceAddress.province) == .orderedSame
        }

        return matchingProviders.isEmpty ? providers : matchingProviders
    }

    public static func referenceLabel(addresses: [WebsiteAddress]) -> String? {
        guard let referenceAddress = addresses.first(where: \.isDefault) ?? addresses.first else {
            return nil
        }

        return "\(referenceAddress.city), \(referenceAddress.province)"
    }
}
