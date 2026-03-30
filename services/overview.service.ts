import { API_ENDPOINTS, AYAHAY_CLIENT_API } from "@/constants"
import { OverviewData, OverviewApiResponse } from "@/types/overview"

export const overviewService = {
    getOverview: async (period: 'today' | 'mtd' | 'ytd'): Promise<OverviewData> => {
        try {
            const url = `${AYAHAY_CLIENT_API}${API_ENDPOINTS.OVERVIEW}/${period}`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
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
