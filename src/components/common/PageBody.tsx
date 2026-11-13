'use client';
import { Alert, AlertTitle, Column, type ColumnProps, Loading } from '@umami/react-zen';
import type { ReactNode } from 'react';
import { useMessages } from '@/components/hooks';

const DEFAULT_WIDTH = '100%';

export function PageBody({
  maxWidth = DEFAULT_WIDTH,
  paddingBottom = '0',
  paddingX = '0',
  error,
  isLoading,
  children,
  ...props
}: {
  maxWidth?: string;
  error?: unknown;
  isLoading?: boolean;
  children?: ReactNode;
} & ColumnProps) {
  const { t, messages } = useMessages();

  if (error) {
    return (
      <Alert variant="danger">
        <AlertTitle>{t(messages.error)}</AlertTitle>
      </Alert>
    );
  }

  if (isLoading) {
    return <Loading placement="absolute" />;
  }

  return (
    <Column
      {...props}
      width="100%"
      paddingBottom={paddingBottom}
      maxWidth={maxWidth}
      paddingX={paddingX}
      style={{ margin: '0 auto' }}
    >
      {children}
    </Column>
  );
}
