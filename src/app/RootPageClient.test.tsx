import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getTestRouter } from '@/test/navigation';
import { RootPageClient } from './RootPageClient';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

test('sends visitors without a token straight to login', () => {
  render(<RootPageClient />);
  expect(getTestRouter().replace).toHaveBeenCalledWith('/login');
});

test('sends logged-in users to their websites', () => {
  localStorage.setItem('umami.auth', JSON.stringify('token'));
  render(<RootPageClient />);
  expect(getTestRouter().replace).toHaveBeenCalledWith('/websites');
});

test('sends logged-in users back to their last team', () => {
  localStorage.setItem('umami.auth', JSON.stringify('token'));
  localStorage.setItem('umami.last-team', JSON.stringify('team-1'));
  render(<RootPageClient />);
  expect(getTestRouter().replace).toHaveBeenCalledWith('/teams/team-1/websites');
});

test('keeps the normal flow in cloud mode', () => {
  vi.stubEnv('cloudMode', '1');
  render(<RootPageClient />);
  expect(getTestRouter().replace).toHaveBeenCalledWith('/websites');
});
