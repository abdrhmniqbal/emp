import { useEffect } from "react"

import { registerBootstrapListeners } from "@/modules/bootstrap/bootstrap-listeners.service"

export function BootstrapEffects() {
  useEffect(() => {
    return registerBootstrapListeners()
  }, [])

  return null
}
