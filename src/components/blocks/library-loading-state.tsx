import * as React from "react"
import { Skeleton } from "heroui-native"
import { Text, View } from "react-native"

interface LibraryLoadingStateProps {
  itemCount?: number
}

export const LibraryLoadingState: React.FC<LibraryLoadingStateProps> = ({
  itemCount = 0,
}) => {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <Skeleton className="mb-4 h-10 w-10 rounded-full" />
      <Text className="mt-4 text-base text-muted">
        {itemCount > 0 ? `Loading ${itemCount} items...` : "Loading library..."}
      </Text>
    </View>
  )
}
