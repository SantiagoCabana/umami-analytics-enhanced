import { expect, test } from 'vitest';
import {
  getLinkVariableNames,
  isValidLinkDestinationUrl,
  normalizeLinkVariableName,
  resolveLinkVariables,
} from './link-variables';

const variable = (name: string) => `\${${name}}`;

test('normalizes variable names to lowercase', () => {
  expect(normalizeLinkVariableName(' WhatsApp_Token ')).toBe('whatsapp_token');
  expect(normalizeLinkVariableName('whatsapp-token')).toBeNull();
});

test('finds variables without considering their case', () => {
  expect(
    getLinkVariableNames(
      `https://example.com/?one=${variable('Token')}&two=${variable('token')}&three=${variable('other')}`,
    ),
  ).toEqual(['token', 'other']);
});

test('keeps missing variables literal and safely encodes defined values', () => {
  expect(
    resolveLinkVariables(
      `https://example.com/?token=${variable('TOKEN')}&missing=${variable('other')}`,
      {
        token: 'a&b c',
      },
    ),
  ).toBe(`https://example.com/?token=a%26b%20c&missing=${variable('other')}`);
});

test('only accepts destination variables after the URL authority', () => {
  expect(isValidLinkDestinationUrl(`https://example.com/path?token=${variable('token')}`)).toBe(
    true,
  );
  expect(isValidLinkDestinationUrl(`https://${variable('domain')}/path`)).toBe(false);
});
