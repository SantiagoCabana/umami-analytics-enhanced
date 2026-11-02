import { expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { CopyButton } from './CopyButton';

test('copies the literal reference and announces success', async () => {
  const { user } = render(<CopyButton value={'$' + '{campaign}'} label="Copy campaign" />);
  const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  await user.click(screen.getByRole('button', { name: 'Copy campaign' }));
  expect(write).toHaveBeenCalledWith('$' + '{campaign}');
  expect(screen.getByRole('status')).toHaveTextContent('Copied');
});

test('announces clipboard rejection and allows retry', async () => {
  const { user } = render(<CopyButton value="reference" />);
  const write = vi
    .spyOn(navigator.clipboard, 'writeText')
    .mockRejectedValueOnce(new Error('Denied'));
  await user.click(screen.getByRole('button', { name: 'Copy' }));
  expect(screen.getByRole('status')).toHaveTextContent('Could not copy');
  write.mockResolvedValue();
  await user.click(screen.getByRole('button', { name: 'Copy' }));
  expect(screen.getByRole('status')).toHaveTextContent('Copied');
});
