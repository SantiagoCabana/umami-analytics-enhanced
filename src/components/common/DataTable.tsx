'use client';

import { type DataTableProps, DataTable as ZenDataTable } from '@umami/react-zen';
import { useLayoutEffect, useRef } from 'react';
import { useMessages } from '@/components/hooks';
import styles from './DataTable.module.css';

/** One scroll owner per table, including standalone reports and dialogs. */
export function DataTable(props: DataTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, labels } = useMessages();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      let bottom = viewportHeight - 24;
      let reserved = 0;
      let node: HTMLElement = element;
      // Reserve controls below the table and respect a containing modal's bounds.
      while (node.parentElement && node.parentElement !== document.body) {
        const parent = node.parentElement;
        const style = getComputedStyle(parent);
        const nodeRect = node.getBoundingClientRect();
        const nodeStyle = getComputedStyle(node);
        reserved += Number.parseFloat(nodeStyle.marginBottom) || 0;
        reserved += Number.parseFloat(style.paddingBottom) || 0;
        reserved += Number.parseFloat(style.borderBottomWidth) || 0;
        for (const sibling of Array.from(parent.children)) {
          if (sibling === node || !(node.compareDocumentPosition(sibling) & 4)) continue;
          const rect = sibling.getBoundingClientRect();
          const siblingStyle = getComputedStyle(sibling);
          if (
            rect.height &&
            rect.top >= nodeRect.bottom - 1 &&
            rect.right > nodeRect.left &&
            rect.left < nodeRect.right &&
            !['fixed', 'absolute'].includes(siblingStyle.position)
          ) {
            reserved +=
              rect.height +
              (Number.parseFloat(style.rowGap) || 0) +
              (Number.parseFloat(siblingStyle.marginTop) || 0) +
              (Number.parseFloat(siblingStyle.marginBottom) || 0);
          }
        }
        if (parent.getAttribute('role') === 'dialog') {
          // Dialogs are centered and resize with their content. Using their current
          // bottom here would create a resize/shrink feedback loop.
          bottom = Math.min(bottom, element.getBoundingClientRect().top + viewportHeight * 0.55);
          break;
        }
        if (/(auto|scroll|hidden)/.test(style.overflowY)) {
          // Work in the scroll owner's unscrolled coordinates. Otherwise a tiny
          // outer scroll moves the table upward and makes it grow on the next resize.
          const parentRect = parent.getBoundingClientRect();
          bottom = Math.min(bottom, parentRect.top + parent.clientTop + parent.clientHeight);
          reserved += parent.scrollTop;
        }
        node = parent;
      }
      const top = element.getBoundingClientRect().top;
      // Low-height screens still get a usable scroll area; the page can scroll to it.
      const height = Math.max(Math.min(160, viewportHeight * 0.4), bottom - top - reserved);
      element.style.maxHeight = `${Math.floor(height)}px`;
      element.style.height = props.displayMode === 'cards' ? 'auto' : `${Math.floor(height)}px`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    let node: HTMLElement | null = element;
    while (node) {
      observer?.observe(node);
      node = node.parentElement;
    }
    measure();
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [props.displayMode]);

  return (
    <div
      ref={ref}
      className={styles.viewport}
      role="region"
      aria-label={t(labels.table)}
      tabIndex={0}
    >
      <ZenDataTable {...props} />
    </div>
  );
}
