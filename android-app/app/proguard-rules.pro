# ProGuard & R8 Optimization Rules for Lamma Native Android App

# Keep Kotlin Serialization models
-keepattributes *Annotation*, InnerClasses, EnclosingMethod
-keepclassmembers class * {
    @kotlinx.serialization.Serializable *;
}
-keepclassmembers class * extends kotlinx.serialization.internal.GeneratedSerializer {
    *;
}
-keep,allowobfuscation,allowshrinking class com.lamma.app.data.model.** { *; }

# Ktor & Supabase Kotlin SDK
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.github.jan.supabase.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# AndroidX DataStore
-keep class androidx.datastore.** { *; }

# Coil Image Loading
-keep class coil.** { *; }
-dontwarn coil.**

# Jetpack Compose
-keepclassmembers class androidx.compose.ui.platform.AndroidComposeView {
    *;
}
-dontwarn androidx.compose.**

# Firebase Messaging (FCM)
-keep class com.google.firebase.messaging.** { *; }
-dontwarn com.google.firebase.messaging.**
