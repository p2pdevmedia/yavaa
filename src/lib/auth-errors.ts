export type AuthErrorParams = {
  error?: string | string[];
  error_code?: string | string[];
  error_description?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function hasAuthErrorParams(params: AuthErrorParams): boolean {
  return Boolean(firstParam(params.error) ?? firstParam(params.error_code) ?? firstParam(params.error_description));
}

export function buildAuthErrorMessage(params: AuthErrorParams): string {
  const errorCode = firstParam(params.error_code);

  if (errorCode === 'otp_expired') {
    return 'El enlace de recuperación venció o ya fue usado. Pedí uno nuevo para cambiar tu contraseña.';
  }

  return 'No pudimos completar la autenticación con Supabase. Intentá de nuevo o pedí un enlace nuevo.';
}

export function buildAuthErrorRedirectPath(params: AuthErrorParams): string {
  const searchParams = new URLSearchParams({
    authError: buildAuthErrorMessage(params)
  });

  return `/forgot-password?${searchParams.toString()}`;
}
