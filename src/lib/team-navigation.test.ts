import { describe, expect, test } from 'vitest';
import { getTeamNavigationPath } from './team-navigation';

const sourceTeamId = '3ba48f46-d24c-44d0-9276-79539c5f58a1';
const targetTeamId = 'db8013f5-29fc-48ed-8ec9-6a87b9487296';

describe('getTeamNavigationPath', () => {
  test.each([
    ['/links', targetTeamId, `/teams/${targetTeamId}/links`],
    ['/links/03ce6a01-1f8a-417c-b841-a112600464bf', targetTeamId, `/teams/${targetTeamId}/links`],
    [`/teams/${sourceTeamId}/links/03ce6a01-1f8a-417c-b841-a112600464bf/edit`, undefined, '/links'],
    [
      `/teams/${sourceTeamId}/websites/03ce6a01-1f8a-417c-b841-a112600464bf`,
      targetTeamId,
      `/teams/${targetTeamId}/websites`,
    ],
    ['/pixels/03ce6a01-1f8a-417c-b841-a112600464bf', targetTeamId, `/teams/${targetTeamId}/pixels`],
    [
      `/teams/${sourceTeamId}/boards/03ce6a01-1f8a-417c-b841-a112600464bf/design`,
      undefined,
      '/boards',
    ],
    ['/links/variables', undefined, '/links'],
    ['/dashboard', targetTeamId, `/teams/${targetTeamId}/websites`],
    ['/admin/users', targetTeamId, `/teams/${targetTeamId}/websites`],
    ['/settings/profile', undefined, '/websites'],
    ['/', undefined, '/websites'],
  ])('normalizes %s for the destination context', (pathname, teamId, expected) => {
    expect(getTeamNavigationPath(pathname, teamId)).toBe(expected);
  });
});
