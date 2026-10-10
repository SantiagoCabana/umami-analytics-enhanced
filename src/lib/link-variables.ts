import { isValidLinkUrl } from './link-domains';

export const LINK_VARIABLE_REGEX = /\$\{([a-z][a-z0-9_]*)\}/gi;
export const LINK_VARIABLE_NAME_REGEX = /^[a-z][a-z0-9_]{0,63}$/;

export function normalizeLinkVariableName(value?: string | null) {
  const name = value?.trim().toLowerCase();

  return name && LINK_VARIABLE_NAME_REGEX.test(name) ? name : null;
}

export function getLinkVariableNames(url: string) {
  return Array.from(url.matchAll(LINK_VARIABLE_REGEX), ([, name]) => name.toLowerCase()).filter(
    (name, index, names) => names.indexOf(name) === index,
  );
}

export function isValidLinkDestinationUrl(value: string) {
  if (!isValidLinkUrl(value)) {
    return false;
  }

  const authorityStart = value.indexOf('://') + 3;
  const pathStart = value.slice(authorityStart).search(/[/?#]/);
  const authorityEnd = pathStart === -1 ? value.length : authorityStart + pathStart;

  return !Array.from(value.matchAll(LINK_VARIABLE_REGEX)).some(
    match => match.index !== undefined && match.index < authorityEnd,
  );
}

export function resolveLinkVariables(url: string, variables: Record<string, string>) {
  return url.replace(LINK_VARIABLE_REGEX, (match, name) => {
    const value = variables[name.toLowerCase()];

    return value === undefined ? match : encodeURIComponent(value);
  });
}
