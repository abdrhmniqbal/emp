import { QueryClientProvider } from "@tanstack/react-query"
import { useEffect } from "react"

import { queryClient } from "@/lib/tanstack-query"
import { registerBootstrapListeners } from "@/modules/bootstrap/bootstrap-listeners.service"

import { DatabaseProvider } from "./database-provider"

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
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider onReady={onDatabaseReady} onError={onDatabaseError}>
        {children}
      </DatabaseProvider>
    </QueryClientProvider>
  )
}
