export function isDatabaseUnavailableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const typedError = error as {
    code?: unknown;
    message?: unknown;
    meta?: {
      driverAdapterError?: {
        message?: unknown;
      };
    };
  };

  if (typedError.code === 'P1001') {
    return true;
  }

  if (typeof typedError.message === 'string' && /Can't reach database server|DatabaseNotReachable/i.test(typedError.message)) {
    return true;
  }

  return (
    typeof typedError.meta?.driverAdapterError?.message === 'string' &&
    /DatabaseNotReachable/i.test(typedError.meta.driverAdapterError.message)
  );
}

export function shouldUsePublicDemoFallback(): boolean {
  return process.env.NODE_ENV !== 'production';
}
