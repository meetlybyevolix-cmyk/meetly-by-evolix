/**
 * Meetly Centralized Legal, Compliance & Safety Configuration
 * Evolix Studio
 *
 * Provides authoritative configuration values for:
 * - Information Technology (Intermediary Guidelines) Rules, 2021
 * - Digital Personal Data Protection Act, 2023 (DPDP)
 * - CERT-In Directions 2022 (Log retention & Incident Reporting)
 * - Google Publisher & AdSense Compliance Policies
 *
 * NOTE: Do not invent fake officer details or legal claims.
 * Unconfigured required fields are marked as launch blockers.
 */

export interface LegalConfig {
  siteName: string;
  publicSiteUrl: string;
  operatorName: string;
  operatorEntityType: string;
  legalContactEmail: string;
  privacyContactEmail: string;
  grievanceOfficerName: string;
  grievanceOfficerDesignation: string;
  grievanceOfficerEmail: string;
  grievancePostalAddress: string;
  minimumUserAge: number;
  termsEffectiveDate: string;
  privacyEffectiveDate: string;
  certInLogRetentionDays: number;
  enableAds: boolean;
  adsenseClientId: string;
  analyticsProvider: string;
  hostingProvider: string;
}

export function getLegalConfig(): LegalConfig {
  return {
    siteName: process.env.SITE_NAME?.trim() || "Meetly",
    publicSiteUrl:
      process.env.PUBLIC_SITE_URL?.trim() || "https://meetly.evolix.studio",
    operatorName: process.env.LEGAL_OPERATOR_NAME?.trim() || "Evolix Studio",
    operatorEntityType:
      process.env.LEGAL_ENTITY_TYPE?.trim() ||
      "[Entity Classification Pending - e.g., Private Limited / Partnership]",
    legalContactEmail:
      process.env.LEGAL_CONTACT_EMAIL?.trim() || "legal@meetly.evolix.studio",
    privacyContactEmail:
      process.env.PRIVACY_CONTACT_EMAIL?.trim() ||
      "privacy@meetly.evolix.studio",
    grievanceOfficerName:
      process.env.GRIEVANCE_OFFICER_NAME?.trim() ||
      "[Grievance Officer Name Pending Formal Appointment]",
    grievanceOfficerDesignation:
      process.env.GRIEVANCE_OFFICER_DESIGNATION?.trim() ||
      "Grievance Officer (under Rule 3(2) of the IT Rules, 2021)",
    grievanceOfficerEmail:
      process.env.GRIEVANCE_OFFICER_EMAIL?.trim() ||
      "grievance@meetly.evolix.studio",
    grievancePostalAddress:
      process.env.GRIEVANCE_POSTAL_ADDRESS?.trim() ||
      "[Postal Address Pending Verification by Operator, India]",
    minimumUserAge: Number(process.env.MINIMUM_USER_AGE || 18),
    termsEffectiveDate:
      process.env.TERMS_EFFECTIVE_DATE?.trim() || "October 29, 2026",
    privacyEffectiveDate:
      process.env.PRIVACY_POLICY_EFFECTIVE_DATE?.trim() || "October 29, 2026",
    certInLogRetentionDays: Number(
      process.env.CERT_IN_LOG_RETENTION_DAYS || 180
    ),
    enableAds: process.env.ENABLE_ADS === "true",
    adsenseClientId: process.env.ADSENSE_CLIENT_ID?.trim() || "",
    analyticsProvider: process.env.ANALYTICS_PROVIDER?.trim() || "Disabled (Privacy-by-Design)",
    hostingProvider: process.env.HOSTING_PROVIDER?.trim() || "Self-Hosted / Cloud VPS",
  };
}

export interface LegalReadinessReport {
  readyForLaunch: boolean;
  missingRequiredItems: string[];
  advisories: string[];
}

export function checkLegalLaunchReadiness(
  config = getLegalConfig()
): LegalReadinessReport {
  const missing: string[] = [];
  const advisories: string[] = [];

  if (
    !process.env.GRIEVANCE_OFFICER_NAME ||
    config.grievanceOfficerName.includes("Pending")
  ) {
    missing.push(
      "GRIEVANCE_OFFICER_NAME must be officially appointed and configured (mandatory under Rule 3(2) IT Rules, 2021)."
    );
  }

  if (
    !process.env.GRIEVANCE_POSTAL_ADDRESS ||
    config.grievancePostalAddress.includes("Pending")
  ) {
    missing.push(
      "GRIEVANCE_POSTAL_ADDRESS must be configured with the physical operational address in India."
    );
  }

  if (
    !process.env.LEGAL_ENTITY_TYPE ||
    config.operatorEntityType.includes("Pending")
  ) {
    missing.push(
      "LEGAL_ENTITY_TYPE must specify the registered business entity type of the operator (e.g. Private Limited Company)."
    );
  }

  if (config.minimumUserAge < 18) {
    advisories.push(
      "Minimum user age is set below 18. Under India's DPDP Act 2023, processing data of minors requires verifiable parental consent, which is incompatible with anonymous chat."
    );
  }

  if (config.enableAds && !config.adsenseClientId) {
    missing.push(
      "ENABLE_ADS is true but ADSENSE_CLIENT_ID is missing. Ads cannot be served without a verified publisher ID."
    );
  }

  return {
    readyForLaunch: missing.length === 0,
    missingRequiredItems: missing,
    advisories,
  };
}

