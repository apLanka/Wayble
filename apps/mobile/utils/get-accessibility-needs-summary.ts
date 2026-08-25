export function getAccessibilityNeedsSummary(
  currentUser: { accessibilityNeeds?: string[] | null } | null | undefined,
): string {
  if (currentUser == null) {
    return "Sign in to set your needs";
  }

  const count = currentUser.accessibilityNeeds?.length ?? 0;
  if (count === 0) {
    return "Not set yet";
  }

  return `${count} need${count === 1 ? "" : "s"} selected`;
}
