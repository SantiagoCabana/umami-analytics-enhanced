import { DataColumn } from '@umami/react-zen';
import { expect, test } from 'vitest';
import { render, screen } from '@/test/render';
import { DataTable } from './DataTable';

test('keeps paging controls outside the keyboard-accessible scroll region', () => {
  render(
    <div>
      <DataTable data={[{ id: 'one', name: 'Campaign' }]}>
        <DataColumn id="name" label="Name" />
      </DataTable>
      <button type="button">Next page</button>
    </div>,
  );
  const region = screen.getByRole('region', { name: 'Table' });
  expect(region).toHaveAttribute('tabindex', '0');
  expect(region).toContainElement(screen.getByRole('table'));
  expect(region).not.toContainElement(screen.getByRole('button', { name: 'Next page' }));
});

test('preserves the card display mode', () => {
  render(
    <DataTable data={[{ id: 'one', name: 'Campaign' }]} displayMode="cards">
      <DataColumn id="name" label="Name" />
    </DataTable>,
  );
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getByText('Campaign')).toBeInTheDocument();
});
