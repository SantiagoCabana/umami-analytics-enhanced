import type { Metadata } from 'next';
import { DomainsPage } from './DomainsPage';

export default function () {
  return <DomainsPage />;
}

export const metadata: Metadata = {
  title: 'Domains',
};
