import { DataColumn } from '@umami/react-zen';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { DataTable } from './DataTable';

test('reserves pager margins as well as its height', () => {
  const rect = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const pager = this.getAttribute('data-pager') === 'true';
      return {
        top: pager ? 500 : 100,
        bottom: pager ? 540 : 500,
        left: 0,
        right: 800,
        width: 800,
        height: pager ? 40 : 400,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      };
    });
  try {
    const { unmount } = render(
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
        <DataTable data={[{ id: 'one', name: 'Campaign' }]}>
          <DataColumn id="name" label="Name" />
        </DataTable>
        <div data-pager="true" style={{ marginTop: 16, marginBottom: 8 }}>
          Pager
        </div>
      </div>,
    );
    const withMargins = Number.parseFloat(
      screen.getByRole('region', { name: 'Table' }).style.height,
    );
    unmount();
    render(
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
        <DataTable data={[{ id: 'one', name: 'Campaign' }]}>
          <DataColumn id="name" label="Name" />
        </DataTable>
        <div data-pager="true">Pager</div>
      </div>,
    );
    expect(
      Number.parseFloat(screen.getByRole('region', { name: 'Table' }).style.height) - withMargins,
    ).toBe(24);
  } finally {
    rect.mockRestore();
  }
});

test('does not use the natural height of a clipping parent as the viewport limit', () => {
  const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    top: 100,
    bottom: 300,
    left: 0,
    right: 800,
    width: 800,
    height: 200,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  }));
  const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
  try {
    render(
      <div style={{ overflow: 'hidden' }}>
        <DataTable data={[{ id: 'one', name: 'Campaign' }]}>
          <DataColumn id="name" label="Name" />
        </DataTable>
      </div>,
    );
    expect(
      Number.parseFloat(screen.getByRole('region', { name: 'Table' }).style.height),
    ).toBeGreaterThan(200);
  } finally {
    rect.mockRestore();
    height.mockRestore();
  }
});

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

test('page scroll mode removes viewport sizing when switched', () => {
  const table = (scrollMode: 'page' | 'viewport') => (
    <DataTable scrollMode={scrollMode} data={[{ id: 'one', name: 'Campaign' }]}>
      <DataColumn id="name" label="Name" />
    </DataTable>
  );
  const { rerender } = render(table('viewport'));
  const region = screen.getByRole('region', { name: 'Table' });
  expect(region.style.height).not.toBe('');
  rerender(table('page'));
  expect(region.style.height).toBe('');
  expect(region.style.maxHeight).toBe('');
});
