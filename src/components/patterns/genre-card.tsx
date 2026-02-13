import { Text, View } from "react-native";
import { Card, PressableFeedback } from "heroui-native";
import { cn } from "tailwind-variants";
import type { PatternType } from "@/modules/genres/genres.utils";

type GenreCardProps = {
  title: string;
  color: string;
  pattern: PatternType;
  onPress?: () => void;
};

export function GenreCard({ title, color, pattern, onPress }: GenreCardProps) {
  return (
    <PressableFeedback onPress={onPress} className="w-[47.5%] active:opacity-80">
      <Card
        className={cn(
          "relative h-24 justify-start overflow-hidden border-none p-4",
          color,
        )}
      >
        <Text className="text-white font-bold text-[17px] z-10 leading-tight">
          {title}
        </Text>
        <View className="absolute inset-0">
          {pattern === "circles" && (
            <>
              <View className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15" />
              <View className="absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-white/5 -translate-x-6 -translate-y-6" />
              <View className="absolute right-4 bottom-[-10] w-16 h-16 rounded-full bg-white/10" />
            </>
          )}
          {pattern === "waves" && (
            <>
              <View className="absolute -left-12 bottom-[-20] w-40 h-40 rounded-full border-20 border-white/10" />
              <View className="absolute right-[-20] top-[-20] w-28 h-28 rounded-full border-12 border-white/10" />
            </>
          )}
          {pattern === "grid" && (
            <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} className="w-6 h-6 rounded-sm bg-white/5" />
              ))}
            </View>
          )}
          {pattern === "diamonds" && (
            <>
              <View className="absolute right-[-10] top-4 w-16 h-16 bg-white/15 rotate-45" />
              <View className="absolute left-[-20] bottom-0 w-24 h-24 bg-white/5 rotate-45" />
            </>
          )}
          {pattern === "triangles" && (
            <>
              <View className="absolute right-0 top-0 w-0 h-0 border-l-40 border-l-transparent border-t-40 border-t-white/15" />
              <View className="absolute left-4 bottom-[-10] w-0 h-0 border-r-60 border-r-transparent border-b-60 border-b-white/10" />
            </>
          )}
          {pattern === "rings" && (
            <>
              <View className="absolute -right-2 -top-2 w-16 h-16 rounded-full border-4 border-white/20" />
              <View className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/10" />
            </>
          )}
          {pattern === "pills" && (
            <>
              <View className="absolute right-0 top-2 w-20 h-8 rounded-full bg-white/15 rotate-[-15deg]" />
              <View className="absolute -left-4 bottom-4 w-24 h-10 rounded-full bg-white/10 rotate-25" />
            </>
          )}
          {pattern === "stripes" && (
            <>
              <View className="absolute -left-6 top-0 h-28 w-3 bg-white/10 rotate-12" />
              <View className="absolute left-6 top-0 h-28 w-3 bg-white/15 rotate-12" />
              <View className="absolute left-18 top-0 h-28 w-3 bg-white/10 rotate-12" />
              <View className="absolute left-30 top-0 h-28 w-3 bg-white/15 rotate-12" />
            </>
          )}
          {pattern === "stars" && (
            <>
              <View className="absolute right-6 top-4 w-3 h-12 rounded-full bg-white/15" />
              <View className="absolute right-1.5 top-8 w-12 h-3 rounded-full bg-white/15" />
              <View className="absolute left-7 bottom-3 w-2 h-8 rounded-full bg-white/10" />
              <View className="absolute left-4 bottom-6 w-8 h-2 rounded-full bg-white/10" />
            </>
          )}
          {pattern === "zigzag" && (
            <>
              <View className="absolute right-[-8] top-6 w-14 h-2 bg-white/15 rotate-45" />
              <View className="absolute right-2 top-12 w-14 h-2 bg-white/10 -rotate-45" />
              <View className="absolute right-[-8] top-18 w-14 h-2 bg-white/10 rotate-45" />
              <View className="absolute left-[-8] bottom-6 w-12 h-2 bg-white/10 -rotate-45" />
            </>
          )}
          {pattern === "crosses" && (
            <>
              <View className="absolute right-5 top-4 w-2 h-10 rounded-full bg-white/15" />
              <View className="absolute right-1 top-8 w-10 h-2 rounded-full bg-white/15" />
              <View className="absolute left-5 bottom-4 w-2 h-8 rounded-full bg-white/10" />
              <View className="absolute left-2 bottom-7 w-8 h-2 rounded-full bg-white/10" />
            </>
          )}
        </View>
      </Card>
    </PressableFeedback>
  );
}
