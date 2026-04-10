import { API_ENDPOINTS, AYAHAY_API_URL } from "@/constants"
import { AuthResponseDto, LoginDto, User, Tenant } from "@/types/auth"

export const authService = {
    login: async (credentials: LoginDto): Promise<AuthResponseDto> => {
        try {
            const response = await fetch(`${AYAHAY_API_URL}${API_ENDPOINTS.AUTH}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials),
                credentials: 'include', // Important for HTTP-only cookies
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Login failed")
            }

            const data: AuthResponseDto = await response.json()

            if (typeof window !== 'undefined') {
                // Prefer reading user/tenants from response body (reliable across all environments)
                if (data.data?.tenants && data.data.tenants.length > 0) {
                    const tenantsJson = JSON.stringify(data.data.tenants);
                    localStorage.setItem('tenants', tenantsJson);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    const defaultTenant = data.data.tenants[0];
                    localStorage.setItem('selectedTenantId', String(defaultTenant.id ?? 0));
                    localStorage.setItem('selectedCompanyName', defaultTenant.name);

                    if (defaultTenant.service_key) {
                        document.cookie = `service_key=${defaultTenant.service_key}; path=/;`;
                    }
                } else {
                    // Fallback: try reading from cookies (same-domain / localhost scenarios)
                    authService.syncFromCookies();

                    const tenantsStr = localStorage.getItem('tenants');
                    if (tenantsStr) {
                        try {
                            const tenants: Tenant[] = JSON.parse(tenantsStr);
                            if (tenants.length > 0 && tenants[0].service_key) {
                                document.cookie = `service_key=${tenants[0].service_key}; path=/;`;
                            }
                        } catch (e) {
                            console.error("Failed to parse tenants for setting service_key cookie", e);
                        }
                    }
                }
            }

            return data
        } catch (error) {
            console.error("Login error:", error)
            throw error
        }
    },

    syncFromCookies: (): void => {
        if (typeof window === 'undefined') return;

        const getCookie = (name: string) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return decodeURIComponent(match[2]);
            return null;
        }

        let userStr = getCookie('user');
        let tenantsStr = getCookie('tenants');

        // Clean up potential quotes from cookie values (some servers wrap strings/JSON in quotes)
        const cleanJson = (str: string | null) => {
            if (!str) return null;
            let result = str.trim();
            if (result.startsWith('"') && result.endsWith('"')) {
                result = result.substring(1, result.length - 1);
            }
            return result;
        };

        userStr = cleanJson(userStr);
        tenantsStr = cleanJson(tenantsStr);

        if (userStr) {
            try {
                JSON.parse(userStr);
                localStorage.setItem('user', userStr);
            } catch (e) {
                console.error("Failed to parse user cookie", e, userStr);
            }
        }

        if (tenantsStr) {
            try {
                const tenants: Tenant[] = JSON.parse(tenantsStr);
                localStorage.setItem('tenants', tenantsStr);
                
                if (tenants.length > 0) {
                    const defaultTenant = tenants[0];
                    if (!localStorage.getItem('selectedTenantId')) {
                        localStorage.setItem('selectedTenantId', String(defaultTenant.id ?? 0));
                        localStorage.setItem('selectedCompanyName', defaultTenant.name);
                    }
                }
            } catch (e) {
                console.error("Failed to parse tenants cookie", e, tenantsStr);
            }
        }
    },

    logout: async (): Promise<void> => {
        try {
            // Attempt to call backend logout to clear http-only cookies
            await fetch(`${AYAHAY_API_URL}${API_ENDPOINTS.AUTH}/logout`, {
                method: "POST",
                credentials: 'include'
            }).catch(() => {}); // Ignore error on logout call
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('selectedCompanyName')
                localStorage.removeItem('selectedTenantId')
                localStorage.removeItem('tenants')
                localStorage.removeItem('user')
            }
        }
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null
        let userStr = localStorage.getItem('user')
        if (!userStr) {
            authService.syncFromCookies();
            userStr = localStorage.getItem('user');
        }
        return userStr ? JSON.parse(userStr) : null
    },

    getTenants: (): Tenant[] => {
        if (typeof window === 'undefined') return []
        let tenantsStr = localStorage.getItem('tenants')
        if (!tenantsStr) {
            authService.syncFromCookies();
            tenantsStr = localStorage.getItem('tenants');
        }
        return tenantsStr ? JSON.parse(tenantsStr) : []
    },

    getSelectedTenant: (): Tenant | null => {
        if (typeof window === 'undefined') return null
        const tenants = authService.getTenants()
        const selectedId = localStorage.getItem('selectedTenantId')
        if (!selectedId) return tenants[0] || null
        return tenants.find(t => t.id === Number(selectedId)) || tenants[0] || null
    },

    setSelectedTenant: (id: number): void => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedTenantId', String(id))
            const tenants = authService.getTenants()
            const tenant = tenants.find(t => t.id === id)
            if (tenant) {
                localStorage.setItem('companyName', tenant.name)
            }
        }
    }
}
