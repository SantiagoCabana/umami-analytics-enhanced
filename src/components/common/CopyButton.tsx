import { Button, Icon } from '@umami/react-zen';
import { useEffect, useRef, useState } from 'react';
import { useMessages } from '@/components/hooks';
import { Check, Copy } from '@/components/icons';

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t, labels } = useMessages();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
    } catch {
      setCopied(false);
      setError(true);
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <Button
        variant="quiet"
        onPress={handleCopy}
        aria-label={label || t(labels.copy)}
        title={label || t(labels.copy)}
      >
        <Icon size="sm">{copied ? <Check /> : <Copy />}</Icon>
      </Button>
      <span role="status" className={error ? 'text-sm text-error' : 'sr-only'}>
        {error ? t(labels.copyFailed) : copied ? t(labels.copied) : ''}
      </span>
    </span>
  );
}
