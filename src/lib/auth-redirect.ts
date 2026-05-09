type AuthRedirectBaseInput = {
  siteUrl?: string;
  vercelUrl?: string;
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
  vercelUrl,
  windowOrigin
}: AuthRedirectBaseInput): string {
  const configuredUrl = siteUrl?.trim() || vercelUrl?.trim();

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  return normalizeBaseUrl(windowOrigin);
}

export function buildAuthEmailRedirectTo(nextPath: string, windowOrigin: string): string {
  const baseUrl = getAuthRedirectBaseUrl({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
    windowOrigin
  });

  return `${baseUrl}${nextPath}`;
}
