import { Image, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import waybleAppIcon from "@/assets/images/app-icon/wayble-app-icon.png";

import { AppSymbol, HOME_SYMBOLS } from "@/components/ui/app-symbol";
import { AppText } from "@/components/ui/app-text";
import { TouchTarget } from "@/components/ui/touch-target";
import { STRINGS } from "@/constants/strings";
import { spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getTimeGreeting } from "@/utils/get-time-greeting";

interface HomeHeaderProps {
  displayName?: string | null;
}

export function HomeHeader({ displayName }: HomeHeaderProps) {
  const { appTheme } = useAppTheme();
  const router = useRouter();

  const greeting = STRINGS.home.profileGreeting(
    getTimeGreeting(),
    displayName ?? null,
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Image
            source={waybleAppIcon}
            style={styles.logo}
            resizeMode="cover"
            accessibilityRole="image"
            accessibilityLabel={STRINGS.home.a11y.logo}
          />
          <AppText
            variant="title"
            accessibilityRole="header"
            style={styles.greeting}
          >
            {greeting}
          </AppText>
        </View>
        <TouchTarget
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.home.a11y.openProfile}
          accessibilityHint={STRINGS.home.a11y.openProfileHint}
          style={styles.profileButton}
        >
          <AppSymbol
            name={HOME_SYMBOLS.profile}
            size={24}
            tintColor={appTheme.colors.textMuted}
          />
        </TouchTarget>
      </View>
      <AppText style={{ color: appTheme.colors.textMuted }}>
        {STRINGS.common.tagline}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  brandRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  greeting: {
    flex: 1,
  },
  profileButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
