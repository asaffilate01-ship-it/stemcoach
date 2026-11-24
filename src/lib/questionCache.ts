/**
 * Protected question payloads must not persist on a shared browser or be
 * resurrected after access is revoked. Public static app assets may still be
 * cached by the PWA. This best-effort migration removes the legacy stores.
 * Old open tabs or browsers without storage APIs may delay cleanup.
 */
export async function purgeLegacyQuestionCaches(): Promise<void> {
  if (typeof indexedDB !== "undefined") {
    try { indexedDB.deleteDatabase("stemcoach-offline"); } catch { /* unavailable */ }
  }
  if (typeof caches !== "undefined") {
    try { await caches.delete("questions-api-cache"); } catch { /* unavailable */ }
  }
}
