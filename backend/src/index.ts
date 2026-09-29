import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { WarrantyRules, ClaimContext } from './claims/rules.js';
import { generateEvidencePacket } from './claims/evidence.js';
import { ChainBridge } from './chain/bridge.js';
import { ethers } from 'ethers';

const prisma = new PrismaClient();
const bridge = new ChainBridge();
const fastify = Fastify({ logger: true });

fastify.register(cors);

const ClaimRequestSchema = z.object({
  partId: z.string(),
  orgId: z.string(),
  failureDate: z.string(),
  operatingHours: z.number(),
  docHash: z.string(),
});

fastify.get('/', async () => ({
  name: 'PartSure AI',
  version: '1.0.0',
  status: 'running',
}));

// ── Dashboard Stats ──
fastify.get('/stats', async () => {
  const [partCount, claimCount, orgCount, eventCount] = await Promise.all([
    prisma.part.count(),
    prisma.claim.count(),
    prisma.org.count(),
    prisma.event.count(),
  ]);
  const openClaims = await prisma.claim.count({ where: { status: 'open' } });
  const acceptedClaims = await prisma.claim.count({ where: { status: 'accepted' } });
  const rejectedClaims = await prisma.claim.count({ where: { status: 'rejected' } });
  return { partCount, claimCount, orgCount, eventCount, openClaims, acceptedClaims, rejectedClaims };
});

// ── Parts ──
fastify.get('/parts', async () => {
  return prisma.part.findMany({
    include: { manufacturer: true, currentOwner: true, _count: { select: { events: true, claims: true } } },
    orderBy: { partId: 'asc' },
  });
});

fastify.get('/parts/:partId', async (request, reply) => {
  const { partId } = request.params as any;
  const part = await prisma.part.findUnique({
    where: { partId },
    include: {
      manufacturer: true,
      currentOwner: true,
      events: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
      documents: { include: { uploadedBy: true } },
      claims: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!part) return reply.status(404).send({ error: 'Part not found' });
  return part;
});

fastify.post('/parts', async (request, reply) => {
  const schema = z.object({
    partId: z.string().min(2),
    partNumber: z.string().min(2),
    batchId: z.string().min(2),
    manufacturerOrgId: z.string(),
    currentOwnerOrgId: z.string(),
    installedMachine: z.string().optional().nullable(),
    warrantyMonths: z.number().default(24),
  });

  const body = schema.parse(request.body);
  const existing = await prisma.part.findUnique({ where: { partId: body.partId } });
  if (existing) {
    return reply.status(400).send({ error: `Part with ID ${body.partId} already exists` });
  }

  const cryptoHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const warrantyUntil = new Date(Date.now() + body.warrantyMonths * 30 * 24 * 60 * 60 * 1000);

  const part = await prisma.part.create({
    data: {
      partId: body.partId,
      partNumber: body.partNumber,
      batchId: body.batchId,
      manufacturerOrgId: body.manufacturerOrgId,
      currentOwnerOrgId: body.currentOwnerOrgId,
      installedMachine: body.installedMachine,
      status: 'active',
      warrantyUntil,
      chainTxHash: cryptoHash,
    },
    include: { manufacturer: true, currentOwner: true },
  });

  // Automatically record initial minting register event
  await prisma.event.create({
    data: {
      partId: part.id,
      eventType: 'register',
      actorOrgId: body.manufacturerOrgId,
      payload: {
        action: 'DIGITAL_PASSPORT_MINTED_VIA_COMMAND_HUD',
        batchId: body.batchId,
        machine: body.installedMachine,
        warrantyPeriodMonths: body.warrantyMonths,
      },
      txHash: cryptoHash,
      blockNumber: Math.floor(18450000 + Math.random() * 50000),
    },
  });

  return part;
});

fastify.patch('/parts/:partId', async (request, reply) => {
  const { partId } = request.params as any;
  const schema = z.object({
    currentOwnerOrgId: z.string().optional(),
    installedMachine: z.string().optional().nullable(),
    status: z.enum(['active', 'failed', 'retired']).optional(),
    actorOrgId: z.string().optional(),
    note: z.string().optional(),
  });

  const body = schema.parse(request.body);
  const part = await prisma.part.findUnique({ where: { partId } });
  if (!part) return reply.status(404).send({ error: 'Part not found' });

  const updateData: any = {};
  if (body.currentOwnerOrgId !== undefined) updateData.currentOwnerOrgId = body.currentOwnerOrgId;
  if (body.installedMachine !== undefined) updateData.installedMachine = body.installedMachine;
  if (body.status !== undefined) updateData.status = body.status;

  const updated = await prisma.part.update({
    where: { partId },
    data: updateData,
    include: { manufacturer: true, currentOwner: true },
  });

  // Automatically log lifecycle event
  const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  let eventType: 'transfer' | 'install' | 'service' | 'flag_suspect' = 'service';
  if (body.currentOwnerOrgId && body.currentOwnerOrgId !== part.currentOwnerOrgId) {
    eventType = 'transfer';
  } else if (body.installedMachine && body.installedMachine !== part.installedMachine) {
    eventType = 'install';
  }

  await prisma.event.create({
    data: {
      partId: part.id,
      eventType,
      actorOrgId: body.actorOrgId || body.currentOwnerOrgId || part.currentOwnerOrgId,
      payload: {
        action: eventType === 'transfer' ? 'CUSTODY_TRANSFER_ACKNOWLEDGED' : 'COMMISSIONING_UPDATE',
        prevOwner: part.currentOwnerOrgId,
        newOwner: body.currentOwnerOrgId,
        installedMachine: body.installedMachine,
        status: body.status,
        note: body.note || 'Updated via enterprise console',
      },
      txHash,
      blockNumber: Math.floor(18450000 + Math.random() * 50000),
    },
  });

  return updated;
});

// ── Events (recent) ──
fastify.post('/events', async (request, reply) => {
  const schema = z.object({
    partId: z.string(),
    eventType: z.enum(['register', 'transfer', 'install', 'service', 'claim', 'resolve', 'flag_suspect']),
    actorOrgId: z.string(),
    payload: z.record(z.any()),
  });

  const body = schema.parse(request.body);
  const part = await prisma.part.findUnique({ where: { id: body.partId } }) ||
               await prisma.part.findUnique({ where: { partId: body.partId } });
  if (!part) return reply.status(404).send({ error: 'Part not found' });

  const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const event = await prisma.event.create({
    data: {
      partId: part.id,
      eventType: body.eventType,
      actorOrgId: body.actorOrgId,
      payload: body.payload,
      txHash,
      blockNumber: Math.floor(18450000 + Math.random() * 50000),
    },
    include: { actor: true, part: true },
  });

  return event;
});

// ── Claims ──
fastify.get('/claims', async () => {
  return prisma.claim.findMany({
    include: { part: true, decidedBy: true },
    orderBy: { createdAt: 'desc' },
  });
});

fastify.get('/claims/:id', async (request, reply) => {
  const { id } = request.params as any;
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: { part: { include: { manufacturer: true, currentOwner: true } }, decidedBy: true },
  });
  if (!claim) return reply.status(404).send({ error: 'Claim not found' });
  return claim;
});

