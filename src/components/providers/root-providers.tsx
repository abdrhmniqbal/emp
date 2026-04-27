/**
 * Purpose: Composes app-level providers for localization, data fetching, database setup, and bootstrap listeners.
 * Caller: Root app layout.
 * Dependencies: React Query, localization provider, database provider, bootstrap listeners.
 * Main Functions: RootProviders()
 * Side Effects: Registers bootstrap listeners and initializes provider state.
 */

import { QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"

import { queryClient } from "@/lib/tanstack-query"
import { registerBootstrapListeners } from "@/modules/bootstrap/bootstrap-listeners.service"

import { DatabaseProvider } from "./database-provider"
import { LocalizationProvider } from "./localization-provider"

export function RootProviders({
  children,
  onDatabaseReady,
  onDatabaseError,
}: {
  children: React.ReactNode
  onDatabaseReady?: () => void
  onDatabaseError?: () => void
}) {
  useEffect(() => {
    return registerBootstrapListeners()
  }, [])

  return (
    <LocalizationProvider>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider onReady={onDatabaseReady} onError={onDatabaseError}>
          {children}
        </DatabaseProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  )
}
