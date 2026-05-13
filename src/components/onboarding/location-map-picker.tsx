'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type LocationCoordinate = {
  latitude: number;
  longitude: number;
};

type LocationMapPickerProps = {
  address: string;
  location: LocationCoordinate | null;
  addressError?: string;
  locationError?: string;
  onAddressChange: (value: string) => void;
  onLocationChange: (location: LocationCoordinate) => void;
};

type MapSize = {
  width: number;
  height: number;
};

type Tile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
};

type SearchStatus = 'idle' | 'searching' | 'found' | 'empty' | 'error';

const defaultLocation = {
  latitude: -24.782127,
  longitude: -65.423197
} satisfies LocationCoordinate;

const defaultZoom = 13;
const minZoom = 4;
const maxZoom = 18;
const tileSize = 256;
const maxMercatorLatitude = 85.05112878;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function wrapLongitude(longitude: number): number {
  if (longitude < -180 || longitude > 180) {
    return ((((longitude + 180) % 360) + 360) % 360) - 180;
  }

  return longitude;
}

function getWorldPixelSize(zoom: number): number {
  return tileSize * 2 ** zoom;
}

function coordinateToPixel(location: LocationCoordinate, zoom: number) {
  const latitude = clamp(location.latitude, -maxMercatorLatitude, maxMercatorLatitude);
  const latitudeRadians = (latitude * Math.PI) / 180;
  const worldPixelSize = getWorldPixelSize(zoom);

  return {
    x: ((location.longitude + 180) / 360) * worldPixelSize,
    y:
      ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) *
      worldPixelSize
  };
}

function pixelToCoordinate(x: number, y: number, zoom: number): LocationCoordinate {
  const worldPixelSize = getWorldPixelSize(zoom);
  const longitude = wrapLongitude((x / worldPixelSize) * 360 - 180);
  const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / worldPixelSize)));
  const latitude = (latitudeRadians * 180) / Math.PI;

  return {
    latitude: clamp(latitude, -maxMercatorLatitude, maxMercatorLatitude),
    longitude
  };
}

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function isSearchResult(value: unknown): value is NominatimSearchResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lon' in value &&
    typeof value.lat === 'string' &&
    typeof value.lon === 'string'
  );
}

function getSearchStatusText(status: SearchStatus): string | null {
  if (status === 'searching') {
    return 'Buscando zona...';
  }

  if (status === 'found') {
    return 'Punto aproximado encontrado.';
  }

  if (status === 'empty') {
    return 'No encontramos esa zona. Podés marcar el punto en el mapa.';
  }

  if (status === 'error') {
    return 'No pudimos buscar la zona ahora. Podés marcar el punto en el mapa.';
  }

  return null;
}

