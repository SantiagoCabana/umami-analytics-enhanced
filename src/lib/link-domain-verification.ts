import { lookup } from 'node:dns/promises';
import https from 'node:https';
import ipaddr from 'ipaddr.js';

const VERIFICATION_PATH = '/q/_umami-domain-verification';
const TIMEOUT = 5000;
const MAX_RESPONSE_SIZE = 1024;

export function isPublicLinkDomainAddress(address: string) {
  return ipaddr.isValid(address) && ipaddr.parse(address).range() === 'unicast';
}

async function requestVerification(hostname: string, address: string) {
  return new Promise<boolean>(resolve => {
    const request = https.get(
      {
        hostname: address,
        servername: hostname,
        path: VERIFICATION_PATH,
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
            resolve(JSON.parse(body).hostname === hostname);
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

    for (const { address } of addresses) {
      if (isPublicLinkDomainAddress(address) && (await requestVerification(hostname, address))) {
        return true;
      }
    }
  } catch {
    // A domain without public DNS or a valid TLS endpoint remains unverified.
  }

  return false;
}
