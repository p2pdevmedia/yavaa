# Android Native Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first native Android project for Yavaa with Kotlin, Jetpack Compose, Supabase Auth, and a minimal backend API client.

**Architecture:** Use one Android app module under `android/app` and keep boundaries explicit by package. Runtime configuration is read from Gradle-generated `BuildConfig`, auth is wrapped behind a repository, and backend calls go through a typed Ktor client.

**Tech Stack:** Kotlin, Gradle Kotlin DSL, Android Gradle Plugin, Jetpack Compose Material 3, Kotlin coroutines, Ktor client, Supabase Kotlin Auth.

---

## File Structure

- Create `android/settings.gradle.kts` for plugin management and module inclusion.
- Create `android/build.gradle.kts` for shared plugin versions.
- Create `android/gradle.properties` for AndroidX and Kotlin defaults.
- Create `android/local.properties.example` documenting local runtime config.
- Create `android/app/build.gradle.kts` for Android, Compose, Ktor, Supabase, and test dependencies.
- Create `android/app/src/main/AndroidManifest.xml` with internet permission and the main activity.
- Create Kotlin files under `android/app/src/main/java/lat/yavaa/android/**` for config, auth, network, navigation, auth UI, home UI, and theme.
- Create unit tests under `android/app/src/test/java/lat/yavaa/android/**`.
- Modify `android/README.md` with setup and verification commands.

## Tasks

### Task 1: Gradle And Android Skeleton

**Files:**
- Create: `android/settings.gradle.kts`
- Create: `android/build.gradle.kts`
- Create: `android/gradle.properties`
- Create: `android/local.properties.example`
- Create: `android/app/build.gradle.kts`
- Create: `android/app/src/main/AndroidManifest.xml`

- [ ] Add Gradle Kotlin DSL files for one `app` module.
- [ ] Configure Compose, `BuildConfig`, Java 17 compatibility, and local config fields.
- [ ] Add dependencies for Compose Material 3, lifecycle ViewModel, navigation, Ktor, Supabase Auth, and tests.
- [ ] Add the Android manifest with `INTERNET` permission.

### Task 2: Configuration And Tests

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/core/config/YavaaConfig.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/core/config/YavaaConfigTest.kt`

- [ ] Write tests for blank config rejection and valid config normalization.
- [ ] Implement `YavaaConfig` with explicit validation.

### Task 3: Auth And Network Core

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/core/auth/YavaaAuthRepository.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/core/network/YavaaApiClient.kt`
- Create: `android/app/src/test/java/lat/yavaa/android/core/network/YavaaApiClientTest.kt`

- [ ] Write a unit test proving authenticated `/api/me` requests include a bearer token.
- [ ] Implement Supabase Auth repository methods for session lookup, email/password login, and sign out.
- [ ] Implement a minimal Ktor-backed API client with typed `/api/me` parsing.

### Task 4: Compose App Shell

**Files:**
- Create: `android/app/src/main/java/lat/yavaa/android/MainActivity.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/YavaaApplication.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/navigation/YavaaApp.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Color.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/core/ui/theme/Theme.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/auth/AuthViewModel.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/auth/AuthScreen.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeViewModel.kt`
- Create: `android/app/src/main/java/lat/yavaa/android/feature/home/HomeScreen.kt`

- [ ] Create a simple dependency container in `YavaaApplication`.
- [ ] Build login UI with email/password fields and error/loading states.
- [ ] Build home UI that calls `/api/me`, displays authenticated status, and exposes sign out.
- [ ] Wire session state in `YavaaApp`.

### Task 5: Documentation And Verification

**Files:**
- Modify: `android/README.md`
- Observe: `public/openapi.json`

- [ ] Document Android Studio, JDK, SDK, local config, build, and test commands.
- [ ] Note that `public/openapi.json` is the backend contract for Android.
- [ ] Run available verification commands. If Java/Gradle are unavailable, record the exact blocker.

