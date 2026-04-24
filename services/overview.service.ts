import { API_ENDPOINTS } from "@/constants"
import { OverviewData, OverviewApiResponse, FinanceOverviewData, FinanceOverviewApiResponse } from "@/types/overview"

function normalizeBaseUrl(url: string): string {
    if (!url) return url
    if (!/^https?:\/\//i.test(url)) return `https://${url}`
    return url
}

/**
 * Normalizes raw API response to be case/format consistent regardless of
 * whether the data comes from local dev or a deployed tenant environment.
 *
 * Issues this fixes:
 *  - pax_breakdown keys can be uppercase ("ADULT") or lowercase ("adult")
 *  - cargo_breakdown keys can be uppercase ("LOOSE"/"ROLLING") or lowercase
 *  - by_source keys can be full URLs ("https://tenant.hayahai.com") instead of
 *    readable source names — these get replaced with "Website"
 */
function normalizeOverviewData(data: OverviewData): OverviewData {
    const pvc = data.passenger_vs_cargo;
    if (!pvc) return data;

    // ── pax_breakdown: force lowercase keys ──────────────────────────────────
    if (pvc.pax_breakdown) {
        const normalized: Record<string, number> = {};
        Object.entries(pvc.pax_breakdown).forEach(([k, v]) => {
            normalized[k.toLowerCase()] = Number(v) || 0;
        });
        pvc.pax_breakdown = normalized as any;
    }

    // ── cargo_breakdown: force lowercase keys ────────────────────────────────
    if (pvc.cargo_breakdown) {
        const normalized: Record<string, number> = {};
        Object.entries(pvc.cargo_breakdown).forEach(([k, v]) => {
            normalized[k.toLowerCase()] = Number(v) || 0;
        });
        pvc.cargo_breakdown = normalized as any;
    }

    // ── by_source: normalize URL keys → readable label ───────────────────────
    if (pvc.by_source) {
        const cleanedSource: typeof pvc.by_source = {};
        Object.entries(pvc.by_source).forEach(([key, value]) => {
            let label = key;
            // Detect URL pattern — use hostname or fallback to "Website"
            try {
                if (/^https?:\/\//i.test(key)) {
                    const hostname = new URL(key).hostname;
                    // Strip the tenant-specific subdomain prefix, keep it as "Website"
                    label = "Website";
                    // If multiple URL sources exist, disambiguate by subdomain
                    const sub = hostname.split(".")[0];
                    if (sub && sub !== "www") label = `Website (${sub})`;
                }
            } catch {
                // keep original key if URL parsing fails
            }
            // Merge if label already exists (two URLs mapping to same label)
            if (cleanedSource[label]) {
                const existing = cleanedSource[label];
                // Merge pax sub-keys
                const mergedPax: any = { ...(existing.pax || {}) };
                Object.entries(value.pax || {}).forEach(([pk, pv]) => {
                    const lk = pk.toLowerCase();
                    if (mergedPax[lk]) {
                        mergedPax[lk] = {
                            revenue: (mergedPax[lk].revenue || 0) + ((pv as any).revenue || 0),
                            count:   (mergedPax[lk].count   || 0) + ((pv as any).count   || 0),
                        };
                    } else {
                        mergedPax[lk] = pv;
                    }
                });
                // Merge cargo sub-keys
                const mergedCargo: any = { ...(existing.cargo || {}) };
                Object.entries(value.cargo || {}).forEach(([ck, cv]) => {
                    const lk = ck.toLowerCase();
                    if (mergedCargo[lk]) {
                        mergedCargo[lk] = {
                            revenue: (mergedCargo[lk].revenue || 0) + ((cv as any).revenue || 0),
                            count:   (mergedCargo[lk].count   || 0) + ((cv as any).count   || 0),
                        };
                    } else {
                        mergedCargo[lk] = cv;
                    }
                });
                cleanedSource[label] = { pax: mergedPax, cargo: mergedCargo };
            } else {
                // Normalize sub-keys to lowercase as well
                const normalizedPax: any = {};
                Object.entries(value.pax || {}).forEach(([pk, pv]) => {
                    normalizedPax[pk.toLowerCase()] = pv;
                });
                const normalizedCargo: any = {};
                Object.entries(value.cargo || {}).forEach(([ck, cv]) => {
                    normalizedCargo[ck.toLowerCase()] = cv;
                });
                cleanedSource[label] = { pax: normalizedPax, cargo: normalizedCargo };
            }
        });
        pvc.by_source = cleanedSource;
    }

    return data;
}

/** Ensures revenue_by_route always has a `route_name` field regardless of which
 *  field name the backend version sends (route_name vs canonical_route_name). */
function normalizeRoutes(data: OverviewData): OverviewData {
    if (data.revenue_by_route) {
        data.revenue_by_route = data.revenue_by_route.map((r: any) => ({
            ...r,
            route_name: r.route_name ?? r.canonical_route_name ?? "Unknown Route",
        }));
    }
    return data;
}

export const overviewService = {
    getOverview: async (rawBaseUrl: string, period: 'today' | 'mtd' | 'ytd', serviceKey?: string): Promise<OverviewData> => {
        try {
            const baseUrl = normalizeBaseUrl(rawBaseUrl)
            const url = `${baseUrl}${API_ENDPOINTS.OVERVIEW}/${period}`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(serviceKey ? { "x-service-key": serviceKey } : {})
                },
                credentials: 'include',
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `Failed to fetch overview (${response.status})`)
            }

            const json: OverviewApiResponse = await response.json()
            return normalizeRoutes(normalizeOverviewData(json.data))
        } catch (error) {
            console.error(`Overview fetch error [${period}]:`, error)
            throw error
        }
    },

    getFinanceOverview: async (
        rawBaseUrl: string,
        period: 'today' | 'mtd' | 'ytd',
        serviceKey?: string,
    ): Promise<FinanceOverviewData> => {
        const baseUrl = normalizeBaseUrl(rawBaseUrl)
        const url = `${baseUrl}${API_ENDPOINTS.OVERVIEW_FINANCE}/${period}`
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(serviceKey ? { "x-service-key": serviceKey } : {}),
            },
            credentials: "include",
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to fetch finance overview (${response.status})`)
        }
        const json: FinanceOverviewApiResponse = await response.json()
        return json.data
    },
}
