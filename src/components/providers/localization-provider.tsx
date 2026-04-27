/**
 * Purpose: Hydrates persisted language settings before rendering localized app content.
 * Caller: RootProviders.
 * Dependencies: React, react-i18next provider, i18next instance, language settings service.
 * Main Functions: LocalizationProvider()
 * Side Effects: Reads language settings JSON and updates i18next language.
 */

import { type ReactNode, useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"

import { i18n } from "@/modules/localization/i18n"
import { ensureLanguageConfigLoaded } from "@/modules/localization/language-settings"

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    void ensureLanguageConfigLoaded().finally(() => {
      if (isMounted) {
        setIsReady(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (!isReady) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
