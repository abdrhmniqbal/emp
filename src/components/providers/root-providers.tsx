/**
 * Purpose: Composes app-level providers for localization, data fetching, database setup, and bootstrap listeners.
 * Caller: Root app layout.
 * Dependencies: React Query, localization provider, database provider, and bootstrap listeners runtime.
 * Main Functions: RootProviders()
 * Side Effects: Starts bootstrap listeners runtime.
 */

import { QueryClientProvider } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { ensureBootstrapListenersStarted } from "@/modules/bootstrap/bootstrap-listeners.runtime"

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
  ensureBootstrapListenersStarted()

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
