/**
 * Purpose: Renders database error fallback UI and drives DB startup through external runtime state.
 * Caller: Root providers.
 * Dependencies: Drizzle migration hook, database runtime, and localization.
 * Main Functions: DatabaseProvider()
 * Side Effects: Starts DB runtime synchronization after migrations complete.
 */

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { useSyncExternalStore } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import {
  getDatabaseRuntimeSnapshot,
  scheduleDatabaseRuntimeSync,
  subscribeDatabaseRuntime,
} from "@/modules/bootstrap/database-runtime"

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
  const { success, error } = useMigrations(db, migrations)
  const runtimeSnapshot = useSyncExternalStore(
    subscribeDatabaseRuntime,
    getDatabaseRuntimeSnapshot,
    getDatabaseRuntimeSnapshot
  )

  scheduleDatabaseRuntimeSync({
    success,
    error: error ?? undefined,
    onReady,
    onError,
  })

  if (runtimeSnapshot.error) {
    const message = runtimeSnapshot.error.message || ""
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
