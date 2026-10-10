'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LAST_TEAM_CONFIG } from '@/lib/constants';
import { getItem } from '@/lib/storage';

export function RootPageClient() {
  const router = useRouter();

  useEffect(() => {
    const lastTeam = getItem(LAST_TEAM_CONFIG);

    if (lastTeam) {
      router.replace(`/teams/${lastTeam}/websites`);
    } else {
      router.replace('/websites');
    }
  }, [router]);

  return null;
}
