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
import { STRINGS } from "@/constants/strings";
import { radii, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { appTheme } = useAppTheme();
  const { colors } = appTheme;
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setServerError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(STRINGS.errors.auth.emailRequired);
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError(STRINGS.errors.auth.emailInvalid);
      isValid = false;
    }

    if (!password) {
      setPasswordError(STRINGS.errors.auth.passwordRequired);
      isValid = false;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        STRINGS.errors.auth.passwordTooShort(MIN_PASSWORD_LENGTH),
      );
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(STRINGS.errors.auth.confirmPasswordRequired);
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(STRINGS.errors.auth.passwordsDoNotMatch);
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validate() || isLoading) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signUp",
      });
      router.replace("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("account already exists") ||
        message.toLowerCase().includes("email already in use")
      ) {
        setServerError(STRINGS.errors.auth.emailAlreadyInUse);
      } else {
        setServerError(message || STRINGS.errors.auth.signUpUnexpected);
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
              {STRINGS.common.createAccountCapitalised}
            </AppText>
            <AppText
              variant="body"
              style={[styles.subtitle, { color: colors.textMuted }]}
            >
              {STRINGS.auth.signUp.subtitle}
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
                nativeID="signup-email-label"
              >
                {STRINGS.auth.fieldLabels.email}
              </AppText>
              <TextInput
                accessibilityLabel={STRINGS.auth.fieldLabels.email}
                accessibilityLabelledBy="signup-email-label"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder={STRINGS.auth.signIn.emailPlaceholder}
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
                nativeID="signup-password-label"
              >
                {STRINGS.auth.fieldLabels.password}
              </AppText>
              <TextInput
                accessibilityLabel={STRINGS.auth.fieldLabels.password}
                accessibilityLabelledBy="signup-password-label"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect={false}
                secureTextEntry
                placeholder={STRINGS.auth.signUp.passwordPlaceholder}
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

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <AppText
                variant="label"
                style={[styles.label, { color: colors.text }]}
                nativeID="signup-confirm-password-label"
              >
                {STRINGS.auth.fieldLabels.confirmPassword}
              </AppText>
              <TextInput
                accessibilityLabel={STRINGS.auth.fieldLabels.confirmPassword}
                accessibilityLabelledBy="signup-confirm-password-label"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect={false}
                secureTextEntry
                placeholder={STRINGS.auth.signUp.confirmPasswordPlaceholder}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: confirmPasswordError
                      ? colors.danger
                      : colors.border,
                    color: colors.text,
                  },
                ]}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError("");
                }}
              />
              {confirmPasswordError ? (
                <AppText
                  variant="label"
                  style={[styles.fieldError, { color: colors.danger }]}
                  accessibilityRole="alert"
                >
                  {confirmPasswordError}
                </AppText>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchTarget
              accessibilityLabel={STRINGS.common.createAccount}
              accessibilityRole="button"
              disabled={isLoading}
              onPress={handleSignUp}
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
                  {STRINGS.common.createAccountCapitalised}
                </AppText>
              )}
            </TouchTarget>
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <AppText variant="body" style={{ color: colors.textMuted }}>
              {STRINGS.auth.signUp.haveAccount}
            </AppText>
            <Link href="/sign-in" asChild>
              <TouchTarget
                accessibilityLabel={STRINGS.auth.signUp.toSignInLabel}
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
                  {STRINGS.common.signInLower}
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
