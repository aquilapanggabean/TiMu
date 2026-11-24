/**
 * Shared in-memory workspace store for Vercel Serverless Functions.
 * NOTE: Vercel serverless functions are stateless — each cold start resets state.
 * This is intentional for a demo/prototype; production would use a real DB.
 */
import crypto from 'node:crypto';
import { createInitialSeedWorkspace, type WorkspaceState } from '../server/seedData';
import { buildBlindTalentCard, calculateDistanceKm, calculateTimezoneOverlapHours } from '../src/lib/domain';
import type { VerifiableCertificate } from '../src/types/timu';

// Session-isolated workspaces keyed by session header
const workspaces = new Map<string, WorkspaceState>();
const publicCertificatesIndex = new Map<string, VerifiableCertificate>();

export function getWorkspace(sessionKey: string): WorkspaceState {
  const safeKey = sessionKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'demo_default';
  let ws = workspaces.get(safeKey);
  if (!ws) {
    ws = createInitialSeedWorkspace(safeKey === 'demo_default' ? 'demo_user_1' : safeKey);
    workspaces.set(safeKey, ws);
    for (const cert of ws.certificates) {
      publicCertificatesIndex.set(cert.verificationCode, cert);
    }
  }
  return ws;
}

export function indexCertificate(cert: VerifiableCertificate) {
  publicCertificatesIndex.set(cert.verificationCode, cert);
}

export function findCertificate(code: string): VerifiableCertificate | undefined {
  return publicCertificatesIndex.get(code.trim().toUpperCase());
}

export function resolveSessionKey(req: { headers: Record<string, string | string[] | undefined> }): string {
  const hdr = req.headers['x-timu-session'];
  if (typeof hdr === 'string' && hdr.trim()) return hdr.trim();
  return 'demo_default';
}

export function buildBlindCards(ws: WorkspaceState) {
  return ws.candidates.map((cand) => {
    const isUnlocked = ws.unlockedTalentIds.includes(cand.publicProfile.userId);
    const conv = ws.conversations.find(
      (c) => c.talentId === cand.publicProfile.userId && c.employerId === ws.profile.id
    );
    return buildBlindTalentCard({
      talent: cand.publicProfile,
      identity: cand.identity,
      isUnlocked,
      distanceKm: calculateDistanceKm(ws.profile.lat, ws.profile.lng, cand.publicProfile.lat, cand.publicProfile.lng),
      timezoneOverlapHours: calculateTimezoneOverlapHours(ws.employerProfile.timezone, cand.publicProfile.timezone),
      conversationId: conv?.id,
    });
  });
}

export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

// Seed default workspace so public cert verification works on cold start
getWorkspace('demo_default');
