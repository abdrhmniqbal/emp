/**
 * Purpose: Shows a bottom sheet list for navigating to one value from multiple artists/genres.
 * Caller: Track action sheet and player route UI actions.
 * Dependencies: HeroUI Native BottomSheet and pressable components.
 * Main Functions: ValueNavigationSheet()
 * Side Effects: Triggers navigation callbacks for selected values.
 */

import { BottomSheet, PressableFeedback } from "heroui-native"
import { Text } from "react-native"

interface ValueNavigationSheetProps {
  isOpen: boolean
  title: string
  values: string[]
  onOpenChange: (open: boolean) => void
  onSelectValue: (value: string) => void
}

export function ValueNavigationSheet({
  isOpen,
  title,
  values,
  onOpenChange,
  onSelectValue,
}: ValueNavigationSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          backgroundClassName="bg-surface"
          className="gap-1 pb-4"
        >
          <Text className="px-1 pb-2 text-base font-semibold text-foreground">
            {title}
          </Text>
          {values.map((value) => (
            <PressableFeedback
              key={value}
              className="h-12 flex-row items-center justify-between active:opacity-60"
              onPress={() => onSelectValue(value)}
            >
              <Text className="text-base text-foreground">{value}</Text>
            </PressableFeedback>
          ))}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
