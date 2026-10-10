import type { Metadata } from 'next';
import { LinkVariablesPage } from './LinkVariablesPage';

export default function () {
  return <LinkVariablesPage />;
}

export const metadata: Metadata = {
  title: 'Variables',
};
