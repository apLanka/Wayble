import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import waybleAppIcon from "@/assets/images/app-icon/wayble-app-icon.png";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const { width } = Dimensions.get("window");
const ONBOARDING_STORAGE_KEY = "has_seen_onboarding";

export default function OnboardingScreen() {
  const { appTheme, isDark } = useAppTheme();
  const { colors } = appTheme;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.85)).current;
  const contentSlideAnim = useRef(new Animated.Value(24)).current;
  const actionsSlideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(actionsSlideAnim, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();

    AccessibilityInfo.announceForAccessibility?.(
      "Welcome to Wayble. Find a better way to get there.",
    );
  }, [fadeAnim, logoScaleAnim, contentSlideAnim, actionsSlideAnim]);

  const markOnboardingComplete = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // SecureStore might fail in some sandboxed environments, continue navigation
    }
  };

  const handleGetStarted = async () => {
    await markOnboardingComplete();
    router.push("/sign-up");
  };

  const handleSignIn = async () => {
    await markOnboardingComplete();
    router.push("/sign-in");
  };

  const handleExploreGuest = async () => {
    await markOnboardingComplete();
    router.replace("/home");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      {/* Background Decorative Glow */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          {
            backgroundColor: isDark
              ? colors.primary + "18"
              : colors.primary + "10",
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Center Brand Identity Section */}
        <Animated.View
          style={[
            styles.centerSection,
            {
              opacity: fadeAnim,
              transform: [
                { scale: logoScaleAnim },
                { translateY: contentSlideAnim },
              ],
            },
          ]}
        >
          {/* Logo Container with Soft Shadow & Ring */}
          <View
            style={[
              styles.logoWrapper,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: isDark
                  ? colors.border + "40"
                  : colors.primary + "20",
                shadowColor: colors.primary,
              },
            ]}
          >
            <Image
              source={waybleAppIcon}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityRole="image"
              accessibilityLabel="Wayble application logo"
            />
          </View>

          {/* App Name */}
          <AppText
            variant="display"
            style={[
              styles.appName,
              {
                color: colors.primary,
              },
            ]}
            accessibilityRole="header"
          >
            Wayble
          </AppText>

          {/* Slogan */}
          <View style={styles.sloganContainer}>
            <AppText
              variant="title"
              style={[
                styles.sloganText,
                {
                  color: colors.text,
                },
              ]}
            >
              “Find a better way to get there.”
            </AppText>
          </View>

          {/* Value Badges */}
          <View style={styles.featuresContainer}>
            <View
              style={[
                styles.featurePill,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? colors.border + "30"
                    : colors.border + "20",
                },
              ]}
            >
              <AppText
                variant="body"
                style={[styles.featureText, { color: colors.textMuted }]}
              >
                🗺️ Accessible route navigation & place guides
              </AppText>
            </View>
            <View
              style={[
                styles.featurePill,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark
                    ? colors.border + "30"
                    : colors.border + "20",
                },
              ]}
            >
              <AppText
                variant="body"
                style={[styles.featureText, { color: colors.textMuted }]}
              >
                ♿ Verified ramp, entrance & mobility info
              </AppText>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Actions Section */}
        <Animated.View
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: actionsSlideAnim }],
            },
          ]}
        >
          {/* Primary CTA: Get Started */}
          <TouchTarget
            accessibilityHint="Creates a new account to join Wayble"
            accessibilityLabel="Get Started"
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={handleGetStarted}
          >
            <AppText
              variant="bodyStrong"
              style={[styles.primaryButtonText, { color: colors.onPrimary }]}
            >
              Get Started
            </AppText>
          </TouchTarget>

          {/* Secondary CTA: Sign In */}
          <TouchTarget
            accessibilityHint="Navigates to the sign in page"
            accessibilityLabel="I already have an account. Sign in"
            accessibilityRole="button"
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={handleSignIn}
          >
            <AppText
              variant="bodyStrong"
              style={[styles.secondaryButtonText, { color: colors.text }]}
            >
              I already have an account
            </AppText>
          </TouchTarget>

          {/* Guest Exploration Option */}
          <TouchTarget
            accessibilityHint="Explores accessible map without signing in"
            accessibilityLabel="Explore map as guest"
            accessibilityRole="button"
            style={styles.guestButton}
            onPress={handleExploreGuest}
          >
            <AppText
              variant="label"
              style={[styles.guestButtonText, { color: colors.textMuted }]}
            >
              Explore map as guest →
            </AppText>
          </TouchTarget>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientGlow: {
    position: "absolute",
    top: "20%",
    left: "15%",
    right: "15%",
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  sloganContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sloganText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  featuresContainer: {
    width: "100%",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsSection: {
    width: "100%",
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  guestButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
