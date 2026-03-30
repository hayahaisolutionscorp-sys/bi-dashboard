export interface LoginDto {
    email: string
    password: string
}

export interface User {
    id: string
    email: string
    name?: string
    first_name?: string
    last_name?: string
    role?: string
}

export interface Tenant {
    id: number
    name: string
    api_base_url: string
    logo?: string | null
    service_key: string
}

export interface AuthResponseDto {
    status: string
    message: string
}
