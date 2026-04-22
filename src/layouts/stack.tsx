import type { ParamListBase, StackNavigationState } from "@react-navigation/native"
import "react-native-reanimated"
import { withLayoutContext } from "expo-router"
import type { ComponentProps } from "react"
import {
  createNativeStackNavigator,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
} from "react-native-screen-transitions/native-stack"

const { Navigator } = createNativeStackNavigator()

function TransitionStackNavigator(props: ComponentProps<typeof Navigator>) {
  const { screenOptions, ...rest } = props

  const mergedScreenOptions =
    typeof screenOptions === "function"
      ? (options: Parameters<NonNullable<typeof screenOptions>>[0]) => ({
          headerShown: true,
          ...screenOptions(options),
        })
      : {
          headerShown: true,
          ...screenOptions,
        }

  return <Navigator {...rest} screenOptions={mergedScreenOptions} />
}

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof TransitionStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(TransitionStackNavigator)