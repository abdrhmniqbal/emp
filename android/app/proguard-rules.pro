# ========== STANDARD OPTIMIZATIONS ==========
-optimizationpasses 3
-allowaccessmodification
-dontusemixedcaseclassnames
-dontpreverify

# Keep crash reporting info
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Signature,*Annotation*

# Remove debug/info logs in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

# ========== REACT NATIVE CORE ==========
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# Bridge & Native Modules
-keep public class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# UI Manager & View System
-keep @com.facebook.react.uimanager.annotations.ReactProp class * { *; }
-keep @com.facebook.react.uimanager.annotations.ReactPropGroup class * { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class com.facebook.react.uimanager.** { *; }

# TurboModules (New Architecture)
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.common.** { *; }

# ========== COMMON LIBRARIES ==========
# Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.** { *; }
-dontwarn com.swmansion.**

# SVG
-keep public class com.horcrux.svg.** { *; }

# Track Player
-keep class com.doublesymmetry.trackplayer.** { *; }
-dontwarn com.doublesymmetry.trackplayer.**

# OkHttp / Okio
-dontwarn okhttp3.**
-dontwarn okio.**
