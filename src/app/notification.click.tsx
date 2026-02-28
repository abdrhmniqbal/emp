import { useEffect } from "react"
import { Redirect } from "expo-router"

import { $isPlayerExpanded } from "@/hooks/scroll-bars.store"

export default function NotificationClickRoute() {
  useEffect(() => {
    $isPlayerExpanded.set(true)
  }, [])

  return <Redirect href="/(main)/(home)" />
}
