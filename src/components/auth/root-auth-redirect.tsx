'use client';

import { useEffect } from 'react';

import { buildRootAuthHashRedirectPath } from '@/lib/auth-redirect';

export function RootAuthRedirect() {
  useEffect(() => {
    const redirectPath = buildRootAuthHashRedirectPath(window.location.hash);

    if (redirectPath) {
      window.location.replace(redirectPath);
    }
  }, []);

  return null;
}
