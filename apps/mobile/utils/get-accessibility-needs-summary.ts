import { STRINGS } from "@/constants/strings";

export function getAccessibilityNeedsSummary(
  currentUser: { accessibilityNeeds?: string[] | null } | null | undefined,
): string {
  return STRINGS.profile.needsSummary(
    currentUser != null,
    currentUser?.accessibilityNeeds?.length ?? 0,
  );
}
