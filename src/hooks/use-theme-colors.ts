import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

export function useThemeColors() {
    const { theme: currentTheme } = useUniwind();
    return Colors[currentTheme === "dark" ? "dark" : "light"];
}
