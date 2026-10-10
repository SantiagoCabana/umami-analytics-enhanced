import { lookup } from 'node:dns/promises';
import https from 'node:https';
import ipaddr from 'ipaddr.js';
import { secret } from '@/lib/crypto';
import { createToken, parseToken } from '@/lib/jwt';
import { getRequestLinkDomain } from '@/lib/link-domains';

const VERIFICATION_PATH = '/q/_umami-domain-verification';
const TIMEOUT = 5000;
const MAX_RESPONSE_SIZE = 1024;
const VERIFICATION_TYPE = 'link-domain-verification';

export function isPublicLinkDomainAddress(address: string) {
  return ipaddr.isValid(address) && ipaddr.parse(address).range() === 'unicast';
}

export function getLinkDomainVerificationHostname(request: Request) {
  const hostname = getRequestLinkDomain(request);
  const challenge = new URL(request.url).searchParams.get('challenge');
  const payload = challenge ? parseToken(challenge, secret()) : null;

  if (
    !hostname ||
    !payload ||
    typeof payload === 'string' ||
    payload.type !== VERIFICATION_TYPE ||
    payload.hostname !== hostname
  ) {
    return null;
  }

  return hostname;
}

function createLinkDomainVerificationChallenge(hostname: string) {
  return createToken({ type: VERIFICATION_TYPE, hostname }, secret(), { expiresIn: '5m' });
}

async function requestVerification(hostname: string, address: string, challenge: string) {
  return new Promise<boolean>(resolve => {
    const request = https.get(
      {
        hostname: address,
        servername: hostname,
        path: `${VERIFICATION_PATH}?challenge=${encodeURIComponent(challenge)}`,
        headers: { host: hostname },
        timeout: TIMEOUT,
      },
      response => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;

          if (body.length > MAX_RESPONSE_SIZE) {
            request.destroy();
          }
        });
        response.on('end', () => {
          if (response.statusCode !== 200) {
            resolve(false);
            return;
          }

          try {
            const result = JSON.parse(body);
            resolve(result.hostname === hostname && result.challenge === challenge);
          } catch {
            resolve(false);
          }
        });
      },
    );

    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

export async function verifyLinkDomain(hostname: string) {
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    const challenge = createLinkDomainVerificationChallenge(hostname);

    for (const { address } of addresses) {
      if (
        isPublicLinkDomainAddress(address) &&
        (await requestVerification(hostname, address, challenge))
      ) {
        return true;
      }
    }
  } catch {
    // A domain without public DNS or a valid TLS endpoint remains unverified.
  }

  return false;
}
