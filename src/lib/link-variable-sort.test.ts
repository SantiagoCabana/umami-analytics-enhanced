import { expect, test } from 'vitest';
import { sortLinkVariables, type VariableSort } from './link-variable-sort';

const variables = [
  { id: '1', name: 'bravo', createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
  { id: '2', name: 'alpha', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: '3', name: 'charlie', createdAt: null, updatedAt: '2026-03-01T00:00:00Z' },
  { id: '4', name: 'delta', createdAt: 'invalid', updatedAt: 'invalid' },
];

test.each<[VariableSort, string[]]>([
  ['name-asc', ['alpha', 'bravo', 'charlie', 'delta']],
  ['name-desc', ['delta', 'charlie', 'bravo', 'alpha']],
  ['created-asc', ['bravo', 'alpha', 'charlie', 'delta']],
  ['created-desc', ['alpha', 'bravo', 'charlie', 'delta']],
  ['updated-asc', ['charlie', 'alpha', 'bravo', 'delta']],
  ['updated-desc', ['alpha', 'charlie', 'bravo', 'delta']],
])('sorts %s without mutating input', (sort, expected) => {
  expect(sortLinkVariables(variables, sort).map(variable => variable.name)).toEqual(expected);
  expect(variables[0].name).toBe('bravo');
});

test('breaks date ties by name then id', () => {
  const equal = [
    { id: '2', name: 'alpha', createdAt: null, updatedAt: null },
    { id: '1', name: 'alpha', createdAt: null, updatedAt: null },
  ];
  expect(sortLinkVariables(equal, 'created-desc').map(item => item.id)).toEqual(['1', '2']);
});
