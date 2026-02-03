import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    className?: string;
}

export const EmptyState = ({ icon, title, message, className = "" }: EmptyStateProps) => {
    const theme = useThemeColors();

    return (
        <View className={`items-center justify-center py-12 px-6 ${className}`}>
            <View className="mb-4 p-6 rounded-full bg-default/50">
                <Ionicons name={icon} size={48} color={theme.muted} />
            </View>
            <Text className="text-xl font-bold text-foreground mb-2 text-center">
                {title}
            </Text>
            <Text className="text-muted text-center leading-relaxed">
                {message}
            </Text>
        </View>
    );
};
