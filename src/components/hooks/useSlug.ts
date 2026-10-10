import { useConfig } from '@/components/hooks/useConfig';
import { PIXELS_URL } from '@/lib/constants';

export function useSlug(type: 'link' | 'pixel') {
  const config = useConfig();
  const baseDomain = config?.baseDomain;
  const pixelsUrl = config?.pixelsUrl;

  const hostUrl =
    type === 'link'
      ? baseDomain
        ? `https://${baseDomain}/q`
        : `${globalThis?.location?.origin}/q`
      : pixelsUrl || PIXELS_URL;

  const getSlugUrl = (slug: string) => {
    return `${hostUrl}/${slug}`;
  };

  return { getSlugUrl, hostUrl };
}
