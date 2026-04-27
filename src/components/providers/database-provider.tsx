import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { useEffect, useRef, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadInitialDatabaseState } from "@/modules/bootstrap/database-startup.service"
import { logError, logInfo } from "@/modules/logging/logging.service"

export function DatabaseProvider({
  children,
  onReady,
  onError,
}: {
  children: React.ReactNode
  onReady?: () => void
  onError?: () => void
}) {
  const { t } = useTranslation()
  const [databaseError, setDatabaseError] = useState<Error | null>(null)
  const lifecycleRef = useRef<"idle" | "loading" | "ready" | "error">("idle")
  const { success, error } = useMigrations(db, migrations)

  useEffect(() => {
    if (lifecycleRef.current === "idle") {
      logInfo("Database provider waiting for migrations")
    }

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

    if (
      !success ||
      lifecycleRef.current === "loading" ||
      lifecycleRef.current === "ready"
    ) {
      return
    }

    lifecycleRef.current = "loading"
    logInfo("Database migrations completed, loading initial database state")
    let isCancelled = false

    void (async () => {
      try {
        await loadInitialDatabaseState()
        if (isCancelled) {
          return
        }

        lifecycleRef.current = "ready"
        logInfo("Database provider ready")
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
      logInfo("Database provider load cancelled")
    }
  }, [error, onError, onReady, success])

  if (databaseError) {
    const message = databaseError.message || ""
    const isLegacySchemaConflict =
      message.includes("CREATE TABLE") || message.includes("already exists")

    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="mb-2 text-center text-danger">
          {t("database.errorTitle")}
        </Text>
        <Text className="text-muted-foreground text-center text-sm">
          {isLegacySchemaConflict
            ? t("database.schemaConflict")
            : message}
        </Text>
      </View>
    )
  }

  return <View className="flex-1 bg-background">{children}</View>
}