// ── Orgs ──
fastify.get('/orgs', async () => {
  return prisma.org.findMany({ orderBy: { name: 'asc' } });
});

// ── Events (recent) ──
fastify.get('/events', async () => {
  return prisma.event.findMany({
    include: { part: true, actor: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
});

fastify.post('/claims', async (request, reply) => {
  const { partId, orgId, failureDate, operatingHours, docHash } = ClaimRequestSchema.parse(request.body);

  // 1. Fetch Context
  const part = await prisma.part.findUnique({ where: { partId } });
  if (!part) return reply.status(404).send({ error: 'Part not found' });

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) return reply.status(404).send({ error: 'Org not found' });

  const events = await prisma.event.findMany({ where: { partId: part.id } });
  const documents = await prisma.document.findMany({ where: { partId: part.id } });
  const batchParts = await prisma.part.findMany({ where: { batchId: part.batchId } });

  const ctx: ClaimContext = {
    part,
    org,
    failureDate: new Date(failureDate),
    operatingHours,
    events,
    documents,
    batchParts,
  };

  // 2. Run Deterministic Rules
  const ruleResults = Object.values(WarrantyRules).map(ruleFn => (ruleFn as any)(ctx));

  // 3. Generate AI Evidence Packet
  const packet = await generateEvidencePacket(ctx, ruleResults);

  // 4. Store Claim in Postgres
  const claim = await prisma.claim.create({
    data: {
      partId: part.id,
      status: 'open',
      failureDescription: 'Automatic claim generated via AI evidence packet',
      ruleResults: ruleResults as any,
      evidence: packet as any,
    }
  });

  // 5. Trigger on-chain event
  try {
    const partIdHash = ethers.id(partId);
    await bridge.fileClaim(partIdHash, docHash);
  } catch (e: any) {
    fastify.log.error({ err: e }, 'On-chain claim failed');
  }

  return { claimId: claim.id, outcome: packet.recommendedOutcome, packet };
});

fastify.post('/claims/:id/resolve', async (request, reply) => {
  const { id } = request.params as any;
  const { accepted, docHash } = z.object({
    accepted: z.boolean(),
    docHash: z.string(),
  }).parse(request.body);

  // Arbiter check (simplified for demo, in prod check session role)
  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) return reply.status(404).send({ error: 'Claim not found' });

  // Update Postgres
  await prisma.claim.update({
    where: { id },
    data: { status: accepted ? 'accepted' : 'rejected' }
  });

  // On-chain resolution
  const part = await prisma.part.findUnique({ where: { id: claim.partId } });
  const partIdHash = ethers.id(part!.partId);
  await bridge.resolveClaim(partIdHash, accepted, docHash);

  return { status: 'resolved' };
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Backend listening on port 3000');
});
