import { argentinaLocationTuples } from '@/lib/argentina-locations-data';

export type ArgentinaLocation = {
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
};

export function listArgentinaLocations(): ArgentinaLocation[] {
  return argentinaLocationTuples.map(([provinceId, provinceName, cityId, cityName, latitude, longitude]) => ({
    provinceId,
    provinceName,
    cityId,
    cityName,
    latitude,
    longitude
  }));
}
