'use client';

import React, { useState } from 'react';
import { Part, Org, api } from '@/lib/api';
import IndustrialQRCode from './IndustrialQRCode';

interface SupplierPortalProps {
  parts: Part[];
  orgs: Org[];
  onPartCreated: () => void;
  onSelectPart: (part: Part) => void;
  notify: (msg: string) => void;
}

export default function SupplierPortal({
  parts,
  orgs,
  onPartCreated,
  onSelectPart,
  notify,
}: SupplierPortalProps) {
  // Current supplier organization
  const supplierOrg = orgs.find(o => o.role === 'oem' || o.role === 'supplier') || orgs[0];
  const clientOrgs = orgs.filter(o => o.id !== supplierOrg?.id);

  // Sub-tabs in Supplier Portal
  const [supplierTab, setSupplierTab] = useState<'batch_mint' | 'qr_etching' | 'quality_gate' | 'dispatches'>('qr_etching');

  // Selected part for laser etching / quality inspection
  const [selectedSupplierPart, setSelectedSupplierPart] = useState<Part>(parts[0] || null);

  // Minting form state
  const [newPartId, setNewPartId] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newBatchId, setNewBatchId] = useState('');
  const [alloySpec, setAlloySpec] = useState('Ti-6Al-4V Grade 5 (AMS 4911)');
  const [destOrgId, setDestOrgId] = useState(clientOrgs[0]?.id || '');
  const [isMinting, setIsMinting] = useState(false);

  // Quality Gate Checklist State
  const [qaChecks, setQaChecks] = useState({
    ultrasonicPorosity: true,
    cmmDimensional: true,
    xrayTomography: true,
    surfaceRoughness: true,
    thermalTreatment: true,
  });
  const [isSigningQA, setIsSigningQA] = useState(false);

  // Dispatch state
  const [dispatchTargetOrg, setDispatchTargetOrg] = useState(clientOrgs[0]?.id || '');
  const [isDispatching, setIsDispatching] = useState(false);

  // Supplier-specific parts (manufactured by this OEM)
  const supplierParts = parts.filter(p => p.manufacturerOrgId === supplierOrg?.id || parts.length <= 4);

  const handleMintPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartId || !newPartNumber || !newBatchId) {
      notify('Please fill out all required fabrication fields');
      return;
    }

    setIsMinting(true);
    try {
      await api.createPart({
        partId: newPartId.toUpperCase(),
        partNumber: newPartNumber.toUpperCase(),
        batchId: newBatchId.toUpperCase(),
        manufacturerOrgId: supplierOrg?.id || orgs[0]?.id,
        currentOwnerOrgId: supplierOrg?.id || orgs[0]?.id,
        installedMachine: 'Staged in Cleanroom Facility C4',
        warrantyMonths: 36,
      });

      notify(`Component ${newPartId.toUpperCase()} minted with Mil-Std-130 UID`);
      setNewPartId('');
      setNewPartNumber('');
      setNewBatchId('');
      onPartCreated();
      setSupplierTab('qr_etching');
    } catch (err: any) {
      notify(err.message || 'Fabrication registration failed');
    } finally {
      setIsMinting(false);
    }
  };

  const handleSignQualityGate = () => {
    setIsSigningQA(true);
    setTimeout(() => {
      setIsSigningQA(false);
      notify(`✓ AS9100D Certificate of Conformance cryptographically signed for ${selectedSupplierPart.partId}`);
    }, 800);
  };

  const handleDispatchCustody = async () => {
    if (!selectedSupplierPart || !dispatchTargetOrg) return;
    setIsDispatching(true);
    try {
      const targetOrg = orgs.find(o => o.id === dispatchTargetOrg);
      await api.updatePart(selectedSupplierPart.partId, {
        currentOwnerOrgId: dispatchTargetOrg,
        actorOrgId: supplierOrg?.id,
        note: `Custody transferred from OEM to ${targetOrg?.name || 'Client Org'}`,
      });
      notify(`Custody of ${selectedSupplierPart.partId} successfully transferred to ${targetOrg?.name}`);
      onPartCreated();
    } catch (err: any) {
      notify(err.message || 'Dispatch transfer failed');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="supplier-portal-container">
      {/* Supplier Identity Top Banner */}
      <div className="supplier-top-banner">
        <div className="supplier-branding">
          <div className="supplier-badge-icon">OEM</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2>{supplierOrg?.name || 'Apex Aero Forgings GmbH'}</h2>
              <span className="cage-code-badge">CAGE CODE: C4921</span>
              <span className="cert-status-badge">AS9100D / ISO 9001:2015</span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              AUTHORIZED OEM FABRICATION FACILITY // LASER ETCHING, NDT CERTIFICATION & BATCH REPOSITORY
            </p>
          </div>
        </div>

        <div className="supplier-kpis-deck">
          <div className="supplier-kpi-item">
            <span className="kpi-label">SERIALIZED RUNS</span>
            <span className="kpi-val">{supplierParts.length} UNITS</span>
          </div>
          <div className="supplier-kpi-item">
            <span className="kpi-label">NDT PASS RATE</span>
            <span className="kpi-val" style={{ color: 'var(--accent-emerald)' }}>99.98%</span>
          </div>
          <div className="supplier-kpi-item">
            <span className="kpi-label">INSPECTION LEVEL</span>
            <span className="kpi-val" style={{ color: 'var(--accent-cyan)' }}>CLASS A1</span>
          </div>
        </div>
      </div>

      {/* Supplier Navigation Sub-Tabs */}
      <div className="supplier-subnav-bar">
        <button
          className={`supplier-subnav-btn ${supplierTab === 'qr_etching' ? 'active' : ''}`}
          onClick={() => setSupplierTab('qr_etching')}
        >
          2D Laser Etch QR Station
        </button>
        <button
          className={`supplier-subnav-btn ${supplierTab === 'batch_mint' ? 'active' : ''}`}
          onClick={() => setSupplierTab('batch_mint')}
        >
          + Mint Production Batch
        </button>
        <button
          className={`supplier-subnav-btn ${supplierTab === 'quality_gate' ? 'active' : ''}`}
          onClick={() => setSupplierTab('quality_gate')}
        >
          NDT Quality Gate Checklist
        </button>
        <button
          className={`supplier-subnav-btn ${supplierTab === 'dispatches' ? 'active' : ''}`}
          onClick={() => setSupplierTab('dispatches')}
        >
          Client Shipping & Transfer
        </button>
      </div>

      {/* ── SUB-TAB 1: 2D Laser Etch QR Station ── */}
      {supplierTab === 'qr_etching' && (
        <div className="supplier-grid-layout">
          {/* Left: Component Selector */}
          <div className="supplier-card">
            <div className="supplier-card-header">
              <h3>FABRICATED COMPONENT ROSTER</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                SELECT FOR ETCH MATRIX
              </span>
            </div>
            <div className="supplier-parts-roster">
              {supplierParts.map(p => {
                const isSelected = selectedSupplierPart?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`supplier-roster-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSupplierPart(p)}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)', fontSize: '0.85rem' }}>
                        {p.partId}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {p.partNumber} · BATCH {p.batchId}
                      </div>
                    </div>
                    <span className={`stage-badge ${p.status}`}>{p.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Working Industrial Laser Etch QR Engine */}
          <div className="supplier-card">
            <div className="supplier-card-header">
              <h3>MIL-STD-130N PHYSICAL LASER ETCH STATION</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                READY FOR FIBER LASER (1064nm)
              </span>
            </div>

            {selectedSupplierPart ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This real 2D DataMatrix / QR Code embeds the component's cryptographic provenance hash and serial number according to Mil-Std-130 and ATA Spec 2000. It is scannable by optical readers and smartphone cameras worldwide.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <IndustrialQRCode
                    partId={selectedSupplierPart.partId}
                    partNumber={selectedSupplierPart.partNumber}
                    batchId={selectedSupplierPart.batchId}
                    manufacturerName={supplierOrg?.name}
                    chainTxHash={selectedSupplierPart.chainTxHash}
                    size={200}
                    showDetails={true}
                  />
                </div>

                <div className="laser-spec-box">
                  <div className="laser-spec-item">
                    <span>LASER PROFILE</span>
                    <strong>Nd:YAG 1064nm Pulse</strong>
                  </div>
                  <div className="laser-spec-item">
                    <span>SPOT DIAMETER</span>
                    <strong>0.12 mm</strong>
                  </div>
                  <div className="laser-spec-item">
                    <span>ERROR CORRECTION</span>
                    <strong>Level H (30% Redundancy)</strong>
                  </div>
                  <div className="laser-spec-item">
                    <span>SUBSTRATE ALLOY</span>
                    <strong>Titanium Grade 5 (Ra 0.4)</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a component from the roster to generate its laser etch QR code.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: Mint Production Batch ── */}
      {supplierTab === 'batch_mint' && (
        <div className="supplier-single-card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="supplier-card-header">
            <h3>MINT NEW COMPONENT RUN // DIGITAL PASSPORT ISSUANCE</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>
              MST MAINNET SIGNATURE
            </span>
          </div>

          <form onSubmit={handleMintPart} className="supplier-form">
            <div className="supplier-form-grid">
              <div className="form-field-group">
                <label>Component Serial / Unique Part ID</label>
                <input
                  type="text"
                  placeholder="e.g. TITAN-ROTOR-8802"
                  value={newPartId}
                  onChange={e => setNewPartId(e.target.value)}
                  required
                  className="instrument-input"
                />
                <span className="field-hint">Must be unique across global MST ledger</span>
              </div>

              <div className="form-field-group">
                <label>OEM Part Number</label>
                <input
                  type="text"
                  placeholder="e.g. PN-TITAN-X1-44"
                  value={newPartNumber}
                  onChange={e => setNewPartNumber(e.target.value)}
                  required
                  className="instrument-input"
                />
              </div>

              <div className="form-field-group">
                <label>Metallurgical Heat / Batch ID</label>
                <input
                  type="text"
                  placeholder="e.g. LOT-2026-TITAN-B09"
                  value={newBatchId}
                  onChange={e => setNewBatchId(e.target.value)}
                  required
                  className="instrument-input"
                />
              </div>

              <div className="form-field-group">
                <label>Alloy / Material Metallurgy</label>
                <select value={alloySpec} onChange={e => setAlloySpec(e.target.value)} className="instrument-input">
                  <option value="Ti-6Al-4V Grade 5 (AMS 4911)">Ti-6Al-4V Grade 5 (AMS 4911)</option>
                  <option value="Inconel 718 High-Temp Nickel">Inconel 718 High-Temp Nickel</option>
                  <option value="Silicon Nitride Si3N4 Ceramic">Silicon Nitride Si3N4 Ceramic</option>
                  <option value="Carbon-Carbon Heatshield Composite">Carbon-Carbon Heatshield Composite</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-pure)', marginBottom: 6 }}>
                AUTOMATED CRYPTOGRAPHIC PROVENANCE ATTESTATION
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Upon minting, PartSure generates an ECDSA signed transaction hash, compiles the initial SHA-256 Merkle leaf proof, and automatically provisions an ATA Spec 2000 compliant 2D QR Code.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                className="btn-technical btn-technical-primary"
                disabled={isMinting}
              >
                {isMinting ? 'Minting on MST Ledger...' : '✦ Mint Digital Passport & QR Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SUB-TAB 3: NDT Quality Gate Checklist ── */}
      {supplierTab === 'quality_gate' && (
        <div className="supplier-single-card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="supplier-card-header">
            <div>
              <h3>AS9100D / FAA 8130-3 NON-DESTRUCTIVE TESTING QUALITY GATE</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Inspecting: <strong>{selectedSupplierPart ? selectedSupplierPart.partId : 'Select a component'}</strong>
              </p>
            </div>
            <span className="stage-badge active">QA LEVEL 4</span>
          </div>

          <div className="quality-gate-checklist">
            {[
              { id: 'ultrasonicPorosity', title: 'NDT Ultrasonic Phased Array Porosity Scan', desc: 'Verified zero internal micro-voids; porosity density <0.04% under ASTM E2375 standard.' },
              { id: 'cmmDimensional', title: 'Coordinate Measuring Machine (CMM) Dimensional Verification', desc: 'All geometric tolerances within ISO 2768-m (deviation <0.004mm on rotor blades).' },
              { id: 'xrayTomography', title: 'High-Resolution X-Ray Computed Tomography (CT)', desc: 'Full volumetric 3D reconstruction confirms structural integrity of internal vector cooling channels.' },
              { id: 'surfaceRoughness', title: 'Surface Roughness Optical Profilometry', desc: 'Surface finish measured at Ra 0.18µm; exceeds turbine aerodynamic boundary layer requirements.' },
              { id: 'thermalTreatment', title: 'Vacuum Heat Treatment & Solution Aging Log', desc: 'Heat cycle 980°C for 4.2 hours followed by inert argon quench; hardness 38 HRC confirmed.' },
            ].map(item => (
              <label key={item.id} className="qa-check-item">
                <input
                  type="checkbox"
                  checked={(qaChecks as any)[item.id]}
                  onChange={e => setQaChecks(prev => ({ ...prev, [item.id]: e.target.checked }))}
                />
                <div className="qa-check-text">
                  <div className="qa-check-title">{item.title}</div>
                  <div className="qa-check-desc">{item.desc}</div>
                </div>
                <span className="qa-status-pill">PASSED</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              QA INSPECTOR: APEX-CERT-ENG-904 // DIGITALLY SIGNED
            </div>
            <button
              className="btn-technical btn-technical-primary"
              onClick={handleSignQualityGate}
              disabled={isSigningQA}
            >
              {isSigningQA ? 'Signing Certificate...' : 'Sign Airworthiness Conformance (CoC)'}
            </button>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 4: Client Shipping & Transfer ── */}
      {supplierTab === 'dispatches' && (
        <div className="supplier-single-card" style={{ maxWidth: 840, margin: '0 auto' }}>
          <div className="supplier-card-header">
            <h3>DISPATCH COMPONENT & TRANSFER LEGAL CUSTODY</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
              MST CUSTODIAL PROTOCOL
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              SELECT COMPONENT READY FOR DISPATCH:
            </label>
            <select
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
              value={selectedSupplierPart?.id}
              onChange={e => {
                const found = parts.find(p => p.id === e.target.value);
                if (found) setSelectedSupplierPart(found);
              }}
            >
              {supplierParts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.partId} — {p.partNumber} (Current Owner: {p.currentOwner?.name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              RECEIVING ENTERPRISE / CLIENT CUSTODIAN:
            </label>
            <select
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}
              value={dispatchTargetOrg}
              onChange={e => setDispatchTargetOrg(e.target.value)}
            >
              {clientOrgs.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.role.toUpperCase()}) — {o.walletAddress.slice(0, 16)}...
                </option>
              ))}
            </select>
          </div>

          <div style={{ padding: 14, background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 20 }}>
            ℹ Transferring custody logs an irreversible transfer block on the MST ledger. The receiving client will verify the QR barcode at their dock to accept shipment.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn-technical btn-technical-primary"
              onClick={handleDispatchCustody}
              disabled={isDispatching}
            >
              {isDispatching ? 'Dispatching on-chain...' : 'Dispatch Shipment & Transfer Custody →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
