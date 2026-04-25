/**
 * Purpose: Configures the artist detail stack with native push transitions.
 * Caller: Library artist route group.
 * Dependencies: Stack, navigation stack helpers, theme colors.
 * Main Functions: ArtistLayout()
 * Side Effects: None.
 */

import { BackButton } from "@/components/patterns/back-button"
import { Stack } from "@/layouts/stack"
import {
  getMediaDetailTransitionOptions,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function ArtistLayout() {
  const theme = useThemeColors()

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    />
  )
}
