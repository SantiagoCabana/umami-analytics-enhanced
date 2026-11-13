import { expect, test, vi } from 'vitest';
import { render, screen, within } from '@/test/render';
import { Breakdown } from './Breakdown';

vi.mock('@/components/hooks', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components/hooks')>();
  return {
    ...actual,
    useBreakdownQuery: () => ({
      data: Array.from({ length: 120 }, (_, index) => ({
        path: `/example-${index}`,
        visits: 1,
        visitors: 1,
        views: 1,
        bounces: 0,
        totaltime: 1,
      })),
    }),
    useFields: () => ({ fields: [{ name: 'path', label: 'Path' }] }),
    useFormat: () => ({ formatValue: (value: string) => value }),
  };
});

test('renders a bounded page of results and keeps paging outside the table', async () => {
  const { user } = render(
    <Breakdown
      websiteId="test"
      startDate={new Date()}
      endDate={new Date()}
      selectedFields={['path']}
    />,
  );
  const table = screen.getByRole('table');
  expect(within(table).getAllByRole('row')).toHaveLength(51);
  expect(screen.getByText('/example-0')).toBeInTheDocument();
  expect(screen.queryByText('/example-50')).not.toBeInTheDocument();
  const buttons = screen.getAllByRole('button');
  await user.click(buttons[buttons.length - 1]);
  expect(screen.getByText('/example-50')).toBeInTheDocument();
  expect(screen.queryByText('/example-0')).not.toBeInTheDocument();
});
