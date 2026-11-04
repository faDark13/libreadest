/**
 * This fork has no accounts, no cloud plans and no paywall: every feature is
 * local and available to everyone. These helpers keep their original
 * signatures so call sites stay unchanged, and report the permissive result.
 */
export const isSelfHosted = (): boolean => true;

export const isCustomizationAllowed = (..._args: unknown[]): boolean => true;
export const isCustomTranslatorAllowed = (..._args: unknown[]): boolean => true;
export const isCustomTTSAllowed = (..._args: unknown[]): boolean => true;
export const isCloudSyncAllowed = (..._args: unknown[]): boolean => true;
export const isTTSCacheAllowed = (..._args: unknown[]): boolean => true;
export const isAbsOfflineAllowed = (..._args: unknown[]): boolean => true;
export const isNearbyPairingAllowed = (..._args: unknown[]): boolean => true;
export const isEmailInPlan = (..._args: unknown[]): boolean => true;
export const isTTSInPlan = (..._args: unknown[]): boolean => true;
export const isVoiceTierInPlan = (..._args: unknown[]): boolean => true;

export const CLOUD_SYNC_REQUIRES_PREMIUM = false;
export const TTS_CACHE_REQUIRES_PREMIUM = false;
export const ABS_OFFLINE_REQUIRES_PREMIUM = false;
export const NEARBY_PAIRING_REQUIRES_PREMIUM = false;

export const STORAGE_QUOTA_GRACE_BYTES = 10 * 1024 * 1024;

/** No plans exist; report the fully entitled ones for the callers that ask. */
export const getSubscriptionPlan = (..._args: unknown[]) => 'pro' as const;
export const getUserProfilePlan = (..._args: unknown[]) => 'pro' as const;
export const getCustomizationPurchased = (..._args: unknown[]) => true;
export const getTranslationQuota = (..._args: unknown[]): number => Number.MAX_SAFE_INTEGER;
export const getTTSQuota = (..._args: unknown[]): number => Number.MAX_SAFE_INTEGER;

/** No auth backend: nothing signs in, so there is no token or user id. */
export const getAccessToken = async (): Promise<string | null> => null;
export const getUserID = async (): Promise<string | null> => null;
