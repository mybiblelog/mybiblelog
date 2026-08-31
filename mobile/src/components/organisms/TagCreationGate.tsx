import { useT } from "@/src/i18n/LocaleProvider";
import { useIsAuthenticated } from "@/src/stores/auth";
import { useCanReachServer } from "@/src/stores/connectivity";
import { ConnectionNotice } from "../molecules/ConnectionNotice";
import { InlineHint } from "../molecules/InlineHint";

/**
 * Tags are the one piece of note data with **no offline mutation queue** —
 * unlike notes and log entries, a tag can only be created against a live,
 * authenticated API. So both Create Tag entry points (the manage-tags screen
 * and the note editor's tag picker) withdraw the action up front rather than
 * letting the user fill in a form that can't be saved.
 *
 * The gate and the explanation live together here so they can't drift: a
 * disabled control whose stated reason doesn't match why it's disabled is
 * worse than no reason at all.
 */
export function useCanCreateTags(): boolean {
  // Both hooks run unconditionally — short-circuiting across hook calls trips
  // `react-hooks/rules-of-hooks`.
  const isAuthenticated = useIsAuthenticated();
  const canReachServer = useCanReachServer();
  return isAuthenticated && canReachServer;
}

/** Why tag creation is unavailable, or nothing when it's available. */
export function TagCreationNotice({ testID }: { testID?: string }) {
  const t = useT();
  const isAuthenticated = useIsAuthenticated();

  // Signed out is checked first: it's the reason that holds even when the
  // network is perfectly fine, where the connectivity copy would be a lie.
  if (!isAuthenticated) {
    return (
      <InlineHint testID={testID} icon="log-in-outline" text={t("tag_create_requires_signin")} />
    );
  }
  return (
    <ConnectionNotice
      testID={testID}
      offlineText={t("tag_create_requires_connection")}
      unreachableText={t("tag_create_requires_server")}
    />
  );
}
