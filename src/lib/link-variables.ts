import { isValidLinkUrl } from './link-domains';

export const LINK_VARIABLE_REGEX = /\$\{([a-z][a-z0-9_]*)\}/gi;
export const LINK_VARIABLE_NAME_REGEX = /^[a-z][a-z0-9_]{0,63}$/;
const INITIAL_VARIABLE_REGEX = /^\$\{([a-z][a-z0-9_]*)\}/i;

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
  const initialVariable = value.match(INITIAL_VARIABLE_REGEX);

  if (initialVariable) {
    // The variable supplies the complete URL. Keep the rest of the template untouched so
    // administrators can compose it with their own query-string conventions.
    return true;
  }

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
  const initialVariable = url.match(INITIAL_VARIABLE_REGEX);

  if (initialVariable) {
    const value = variables[initialVariable[1].toLowerCase()];

    if (value !== undefined) {
      return `${value}${url
        .slice(initialVariable[0].length)
        .replace(LINK_VARIABLE_REGEX, replaceLinkVariable)}`;
    }
  }

  return url.replace(LINK_VARIABLE_REGEX, replaceLinkVariable);

  function replaceLinkVariable(match: string, name: string) {
    const value = variables[name.toLowerCase()];

    return value === undefined ? match : encodeURIComponent(value);
  }
}
