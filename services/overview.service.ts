import { API_ENDPOINTS } from "@/constants"
import { OverviewData, OverviewApiResponse } from "@/types/overview"

function normalizeBaseUrl(url: string): string {
    if (!url) return url
    if (!/^https?:\/\//i.test(url)) return `https://${url}`
    return url
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
            return json.data
        } catch (error) {
            console.error(`Overview fetch error [${period}]:`, error)
            throw error
        }
    },
}
