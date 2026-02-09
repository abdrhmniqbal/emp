import { Stack } from "expo-router";
import { useThemeColors } from "@/hooks/use-theme-colors";

export default function SearchLayout() {
    const theme = useThemeColors();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.foreground,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Search",
                    headerLargeTitle: true,
                }}
            />
            <Stack.Screen
                name="genre/[name]"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="genre/albums"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="genre/top-tracks"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
