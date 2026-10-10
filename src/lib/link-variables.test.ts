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

test('uses an initial variable as the complete destination URL', () => {
  expect(
    resolveLinkVariables(`$${'{destination}'}?text=${variable('message')}`, {
      destination: 'https://wa.me/51919080741',
      message: 'Hola & gracias',
    }),
  ).toBe('https://wa.me/51919080741?text=Hola%20%26%20gracias');
});

test('accepts a complete URL variable followed by any destination suffix', () => {
  expect(isValidLinkDestinationUrl(`https://example.com/path?token=${variable('token')}`)).toBe(
    true,
  );
  expect(isValidLinkDestinationUrl(`https://${variable('domain')}/path`)).toBe(false);
  expect(isValidLinkDestinationUrl(`${variable('destination')}?text=hello`)).toBe(true);
  expect(isValidLinkDestinationUrl(`${variable('destination')}&text=hello`)).toBe(true);
  expect(isValidLinkDestinationUrl(`${variable('destination')}@example.com`)).toBe(true);
});
