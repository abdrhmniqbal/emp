import { Redirect } from "expo-router"
import { useEffect } from "react"

import { $isPlayerExpanded } from "@/hooks/scroll-bars.store"

export default function NotificationClickFallbackRoute() {
  useEffect(() => {
    $isPlayerExpanded.set(true)
  }, [])

  return <Redirect href="/(main)/(home)" />
}
