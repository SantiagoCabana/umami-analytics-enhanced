import { useEffect } from 'react';
import { useApi } from '@/components/hooks/useApi';
import { setConfig, useApp } from '@/store/app';

export type Config = {
  baseDomain?: string;
  cloudMode: boolean;
  faviconUrl?: string;
  linkDomains: string[];
  pixelsUrl?: string;
  privateMode: boolean;
  sessionDeletionEnabled: boolean;
  telemetryDisabled: boolean;
  trackerScriptName?: string;
  updatesDisabled: boolean;
};

export function useConfig(): Config {
  const { config } = useApp();
  const { get } = useApi();

  async function loadConfig() {
    const data = await get(`/config`);

    setConfig(data);
  }

  useEffect(() => {
    if (!config) {
      loadConfig().catch(error => {
        console.warn('Unable to load application configuration.', error);
      });
    }
  }, []);

  return config;
}
