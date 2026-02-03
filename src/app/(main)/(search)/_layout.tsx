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
        </Stack>
    );
}
