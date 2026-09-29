import { Part, Org, Event, Document } from '@prisma/client';

export interface RuleResult {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface ClaimContext {
  part: Part;
  org: Org;
  failureDate: Date;
  operatingHours: number;
  events: Event[];
  documents: Document[];
  batchParts: Part[];
}

export const WarrantyRules = {
  isRegistered: (ctx: ClaimContext): RuleResult => {
    const passed = ctx.part.status !== ('Unregistered' as any);
    return {
      rule: 'REGISTRATION_CHECK',
      passed,
      detail: passed ? 'Part is registered' : 'Part is not registered on chain'
    };
  },

  isOwner: (ctx: ClaimContext): RuleResult => {
    const passed = ctx.part.currentOwnerOrgId === ctx.org.id;
    return {
      rule: 'OWNERSHIP_CHECK',
      passed,
      detail: passed ? 'Claimant is current owner' : 'Claimant is not the current owner'
    };
  },

  isWarrantyValid: (ctx: ClaimContext): RuleResult => {
    if (!ctx.part.warrantyUntil) {
      return { rule: 'WARRANTY_VALIDITY', passed: false, detail: 'No warranty period defined' };
    }
    const passed = ctx.failureDate <= ctx.part.warrantyUntil;
    return {
      rule: 'WARRANTY_VALIDITY',
      passed,
      detail: passed ? 'Failure occurred within warranty period' : 'Warranty expired'
    };
  },

  serviceIntervalsFollowed: (ctx: ClaimContext): RuleResult => {
    // Simple rule: Must have at least one service event if operating hours > 1000
    const hasService = ctx.events.some(e => e.eventType === 'service');
    const passed = ctx.operatingHours < 1000 || hasService;
    return {
      rule: 'SERVICE_HISTORY',
      passed,
      detail: passed ? 'Service intervals followed' : 'Missing required service record for operating hours'
    };
  },

  noSuspectFlags: (ctx: ClaimContext): RuleResult => {
    const hasFlag = ctx.events.some(e => e.eventType === 'flag_suspect');
    const passed = !hasFlag;
    return {
      rule: 'SUSPECT_FLAG_CHECK',
      passed,
      detail: passed ? 'No suspect flags raised' : 'Part was previously flagged as suspect'
    };
  },

  noBatchFailures: (ctx: ClaimContext): RuleResult => {
    const batchFailed = ctx.batchParts.some(p => p.status === 'failed');
    const passed = !batchFailed;
    return {
      rule: 'BATCH_RELIABILITY',
      passed,
      detail: passed ? 'No other failures in this batch' : 'Batch-wide failure pattern detected'
    };
  }
};
