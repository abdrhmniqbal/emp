import { QueryClientProvider } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { DatabaseProvider } from "./database-provider"

export function Providers({
  children,
  onDatabaseReady,
}: {
  children: React.ReactNode
  onDatabaseReady?: () => void
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider onReady={onDatabaseReady}>{children}</DatabaseProvider>
    </QueryClientProvider>
  )
}
