import { BackButton } from "@/components/patterns/back-button"
import {
  getMediaDetailTransitionOptions,
  getModalTaskTransitionOptions,
  TransitionStack,
} from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function PlaylistLayout() {
  const theme = useThemeColors()

  return (
    <TransitionStack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    >
      <TransitionStack.Screen name="[id]" options={{ title: "Playlist" }} />
      <TransitionStack.Screen
        name="form"
        options={getModalTaskTransitionOptions(theme, "Playlist", () => (
          <BackButton className="-ml-2" />
        ))}
      />
    </TransitionStack>
  )
}
