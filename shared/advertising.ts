/** Only public advertising settings belong here. Publisher IDs are not secrets. */
export function validPublisherId(value: string | undefined): string {
  const id = value?.trim() || "";
  return /^ca-pub-\d{16}$/.test(id) && !id.endsWith("0000000000000000")
    ? id
    : "";
}

export function advertisingConfig(env: Record<string, string | undefined>) {
  const publisherId = validPublisherId(env.ADSENSE_CLIENT_ID);
  const enabled = env.ENABLE_ADS === "true";
  if (enabled && !publisherId) {
    throw new Error(
      "ENABLE_ADS requires a valid ADSENSE_CLIENT_ID from your AdSense account."
    );
  }
  return {
    publisherId,
    // Operator assertion that a certified CMP is published and verified, NOT user consent.
    // Google's configured CMP collects the visitor's consent.
    enabled: enabled && env.ADSENSE_CMP_READY === "true",
  };
}

export function adsTxt(publisherId: string) {
  const id = validPublisherId(publisherId);
  return id
    ? `google.com, ${id.slice(3)}, DIRECT, f08c47fec0942fa0\n`
    : "# Advertising is not configured. No authorized sellers.\n";
}
