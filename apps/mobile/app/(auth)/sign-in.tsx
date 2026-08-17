import { useAuthActions } from "@convex-dev/auth/react";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { TouchTarget } from "@/components/ui/touch-target";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setServerError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    return isValid;
  };

  const handleSignIn = async () => {
    if (!validate() || isLoading) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signIn",
      });
      router.replace("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("account") ||
        message.toLowerCase().includes("secret") ||
        message.toLowerCase().includes("credential")
      ) {
        setServerError(
          "Invalid email or password. Please check your credentials.",
        );
      } else {
        setServerError(
          message || "An unexpected error occurred. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="display" style={{ color: colors.primary }}>
              Wayble
            </AppText>
            <AppText
              variant="body"
              style={[styles.subtitle, { color: colors.textMuted }]}
            >
              Sign in to contribute and verify accessibility information.
            </AppText>
          </View>

          {/* Server Error Alert */}
          {serverError ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.danger + "1A",
                  borderColor: colors.danger,
                },
              ]}
            >
              <AppText variant="bodyStrong" style={{ color: colors.danger }}>
                {serverError}
              </AppText>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <AppText
                variant="label"
                style={[styles.label, { color: colors.text }]}
                nativeID="email-label"
              >
                Email
              </AppText>
              <TextInput
                accessibilityLabel="Email"
                accessibilityLabelledBy="email-label"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: emailError ? colors.danger : colors.border,
                    color: colors.text,
                  },
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                }}
              />
              {emailError ? (
                <AppText
                  variant="label"
                  style={[styles.fieldError, { color: colors.danger }]}
                  accessibilityRole="alert"
                >
                  {emailError}
                </AppText>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <AppText
                variant="label"
                style={[styles.label, { color: colors.text }]}
                nativeID="password-label"
              >
                Password
              </AppText>
              <TextInput
                accessibilityLabel="Password"
                accessibilityLabelledBy="password-label"
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect={false}
                secureTextEntry
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: passwordError ? colors.danger : colors.border,
                    color: colors.text,
                  },
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError("");
                }}
              />
              {passwordError ? (
                <AppText
                  variant="label"
                  style={[styles.fieldError, { color: colors.danger }]}
                  accessibilityRole="alert"
                >
                  {passwordError}
                </AppText>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchTarget
              accessibilityLabel="Sign in"
              accessibilityRole="button"
              disabled={isLoading}
              onPress={handleSignIn}
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <AppText
                  variant="bodyStrong"
                  style={{ color: colors.onPrimary }}
                >
                  Sign In
                </AppText>
              )}
            </TouchTarget>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <AppText variant="body" style={{ color: colors.textMuted }}>
              Don't have an account?{" "}
            </AppText>
            <Link href="/sign-up" asChild>
              <TouchTarget
                accessibilityLabel="Go to sign up screen"
                accessibilityRole="link"
                style={styles.linkTouchTarget}
              >
                <AppText
                  variant="bodyStrong"
                  style={{
                    color: colors.primary,
                    textDecorationLine: "underline",
                  }}
                >
                  Create account
                </AppText>
              </TouchTarget>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  errorBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  fieldError: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
  submitButton: {
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxl,
    flexWrap: "wrap",
  },
  linkTouchTarget: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
