/**
 * Header values that must never leave the device, as a deliberate copy of the web SDK's
 * `redactHeaders` (`apps/sdk/src/shared/services/redactHeaders.ts` and the `redactedNetworkHeaders`
 * list in the `invariant` package).
 *
 * It is a copy because this package cannot import from the dashboard repository, and the two have
 * to agree: a replay shows web and mobile requests side by side, and a header the web SDK hides
 * must not be readable because the request came from a phone. Keep them in step.
 */

/** Names that are a secret whatever they contain. */
const REDACTED_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'apikey',
  'x-auth-token',
  'x-csrf-token',
  'x-xsrf-token',
]);

/**
 * Values that look like credentials whatever the header is called: `Bearer …`, `Basic …` and
 * similar, or a JWT. This catches a custom header like `x-acme-token`. Hiding a harmless value by
 * mistake is fine; missing a token is not.
 */
const AUTH_SCHEME =
  /^(?:bearer|basic|digest|negotiate|ntlm|aws4-hmac-sha256)\s+\S/i;
const JWT = /^eyJ[\w-]+\.[\w-]+\.[\w-]*$/;

export const REDACTED_VALUE = 'redacted';

export const isRedactedHeader = (name: string, value: string): boolean =>
  REDACTED_NAMES.has(name.toLowerCase()) ||
  AUTH_SCHEME.test(value) ||
  JWT.test(value);

/** All headers with lower-case names and secrets replaced. The header itself is always kept. */
export const redactHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  const recorded: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    recorded[name.toLowerCase()] = isRedactedHeader(name, value)
      ? REDACTED_VALUE
      : value;
  }

  return recorded;
};
