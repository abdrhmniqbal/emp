import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { useEffect, useRef, useState } from "react"
import { Text, View } from "react-native"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup.service"
import { logError } from "@/modules/logging/logging.service"

export function DatabaseProvider({
  children,
  onReady,
  onError,
}: {
  children: React.ReactNode
  onReady?: () => void
  onError?: () => void
}) {
  const [databaseError, setDatabaseError] = useState<Error | null>(null)
  const [isReady, setIsReady] = useState(false)
  const lifecycleRef = useRef<"idle" | "loading" | "ready" | "error">("idle")
  const { success, error } = useMigrations(db, migrations)

  useEffect(() => {
    if (error) {
      if (lifecycleRef.current === "error") {
        return
      }

      lifecycleRef.current = "error"
      setDatabaseError(error)
      logError("Database provider failed", error)
      onError?.()
      return
    }

    if (!success || lifecycleRef.current === "loading" || isReady) {
      return
    }

    lifecycleRef.current = "loading"
    let isCancelled = false

    void (async () => {
      try {
        await loadInitialDatabaseState()
        if (isCancelled) {
          return
        }

        lifecycleRef.current = "ready"
        setIsReady(true)
        onReady?.()
      } catch (loadTracksError) {
        if (isCancelled) {
          return
        }

        const resolvedLoadError = loadTracksError as Error
        lifecycleRef.current = "error"
        setDatabaseError(resolvedLoadError)
        logError("Database data loading failed", resolvedLoadError)
        onError?.()
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [error, isReady, onError, onReady, success])

  if (databaseError) {
    const message = databaseError.message || ""
    const isLegacySchemaConflict =
      message.includes("CREATE TABLE") || message.includes("already exists")

    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="mb-2 text-center text-danger">Database Error</Text>
        <Text className="text-muted-foreground text-center text-sm">
          {isLegacySchemaConflict
            ? "Schema conflict detected. Clear app data or reinstall once to re-baseline migrations."
            : message}
        </Text>
      </View>
    )
  }

  return <View className="flex-1 bg-background">{children}</View>
}
