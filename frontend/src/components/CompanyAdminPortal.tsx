'use client';

import React, { useState } from 'react';
import { Part, Org, Claim, api } from '@/lib/api';

interface CompanyAdminPortalProps {
  parts: Part[];
  orgs: Org[];
  claims: Claim[];
  onPartUpdated: () => void;
  onOpenQRScanner: () => void;
  notify: (msg: string) => void;
}

export default function CompanyAdminPortal({
  parts,
  orgs,
  claims,
  onPartUpdated,
  onOpenQRScanner,
  notify,
}: CompanyAdminPortalProps) {
  // Identify the enterprise custodian company
  const enterpriseOrg = orgs.find(o => o.role === 'factory' || o.role === 'service' || o.name.toLowerCase().includes('aero') || o.name.toLowerCase().includes('fleet')) || orgs[1] || orgs[0];

  // Company Admin sub-tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'commissioning' | 'telemetry' | 'claims'>('inventory');

  // Selected component for commissioning or maintenance
  const [selectedPart, setSelectedPart] = useState<Part>(parts[0] || null);

  // Commissioning state
  const [targetMachine, setTargetMachine] = useState('');
  const [isCommissioning, setIsCommissioning] = useState(false);

  // Quick service log state
  const [serviceNotes, setServiceNotes] = useState('');
  const [isLoggingService, setIsLoggingService] = useState(false);

  // Claim state
  const [claimDescription, setClaimDescription] = useState('');
  const [claimHours, setClaimHours] = useState(4820);
  const [isFilingClaim, setIsFilingClaim] = useState(false);

  // Parts currently owned/held by this company
  const ownedParts = parts.filter(p => p.currentOwnerOrgId === enterpriseOrg?.id || parts.length <= 6);
  const companyClaims = claims.filter(c => ownedParts.some(p => p.id === c.partId));

  const handleCommissionMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !targetMachine.trim()) {
      notify('Please specify the machine / aircraft identifier');
      return;
    }

    setIsCommissioning(true);
    try {
      await api.updatePart(selectedPart.partId, {
        installedMachine: targetMachine.trim(),
        actorOrgId: enterpriseOrg?.id,
        note: `Component commissioned into ${targetMachine.trim()} by Company Fleet Admin`,
      });
      notify(`✓ ${selectedPart.partId} commissioned into ${targetMachine.trim()}`);
      setTargetMachine('');
      onPartUpdated();
    } catch (err: any) {
      notify(err.message || 'Commissioning update failed');
    } finally {
      setIsCommissioning(false);
    }
  };

  const handleLogMaintenance = async () => {
    if (!selectedPart) return;
    setIsLoggingService(true);
    try {
      await api.createEvent({
        partId: selectedPart.id,
        eventType: 'service',
        actorOrgId: enterpriseOrg?.id,
        payload: {
          action: 'SCHEDULED_MAINTENANCE_OVERHAUL',
          notes: serviceNotes || 'Routine 500-hour inspection and lubrication completed',
          inspector: `${enterpriseOrg?.name} Line Maintenance Dept`,
        },
      });
      notify(`✓ Maintenance service block logged for ${selectedPart.partId}`);
      setServiceNotes('');
      onPartUpdated();
    } catch (err: any) {
      notify(err.message || 'Failed to log service');
    } finally {
      setIsLoggingService(false);
    }
  };

  const handleFileWarrantyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || !claimDescription.trim()) {
      notify('Please provide a description of the defect or failure');
      return;
    }

    setIsFilingClaim(true);
    try {
      await api.fileClaim({
        partId: selectedPart.partId,
        orgId: enterpriseOrg?.id,
        failureDate: new Date().toISOString(),
        operatingHours: claimHours,
        docHash: '0x' + Math.random().toString(16).slice(2, 66),
      });
      notify(`⚠ Formal warranty dispute filed for ${selectedPart.partId}`);
      setClaimDescription('');
      onPartUpdated();
      setActiveTab('claims');
    } catch (err: any) {
      notify(err.message || 'Failed to file warranty claim');
    } finally {
      setIsFilingClaim(false);
    }
  };

  return (
    <div className="company-portal-container">
      {/* Company Top Banner */}
      <div className="company-top-banner">
        <div className="company-branding">
          <div className="company-badge-icon">ENTERPRISE</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2>{enterpriseOrg?.name || 'AeroFleet Dynamics Corp'}</h2>
              <span className="cage-code-badge">OPERATOR ID: OP-8810</span>
              <span className="cert-status-badge">FAA PART 145 / EASA 145</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              CUSTODIAN FLEET ADMINISTRATION // DOCKSIDE QR RECEIVING, COMMISSIONING & WARRANTY DISPUTES
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-technical btn-technical-primary"
            onClick={onOpenQRScanner}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>⚲</span> Dockside QR Scanner
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="company-kpi-banner">
        <div className="company-kpi-card">
          <div className="kpi-label">OWNED PRECISION ASSETS</div>
          <div className="kpi-val" style={{ color: 'var(--text-pure)' }}>{ownedParts.length} UNITS</div>
        </div>
        <div className="company-kpi-card">
          <div className="kpi-label">ACTIVE IN-SERVICE UNITS</div>
          <div className="kpi-val" style={{ color: 'var(--accent-emerald)' }}>
            {ownedParts.filter(p => p.installedMachine && !p.installedMachine.includes('Staged')).length} ACTIVE
          </div>
        </div>
        <div className="company-kpi-card">
          <div className="kpi-label">UNSCHEDULED DEFECTS</div>
          <div className="kpi-val" style={{ color: 'var(--accent-rose)' }}>
            {ownedParts.filter(p => p.status === 'failed').length} ANOMALIES
          </div>
        </div>
        <div className="company-kpi-card">
          <div className="kpi-label">OPEN WARRANTY CLAIMS</div>
          <div className="kpi-val" style={{ color: 'var(--accent-amber)' }}>{companyClaims.length} ACTIVE</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="supplier-subnav-bar">
        <button
          className={`supplier-subnav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Company Asset Fleet Inventory
        </button>
        <button
          className={`supplier-subnav-btn ${activeTab === 'commissioning' ? 'active' : ''}`}
          onClick={() => setActiveTab('commissioning')}
        >
          Machine & Aircraft Commissioning
        </button>
        <button
          className={`supplier-subnav-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveTab('telemetry')}
        >
          Operating Telemetry & Maintenance
        </button>
        <button
          className={`supplier-subnav-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Warranty Dispute Filing
        </button>
      </div>

      {/* ── SUB-TAB 1: Company Asset Fleet Inventory ── */}
      {activeTab === 'inventory' && (
        <div className="fleet-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-pure)' }}>
              CUSTODY INVENTORY RECORD // VERIFIED ON MST LEDGER
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {ownedParts.length} REGISTERED ASSETS
            </span>
          </div>

          <table className="fleet-table">
            <thead>
              <tr>
                <th>PART ID</th>
                <th>PART NUMBER</th>
                <th>INSTALLED MACHINE / AIRCRAFT</th>
                <th>BATCH LOT</th>
                <th>MANUFACTURING OEM</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {ownedParts.map(p => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-pure)' }}>
                      {p.partId}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {p.partNumber}
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>
                    {p.installedMachine || 'Staged in Receiving Cleanroom'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {p.batchId}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {p.manufacturer?.name}
                  </td>
                  <td>
                    <span className={`stage-badge ${p.status}`}>{p.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn-technical"
                      style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                      onClick={() => {
                        setSelectedPart(p);
                        setActiveTab('commissioning');
                      }}
                    >
                      Commission →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUB-TAB 2: Machine & Aircraft Commissioning ── */}
      {activeTab === 'commissioning' && (
        <div className="supplier-single-card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="supplier-card-header">
            <h3>INSTALL & COMMISSION COMPONENT INTO ACTIVE FLEET</h3>
            <span className="stage-badge active">FAA 145 LOGBOOK</span>
          </div>

          <form onSubmit={handleCommissionMachine} className="supplier-form">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                SELECT RECEIVING ASSET:
              </label>
              <select
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
                value={selectedPart?.id}
                onChange={e => {
                  const found = parts.find(p => p.id === e.target.value);
                  if (found) setSelectedPart(found);
                }}
              >
                {ownedParts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.partId} — {p.partNumber} ({p.installedMachine || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                INSTALLATION TARGET MACHINE / TAIL NUMBER / POSITION:
              </label>
              <input
                type="text"
                placeholder="e.g. Boeing 787-9 [N821AF] / Left Engine Bay Pos-1"
                value={targetMachine}
                onChange={e => setTargetMachine(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)' }}
                required
              />
            </div>

            <div style={{ padding: 14, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 20 }}>
              ℹ Commissioning assigns this serial component to active flight duty, starting its real-time operating cycle counter on the MST Provenance ledger.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                className="btn-technical btn-technical-primary"
                disabled={isCommissioning}
              >
                {isCommissioning ? 'Writing to Ledger...' : 'Commit Installation to MST Ledger →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SUB-TAB 3: Operating Telemetry & Maintenance ── */}
      {activeTab === 'telemetry' && (
        <div className="supplier-grid-layout">
          <div className="supplier-card">
            <div className="supplier-card-header">
              <h3>OPERATING CYCLE AUDIT</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                {selectedPart ? selectedPart.partId : 'Select Component'}
              </span>
            </div>

            {selectedPart && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>CURRENT ASSIGNMENT</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-pure)', marginTop: 2 }}>
                    {selectedPart.installedMachine || 'Staged in Facility'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div style={{ padding: 12, background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>LOGGED HOURS</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>4,820 hrs</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>TBO REMAINING</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>10,180 hrs</div>
                  </div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>VIBRATION HARMONIC INDEX</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--accent-cyan)', marginTop: 2 }}>0.28 mm/s [ISO 10816 CLASS A]</div>
                </div>
              </div>
            )}
          </div>

          <div className="supplier-card">
            <div className="supplier-card-header">
              <h3>LOG MAINTENANCE INSPECTION</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>
                AS9110 REPAIR STATION
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Record certified NDT re-inspections, eddy current flaw detection, or routine servicing directly to the blockchain logbook.
              </p>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  SERVICE NOTES & INSPECTOR ATTESTATION:
                </label>
                <textarea
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                  placeholder="e.g. Ultrasonic skin inspection verified zero delamination. Replaced titanium fastener ring to 45 Nm torque spec."
                  value={serviceNotes}
                  onChange={e => setServiceNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-technical btn-technical-primary"
                  onClick={handleLogMaintenance}
                  disabled={isLoggingService}
                >
                  {isLoggingService ? 'Recording Service Block...' : 'Sign Maintenance Block →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: Warranty Dispute Filing ── */}
      {activeTab === 'claims' && (
        <div className="supplier-single-card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="supplier-card-header">
            <h3>FILE WARRANTY DEFECT DISPUTE // TRIBUNAL SUBMISSION</h3>
            <span className="stage-badge failed">DISPUTE ARBITRATION</span>
          </div>

          <form onSubmit={handleFileWarrantyClaim} className="supplier-form">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                SELECT FAILING COMPONENT:
              </label>
              <select
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
                value={selectedPart?.id}
                onChange={e => {
                  const found = parts.find(p => p.id === e.target.value);
                  if (found) setSelectedPart(found);
                }}
              >
                {ownedParts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.partId} — {p.partNumber} ({p.installedMachine})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                RECORDED OPERATING FLIGHT HOURS AT ANOMALY:
              </label>
              <input
                type="number"
                value={claimHours}
                onChange={e => setClaimHours(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                FAILURE DESCRIPTION & TELEMETRY TRIGGER:
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Hydraulic pressure seal breached at 472 Bar during supersonic transition corridor. Black-box sensor records abnormal thermal spike of 1,890°C."
                value={claimDescription}
                onChange={e => setClaimDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>

            <div style={{ padding: 14, background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--accent-rose)', marginBottom: 20 }}>
              ⚠ Submission initiates automated audit by NVIDIA NIM AI Oracle and escrow freeze on the OEM's warranty reserve bond.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                className="btn-technical btn-technical-danger"
                disabled={isFilingClaim}
              >
                {isFilingClaim ? 'Filing with Tribunal...' : 'Submit Claim to Warranty Tribunal →'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
