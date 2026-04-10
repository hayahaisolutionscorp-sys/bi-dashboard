'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant } from '@/types/auth';
import { authService } from '@/services/auth.service';
import { useParams, useRouter, usePathname } from 'next/navigation';

interface TenantContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  setTenant: (tenant: Tenant) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = params?.tenant_slug as string;

  const refreshTenantState = useCallback(() => {
    // 1. Load available tenants from localStorage (set by login response body)
    const availableTenants = authService.getTenants();
    setTenants(availableTenants);

    if (availableTenants.length === 0) {
      setIsLoading(false);
      return;
    }

    // 2. Determine active tenant based on URL slug or previous selection
    let current: Tenant | null = null;
    
    if (tenantSlug) {
      current = availableTenants.find(t => t.name.toLowerCase().replace(/ /g, '-') === tenantSlug) || null;
    }

    if (!current) {
      current = authService.getSelectedTenant();
    }

    if (current) {
      // Allow NEXT_PUBLIC_CLIENT_API_URL to override api_base_url in local dev
      // so localhost browsers can reach a local ayahay-client-api instance
      const clientApiOverride = process.env.NEXT_PUBLIC_CLIENT_API_URL;
      setActiveTenant(
        clientApiOverride
          ? { ...current, api_base_url: clientApiOverride }
          : current
      );
    }
    
    setIsLoading(false);
  }, [tenantSlug]);

  useEffect(() => {
    refreshTenantState();
  }, [refreshTenantState]);

  const setTenant = (tenant: Tenant) => {
    const clientApiOverride = process.env.NEXT_PUBLIC_CLIENT_API_URL;
    setActiveTenant(clientApiOverride ? { ...tenant, api_base_url: clientApiOverride } : tenant);
    authService.setSelectedTenant(tenant.id);
    
    // Update service_key cookie for immediate service use (temporary until backend set-cookie)
    if (tenant.service_key) {
      document.cookie = `service_key=${tenant.service_key}; path=/;`;
    }

    // Redirect to the new tenant's dashboard if we are in a tenant-scoped route
    if (tenantSlug) {
      const newSlug = tenant.name.toLowerCase().replace(/ /g, '-');
      const newPath = pathname.replace(tenantSlug, newSlug);
      router.push(newPath);
    }
  };

  return (
    <TenantContext.Provider value={{ activeTenant, tenants, setTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
