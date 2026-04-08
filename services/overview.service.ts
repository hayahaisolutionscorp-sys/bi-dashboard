import { API_ENDPOINTS } from "@/constants"
import { OverviewData, OverviewApiResponse } from "@/types/overview"

export const overviewService = {
    getOverview: async (baseUrl: string, period: 'today' | 'mtd' | 'ytd', serviceKey?: string): Promise<OverviewData> => {
        try {
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
