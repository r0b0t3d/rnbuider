import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJWT(serviceAccount: any): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const data = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return `${data}.${base64url(sign.sign(serviceAccount.private_key))}`;
}

function httpsRequest(
  url: string,
  method: 'GET' | 'POST',
  headers: Record<string, string>,
  body?: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const { hostname, pathname, search } = new URL(url);
    const req = https.request(
      {
        hostname,
        path: pathname + search,
        method,
        headers: body
          ? { ...headers, 'Content-Length': Buffer.byteLength(body) }
          : headers,
      },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve(raw);
          }
        });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function pollOperation(
  operationName: string,
  accessToken: string,
): Promise<string> {
  const url = `https://firebase.googleapis.com/v1beta1/${operationName}`;
  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const op = await httpsRequest(url, 'GET', {
      Authorization: `Bearer ${accessToken}`,
    });
    if (op.done) {
      if (op.error)
        throw new Error(
          `Firebase app creation failed: ${JSON.stringify(op.error)}`,
        );
      return op.response.appId;
    }
  }
  throw new Error('Firebase app creation timed out after 60s');
}

export function getProjectId(serviceAccountPath: string): string {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  return sa.project_id;
}

export async function getAccessToken(
  serviceAccountPath: string,
): Promise<string> {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  const jwt = createJWT(sa);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  }).toString();
  const result = await httpsRequest(
    'https://oauth2.googleapis.com/token',
    'POST',
    { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  );
  if (!result.access_token)
    throw new Error(`Auth failed: ${JSON.stringify(result)}`);
  return result.access_token;
}

async function findExistingAppId({
  accessToken,
  projectId,
  platform,
  bundleId,
  packageName,
}: {
  accessToken: string;
  projectId: string;
  platform: 'ios' | 'android';
  bundleId?: string;
  packageName?: string;
}): Promise<string | undefined> {
  const endpoint = platform === 'ios' ? 'iosApps' : 'androidApps';
  const result = await httpsRequest(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/${endpoint}`,
    'GET',
    { Authorization: `Bearer ${accessToken}` },
  );
  const apps = result.apps || [];
  const match =
    platform === 'ios'
      ? apps.find((app: any) => app.bundleId === bundleId)
      : apps.find((app: any) => app.packageName === packageName);
  return match?.appId;
}

export async function createFirebaseApp({
  accessToken,
  projectId,
  platform,
  bundleId,
  packageName,
  displayName,
}: {
  accessToken: string;
  projectId: string;
  platform: 'ios' | 'android';
  bundleId?: string;
  packageName?: string;
  displayName: string;
}): Promise<string> {
  const endpoint = platform === 'ios' ? 'iosApps' : 'androidApps';
  const payload =
    platform === 'ios'
      ? { bundleId, displayName }
      : { packageName, displayName };

  const result = await httpsRequest(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/${endpoint}`,
    'POST',
    {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    JSON.stringify(payload),
  );

  if (result.error) {
    if (result.error.status === 'ALREADY_EXISTS') {
      const existingAppId = await findExistingAppId({
        accessToken,
        projectId,
        platform,
        bundleId,
        packageName,
      });
      if (existingAppId) return existingAppId;
    }
    throw new Error(`Firebase API error: ${JSON.stringify(result.error)}`);
  }
  if (result.done) return result.response.appId;
  if (result.name) return pollOperation(result.name, accessToken);

  throw new Error(`Unexpected response: ${JSON.stringify(result)}`);
}
