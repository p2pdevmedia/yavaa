'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button, type ButtonProps } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

type SignOutButtonProps = {
  className?: string;
  variant?: ButtonProps['variant'];
};

export function SignOutButton({ className, variant = 'outline' }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    startTransition(() => {
      router.push('/');
      router.refresh();
    });
  }

  return (
    <Button variant={variant} className={className} onClick={handleSignOut} disabled={isPending}>
      {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </Button>
  );
}
