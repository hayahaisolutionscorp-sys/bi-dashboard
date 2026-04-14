import { API_ENDPOINTS } from "@/constants";

export interface RoutePathPortRef {
  id: number;
  name?: string;
}

export interface RoutePathRecord {
  id?: string | number;
  route_name?: string;
  src_port_id: number;
  dest_port_id: number;
  src_port?: RoutePathPortRef;
  dest_port?: RoutePathPortRef;
  coords: number[][];
  distance_km?: number;
  distance_nm?: number;
  created_at?: string;
  updated_at?: string;
}

type CacheEntry = {
  expiresAt: number;
  data: RoutePathRecord[];
  promise?: Promise<RoutePathRecord[]>;
};

const CACHE_TTL_MS = 60 * 1000;
const routePathsCache = new Map<string, CacheEntry>();

function normalizeBaseUrl(url: string): string {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url.replace(/\/$/, "");
}

function toNumberPairArray(coords: unknown): number[][] {
  if (!Array.isArray(coords)) return [];
  return coords
    .filter(
      (item): item is [number, number] =>
        Array.isArray(item) && item.length >= 2 && !Number.isNaN(Number(item[0])) && !Number.isNaN(Number(item[1])),
    )
    .map(([lng, lat]) => [Number(lng), Number(lat)]);
}

function normalizeRoutePath(raw: any): RoutePathRecord | null {
  const coords = toNumberPairArray(raw?.coords);
  const srcPortId = Number(raw?.src_port_id ?? raw?.src_port?.id);
  const destPortId = Number(raw?.dest_port_id ?? raw?.dest_port?.id);

  if (!srcPortId || !destPortId || coords.length < 2) {
    return null;
  }

  return {
    id: raw?.id,
    route_name: raw?.route_name,
    src_port_id: srcPortId,
    dest_port_id: destPortId,
    src_port: raw?.src_port,
    dest_port: raw?.dest_port,
    coords,
    distance_km:
      raw?.distance_km != null
        ? Number(raw.distance_km)
        : raw?.distance_nm != null
          ? Number(raw.distance_nm) * 1.852
          : undefined,
    distance_nm: raw?.distance_nm != null ? Number(raw.distance_nm) : undefined,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function getCacheKey(baseUrl: string, serviceKey?: string): string {
  return `${baseUrl}::${serviceKey ?? ""}`;
}

export const routePathsService = {
  async getRoutePaths(baseUrl: string, serviceKey?: string, forceRefresh = false): Promise<RoutePathRecord[]> {
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    const cacheKey = getCacheKey(normalizedBaseUrl, serviceKey);
    const now = Date.now();
    const cached = routePathsCache.get(cacheKey);

    if (!forceRefresh && cached?.data && cached.expiresAt > now) {
      return cached.data;
    }

    if (!forceRefresh && cached?.promise) {
      return cached.promise;
    }

    const request = fetch(`${normalizedBaseUrl}${API_ENDPOINTS.ROUTE_SEA_PATHS}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(serviceKey ? { "x-service-key": serviceKey } : {}),
      },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch route paths: ${response.statusText}`);
        }

        const result = await response.json();
        const items: unknown[] = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];
        const normalized = items
          .map((item) => normalizeRoutePath(item))
          .filter((item): item is RoutePathRecord => item !== null);

        routePathsCache.set(cacheKey, {
          data: normalized,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return normalized;
      })
      .catch((error) => {
        routePathsCache.delete(cacheKey);
        console.error("Route Paths fetch error:", error);
        return [];
      });

    routePathsCache.set(cacheKey, {
      data: cached?.data ?? [],
      expiresAt: cached?.expiresAt ?? 0,
      promise: request,
    });

    return request;
  },
};