export function LocationMapPicker({
  address,
  location,
  addressError,
  locationError,
  onAddressChange,
  onLocationChange
}: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<LocationCoordinate>(location ?? defaultLocation);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const [center, setCenter] = useState<LocationCoordinate>(() => location ?? defaultLocation);
  const [zoom, setZoom] = useState(defaultZoom);
  const [mapSize, setMapSize] = useState<MapSize>({ width: 0, height: 0 });
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const selectedLocation = location ?? center;

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    const element = mapRef.current;

    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setMapSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const searchText = address.trim();

    if (searchText.length < 3) {
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchStatus('searching');

      try {
        const params = new URLSearchParams({
          q: searchText,
          format: 'jsonv2',
          limit: '1',
          countrycodes: 'ar',
          'accept-language': 'es'
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            accept: 'application/json'
          }
        });

        if (!response.ok) {
          setSearchStatus('error');
          return;
        }

        const results = (await response.json()) as unknown;

        if (!Array.isArray(results) || !isSearchResult(results[0])) {
          setSearchStatus('empty');
          return;
        }

        const nextLocation = {
          latitude: Number(results[0].lat),
          longitude: Number(results[0].lon)
        };

        if (!Number.isFinite(nextLocation.latitude) || !Number.isFinite(nextLocation.longitude)) {
          setSearchStatus('empty');
          return;
        }

        setCenter(nextLocation);
        onLocationChange(nextLocation);
        setSearchStatus('found');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setSearchStatus('error');
      }
    }, 700);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address, onLocationChange]);

  const displayedSearchStatus = address.trim().length < 3 ? 'idle' : searchStatus;

  const tiles = useMemo<Tile[]>(() => {
    if (mapSize.width <= 0 || mapSize.height <= 0) {
      return [];
    }

    const centerPixel = coordinateToPixel(center, zoom);
    const topLeftPixel = {
      x: centerPixel.x - mapSize.width / 2,
      y: centerPixel.y - mapSize.height / 2
    };
    const minTileX = Math.floor(topLeftPixel.x / tileSize);
    const maxTileX = Math.floor((topLeftPixel.x + mapSize.width) / tileSize);
    const minTileY = Math.floor(topLeftPixel.y / tileSize);
    const maxTileY = Math.floor((topLeftPixel.y + mapSize.height) / tileSize);
    const tileCount = 2 ** zoom;
    const nextTiles: Tile[] = [];

    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
        if (tileY < 0 || tileY >= tileCount) {
          continue;
        }

        const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;

        nextTiles.push({
          key: `${zoom}-${tileX}-${tileY}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
          left: tileX * tileSize - topLeftPixel.x,
          top: tileY * tileSize - topLeftPixel.y
        });
      }
    }

    return nextTiles;
  }, [center, mapSize.height, mapSize.width, zoom]);

  function selectLocationFromClientPoint(clientX: number, clientY: number) {
    if (!mapRef.current || mapSize.width <= 0 || mapSize.height <= 0) {
      return;
    }

    const rect = mapRef.current.getBoundingClientRect();
    const centerPixel = coordinateToPixel(centerRef.current, zoom);
    const nextPixel = {
      x: centerPixel.x - mapSize.width / 2 + clientX - rect.left,
      y: centerPixel.y - mapSize.height / 2 + clientY - rect.top
    };
    const nextLocation = pixelToCoordinate(nextPixel.x, nextPixel.y, zoom);

    setCenter(nextLocation);
    onLocationChange(nextLocation);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY
    };
    hasDraggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!lastPointerRef.current || mapSize.width <= 0 || mapSize.height <= 0) {
      return;
    }

    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
      hasDraggedRef.current = true;
    }

    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY
    };

    const centerPixel = coordinateToPixel(centerRef.current, zoom);
    const nextLocation = pixelToCoordinate(centerPixel.x - deltaX, centerPixel.y - deltaY, zoom);

    setCenter(nextLocation);
  }

  function handlePointerUp() {
    lastPointerRef.current = null;
  }

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    selectLocationFromClientPoint(event.clientX, event.clientY);
  }

  function updateZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, minZoom, maxZoom));
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="addressText">Zona donde necesitás ayuda</Label>
        <div className="flex gap-2">
          <Input
            id="addressText"
            name="addressText"
            placeholder="Salta Capital"
            autoComplete="street-address"
            value={address}
            onChange={(event) => {
              if (event.target.value.trim().length < 3) {
                setSearchStatus('idle');
              }

              onAddressChange(event.target.value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const nextLocation = centerRef.current;
              setCenter(nextLocation);
              onLocationChange(nextLocation);
            }}
          >
            Marcar
          </Button>
        </div>
        {addressError ? <p className="text-sm font-semibold text-destructive">{addressError}</p> : null}
        {locationError ? <p className="text-sm font-semibold text-destructive">{locationError}</p> : null}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-border bg-muted shadow-soft">
        <div
          ref={mapRef}
          className="relative h-64 touch-none overflow-hidden bg-[var(--yavaa-violet-soft)]"
          role="application"
          aria-label="Mapa para seleccionar la zona del trabajo"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleMapClick}
        >
          {tiles.map((tile) => (
            <div
              key={tile.key}
              aria-hidden="true"
              className="absolute h-64 w-64 bg-cover bg-center"
              style={{
                left: `${tile.left}px`,
                top: `${tile.top}px`,
                backgroundImage: `url("${tile.url}")`
              }}
            />
          ))}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-full rounded-full border-4 border-white bg-primary shadow-soft">
            <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary" />
          </div>
          <div className="absolute right-3 top-3 grid overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 rounded-none border-0 p-0 text-lg"
              onClick={(event) => {
                event.stopPropagation();
                updateZoom(zoom + 1);
              }}
              aria-label="Acercar mapa"
            >
              +
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-9 rounded-none border-0 border-t p-0 text-lg"
              onClick={(event) => {
                event.stopPropagation();
                updateZoom(zoom - 1);
              }}
              aria-label="Alejar mapa"
            >
              -
            </Button>
          </div>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 rounded-md bg-card/90 px-2 py-1 text-[11px] font-semibold text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            © OpenStreetMap
          </a>
        </div>
        <div className="grid gap-2 bg-card px-4 py-3 text-sm">
          {getSearchStatusText(displayedSearchStatus) ? (
            <p className="font-semibold text-muted-foreground">{getSearchStatusText(displayedSearchStatus)}</p>
          ) : null}
          <p className="font-bold text-foreground">
            {formatCoordinate(selectedLocation.latitude)}, {formatCoordinate(selectedLocation.longitude)}
          </p>
        </div>
      </div>
    </div>
  );
}
