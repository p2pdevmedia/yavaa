type AuthRedirectBaseInput = {
  siteUrl?: string;
  windowOrigin: string;
};

function normalizeBaseUrl(url: string): string {
  const trimmedUrl = url.trim();
  const absoluteUrl =
    trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
      ? trimmedUrl
      : `https://${trimmedUrl}`;

  return absoluteUrl.replace(/\/+$/, '');
}

export function getAuthRedirectBaseUrl({
  siteUrl,
  windowOrigin
}: AuthRedirectBaseInput): string {
  const configuredUrl = siteUrl?.trim();

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  return normalizeBaseUrl(windowOrigin);
}

export function buildAuthCallbackRedirectTo(nextPath: string, windowOrigin: string): string {
  const baseUrl = getAuthRedirectBaseUrl({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    windowOrigin
  });

  return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function buildAuthEmailRedirectTo(nextPath: string, windowOrigin: string): string {
  return buildAuthCallbackRedirectTo(nextPath, windowOrigin);
}

export function buildPasswordResetRedirectTo(windowOrigin: string): string {
  return buildAuthCallbackRedirectTo('/reset-password', windowOrigin);
}
