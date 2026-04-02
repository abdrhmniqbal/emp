import { BackButton } from "@/components/patterns/back-button"
import {
  getMediaDetailTransitionOptions,
  TransitionStack,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function ArtistLayout() {
  const theme = useThemeColors()

  return (
    <TransitionStack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    />
  )
}
