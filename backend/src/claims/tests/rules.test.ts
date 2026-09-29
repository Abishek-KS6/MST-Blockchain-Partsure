import { WarrantyRules, ClaimContext } from '../rules';
import { Part, Org, Event, Document } from '@prisma/client';

// Mock Data Factory
const createMockCtx = (overrides: Partial<ClaimContext> = {}): ClaimContext => {
  const now = new Date();
  return {
    part: {
      id: 'part-1',
      partId: 'HP47291',
      partNumber: 'PN-1',
      batchId: 'B1',
      manufacturerOrgId: 'org-1',
      currentOwnerOrgId: 'org-2',
      installedMachine: 'M1',
      status: 'active' as any,
      warrantyUntil: new Date(now.getTime() + 86400000 * 30), // +30 days
      chainTxHash: '0x123',
    } as any,
    org: {
      id: 'org-2',
      name: 'Owner Corp',
      role: 'factory' as any,
      walletAddress: '0xABC',
    } as any,
    failureDate: now,
    operatingHours: 500,
    events: [],
    documents: [],
    batchParts: [],
    ...overrides
  };
};

describe('Warranty Rules', () => {
  test('REGISTRATION_CHECK: should pass if part is active', () => {
    const ctx = createMockCtx();
    expect(WarrantyRules.isRegistered(ctx).passed).toBe(true);
  });

  test('OWNERSHIP_CHECK: should pass if caller is current owner', () => {
    const ctx = createMockCtx();
    expect(WarrantyRules.isOwner(ctx).passed).toBe(true);
  });

  test('OWNERSHIP_CHECK: should fail if caller is not owner', () => {
    const ctx = createMockCtx({ org: { id: 'wrong-org' } as any });
    expect(WarrantyRules.isOwner(ctx).passed).toBe(false);
    expect(WarrantyRules.isOwner(ctx).detail).toContain('not the current owner');
  });

  test('WARRANTY_VALIDITY: should pass if failure is before expiry', () => {
    const ctx = createMockCtx();
    expect(WarrantyRules.isWarrantyValid(ctx).passed).toBe(true);
  });

  test('WARRANTY_VALIDITY: should pass if failure is on the exact same day', () => {
    const expiry = new Date();
    const ctx = createMockCtx({
      failureDate: expiry,
      part: { ...createMockCtx().part, warrantyUntil: expiry }
    });
    expect(WarrantyRules.isWarrantyValid(ctx).passed).toBe(true);
  });

  test('WARRANTY_VALIDITY: should fail if expired', () => {
    const now = new Date();
    const ctx = createMockCtx({
      failureDate: now,
      part: { ...createMockCtx().part, warrantyUntil: new Date(now.getTime() - 1000) }
    });
    expect(WarrantyRules.isWarrantyValid(ctx).passed).toBe(false);
    expect(WarrantyRules.isWarrantyValid(ctx).detail).toBe('Warranty expired');
  });

  test('SERVICE_HISTORY: should pass if hours < 1000', () => {
    const ctx = createMockCtx({ operatingHours: 500, events: [] });
    expect(WarrantyRules.serviceIntervalsFollowed(ctx).passed).toBe(true);
  });

  test('SERVICE_HISTORY: should fail if hours > 1000 and no service record', () => {
    const ctx = createMockCtx({ operatingHours: 1500, events: [] });
    expect(WarrantyRules.serviceIntervalsFollowed(ctx).passed).toBe(false);
    expect(WarrantyRules.serviceIntervalsFollowed(ctx).detail).toContain('Missing required service record');
  });

  test('SERVICE_HISTORY: should pass if hours > 1000 but service exists', () => {
    const ctx = createMockCtx({
      operatingHours: 1500,
      events: [{ eventType: 'service' } as any]
    });
    expect(WarrantyRules.serviceIntervalsFollowed(ctx).passed).toBe(true);
  });

  test('SUSPECT_FLAG_CHECK: should fail if flagged', () => {
    const ctx = createMockCtx({ events: [{ eventType: 'flag_suspect' } as any] });
    expect(WarrantyRules.noSuspectFlags(ctx).passed).toBe(false);
  });

  test('BATCH_RELIABILITY: should fail if other parts in batch failed', () => {
    const ctx = createMockCtx({
      batchParts: [
        { status: 'active' } as any,
        { status: 'failed' } as any
      ]
    });
    expect(WarrantyRules.noBatchFailures(ctx).passed).toBe(false);
    expect(WarrantyRules.noBatchFailures(ctx).detail).toContain('Batch-wide failure pattern');
  });
});
