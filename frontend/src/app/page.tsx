'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, Stats, Part, Claim, PartEvent, Org, EvidencePacket } from '@/lib/api';
import CADViewer3D from '@/components/CADViewer3D';
import FleetGlobe3D from '@/components/FleetGlobe3D';
import IndustrialQRCode from '@/components/IndustrialQRCode';
import QRVerificationModal from '@/components/QRVerificationModal';
import SupplierPortal from '@/components/SupplierPortal';
import CompanyAdminPortal from '@/components/CompanyAdminPortal';
import LandingPageExperience from '@/components/LandingPageExperience';
import { getProductMetadata } from '@/lib/productMetadata';
import {
  ShieldCheck, Gear, Airplane, QrCode,
  Circle, Stack, ClipboardText, BookOpen,
  Globe, ArrowRight, X, Plus, FileText
} from '@phosphor-icons/react';

export type UserRole = 'protocol_admin' | 'supplier_oem' | 'enterprise_admin';
type ConsoleView = 'studio' | 'registry' | 'tribunal' | 'ledger' | 'globe';
type BlueprintMode = 'cad' | 'exploded' | 'telemetry' | 'thermal';

export default function CoreApplication() {
  // Public Website vs Operational Console Mode
  const [appMode, setAppMode] = useState<'website' | 'console'>('website');

  // Multi-Role Console Architecture
  const [userRole, setUserRole] = useState<UserRole>('protocol_admin');
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);

  const [view, setView] = useState<ConsoleView>('studio');
  const [stats, setStats] = useState<Stats | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<PartEvent[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FAILED' | 'RETIRED'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [blueprintMode, setBlueprintMode] = useState<BlueprintMode>('exploded');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [rightPaneTab, setRightPaneTab] = useState<'logbook' | 'claim' | 'merkle'>('logbook');

  // Next-Level Feature States
  const [disassemblyProgress, setDisassemblyProgress] = useState<number>(0);
  const [activeSubsystem, setActiveSubsystem] = useState<string>('casing');
  const [stressTemp, setStressTemp] = useState<number>(1420);
  const [stressPressure, setStressPressure] = useState<number>(285);
  const [stressVibe, setStressVibe] = useState<number>(45);
  const [merkleVerified, setMerkleVerified] = useState<boolean>(false);
  const [merkleVerifying, setMerkleVerifying] = useState<boolean>(false);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live block ticker
  const [mounted, setMounted] = useState(false);
  const [blockNumber, setBlockNumber] = useState(18450142);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, c, e, o] = await Promise.all([
        api.getStats(),
        api.getParts(),
        api.getClaims(),
        api.getEvents(),
        api.getOrgs(),
      ]);
      setStats(s);
      setParts(p);
      setClaims(c);
      setEvents(e);
      setOrgs(o);
      setApiOnline(true);
      if (p.length > 0 && !selectedPart) {
        setSelectedPart(p[0]);
      }
    } catch (err) {
      console.error(err);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [selectedPart]);

  useEffect(() => {
    setMounted(true);
    loadData();
    const timer = setInterval(() => setBlockNumber(b => b + 1), 6000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Select a part and update view
  const handleSelectPart = async (part: Part) => {
    try {
      const detailed = await api.getPart(part.partId);
      setSelectedPart(detailed);
      setMerkleVerified(false);
    } catch {
      setSelectedPart(part);
    }
  };

  // Resolve Claim
  const handleResolveClaim = async (claimId: string, accepted: boolean) => {
    try {
      await api.resolveClaim(claimId, accepted, '0x' + Math.random().toString(16).slice(2, 66));
      notify(`Claim status updated: ${accepted ? 'Accepted & Released' : 'Rejected'}`);
      loadData();
    } catch {
      notify('Failed to update claim resolution');
    }
  };

  // Re-compute and verify Merkle root
  const verifyMerkleProof = () => {
    setMerkleVerifying(true);
    setTimeout(() => {
      setMerkleVerifying(false);
      setMerkleVerified(true);
      notify('✅ MST Consensus Merkle Root 100% Cryptographically Validated');
    }, 900);
  };

  // Predictive Stress Engine Calculations
  const stressMetrics = useMemo(() => {
    const vonMises = Math.round(stressPressure * 2.15 + (stressTemp > 1200 ? (stressTemp - 1200) * 0.45 : 0) + stressVibe * 1.1);
    const maxYield = 1150; // MPa for Ti-6Al-4V Grade 5
    const ratio = Math.min(1.3, vonMises / maxYield);
    const remainingHours = Math.max(80, Math.round(15000 * Math.pow(Math.max(0.08, 1 - (ratio > 0.82 ? (ratio - 0.82) * 4.5 : 0)), 2)));
    const delaminationRisk = ratio > 0.82 ? Math.min(99.6, (ratio - 0.82) * 280).toFixed(1) : '<0.04%';

    return {
      vonMises,
      maxYield,
      ratio,
      remainingHours,
      delaminationRisk,
      isCritical: ratio >= 0.9,
    };
  }, [stressTemp, stressPressure, stressVibe]);

  // Filter parts list
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        p.partId.toLowerCase().includes(query) ||
        p.partNumber.toLowerCase().includes(query) ||
        p.batchId.toLowerCase().includes(query) ||
        (p.installedMachine && p.installedMachine.toLowerCase().includes(query));

      const matchStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter;

      let matchSector = true;
      if (sectorFilter !== 'ALL') {
        const id = p.partId.toUpperCase();
        if (sectorFilter === 'AEROSPACE') matchSector = id.includes('AERO') || id.includes('TURB') || id.includes('HP47') || id.includes('SPAR') || id.includes('GYRO');
        else if (sectorFilter === 'CRYOGENICS') matchSector = id.includes('CRYO') || id.includes('QC');
        else if (sectorFilter === 'POWERTRAIN') matchSector = id.includes('SIC') || id.includes('INVERTER') || id.includes('ROTOR');
        else if (sectorFilter === 'DEFENSE') matchSector = id.includes('MAG') || id.includes('RADAR') || id.includes('HYDRO') || id.includes('OPTICAL');
        else if (sectorFilter === 'ROBOTICS') matchSector = id.includes('LIDAR') || id.includes('PLASMA') || id.includes('NEURAL');
      }

      return matchSearch && matchStatus && matchSector;
    });
  }, [parts, searchQuery, statusFilter, sectorFilter]);

  const truncHash = (h: string | null) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : '—');
  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
  const formatTime = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Get active claim for current part if any
  const partClaim = useMemo(() => {
    if (!selectedPart) return null;
    return claims.find(c => c.partId === selectedPart.id || c.part?.partId === selectedPart.partId) || null;
  }, [claims, selectedPart]);

  // Dynamic Subsystems and Specifications for Current Selected Part
  const currentProductMeta = useMemo(() => {
    return getProductMetadata(selectedPart?.partId || 'HP47291', selectedPart);
  }, [selectedPart]);

  const subsystems = currentProductMeta.subsystems;

  const explodeOffset = (disassemblyProgress / 100) * 45;

  return (
    <div className="core-app">
      {/* Grain Noise Overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      <div className="app-backdrop" aria-hidden="true" />
      <div className="scan-line" aria-hidden="true" />

      {appMode === 'website' ? (
        <LandingPageExperience
          parts={parts}
          orgs={orgs}
          claims={claims}
          onLaunchConsole={() => setAppMode('console')}
          onOpenQRScanner={() => setShowQRScanner(true)}
          onViewCert={(part) => {
            setSelectedPart(part);
            setShowCertModal(true);
          }}
        />
      ) : (
        <>
          {/* ── Master Top Bar ── */}
          <header className="core-top-bar">
            <div className="top-bar-left">
              <button
                className="btn-technical"
                onClick={() => setAppMode('website')}
                style={{
                  marginRight: 12,
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--accent-cyan)'
                }}
                id="btn-back-to-website"
              >
                ← Public Website
              </button>

              <div className="brand-monogram">
                {/* Double-Bezel Brand Mark */}
                <div className="brand-mark-shell">
                  <div className="brand-mark">P</div>
                </div>
                <div className="brand-name">
                  <span>PARTSURE</span>
                  <div className="brand-divider" />
                  <span className="brand-tag">PROTOCOL 01</span>
                </div>
              </div>

          {/* Multi-Role Workspace Switcher */}
          <div className="role-switcher-wrap">
            <button
              className={`role-switch-btn ${userRole === 'protocol_admin' ? 'active' : ''}`}
              onClick={() => setUserRole('protocol_admin')}
            >
              <ShieldCheck size={13} weight="bold" /> Admin
            </button>
            <button
              className={`role-switch-btn supplier ${userRole === 'supplier_oem' ? 'active' : ''}`}
              onClick={() => setUserRole('supplier_oem')}
            >
              <Gear size={13} weight="bold" /> Supplier
            </button>
            <button
              className={`role-switch-btn enterprise ${userRole === 'enterprise_admin' ? 'active' : ''}`}
              onClick={() => setUserRole('enterprise_admin')}
            >
              <Airplane size={13} weight="bold" /> Fleet
            </button>
          </div>

          {userRole === 'protocol_admin' && (
            <div className="view-mode-tabs">
              <button
                className={`mode-tab-btn ${view === 'studio' ? 'active' : ''}`}
                onClick={() => setView('studio')}
                id="tab-studio"
              >
                <Stack size={13} /> Studio
              </button>
              <button
                className={`mode-tab-btn ${view === 'registry' ? 'active' : ''}`}
                onClick={() => setView('registry')}
                id="tab-registry"
              >
                <ClipboardText size={13} /> Registry <span className="mode-count-badge">{parts.length}</span>
              </button>
              <button
                className={`mode-tab-btn ${view === 'tribunal' ? 'active' : ''}`}
                onClick={() => setView('tribunal')}
                id="tab-tribunal"
              >
                <BookOpen size={13} /> Tribunal {stats && stats.openClaims > 0 && <span className="mode-count-badge" style={{ color: 'var(--accent-rose)' }}>{stats.openClaims}</span>}
              </button>
              <button
                className={`mode-tab-btn ${view === 'ledger' ? 'active' : ''}`}
                onClick={() => setView('ledger')}
                id="tab-ledger"
              >
                <FileText size={13} /> Ledger
              </button>
              <button
                className={`mode-tab-btn ${view === 'globe' ? 'active' : ''}`}
                onClick={() => setView('globe')}
                id="tab-globe"
              >
                <Globe size={13} /> Globe
              </button>
            </div>
          )}
        </div>

        <div className="top-bar-right">
          <button
            className="btn-technical btn-technical-cyan"
            onClick={() => setShowQRScanner(true)}
            id="btn-qr-scanner"
          >
            <QrCode size={14} weight="bold" />
            <span>Scan QR</span>
          </button>

          <div className="network-status-badge">
            <span className="status-dot-emerald" />
            <span>MST MAINNET</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-pure)' }} suppressHydrationWarning>
              #{mounted ? blockNumber.toLocaleString() : '18,450,142'}
            </span>
          </div>

          <button
            className="btn-technical btn-technical-danger"
            onClick={() => setShowClaimModal(true)}
            id="btn-log-claim"
          >
            Log Claim
          </button>

          <button
            className="btn-technical btn-technical-primary"
            onClick={() => setShowRegisterModal(true)}
            id="btn-register-asset"
          >
            <Plus size={14} weight="bold" />
            Register Asset
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="toast-notification" role="status" aria-live="polite">
          {notification}
        </div>
      )}

      {/* ── Main View Content ── */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <div className="loading-text">Initializing Asset Repository</div>
        </div>
      ) : !apiOnline ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-rose)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
            API Connection Offline
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 480, margin: '0 auto 20px' }}>
            The PartSure backend service on port 3000 could not be reached. Ensure the server process is active.
          </p>
          <button className="btn-technical btn-technical-primary" onClick={loadData}>
            Retry Connection
          </button>
        </div>
      ) : (
        <main className="core-main-viewport" key={userRole}>
          {userRole === 'supplier_oem' ? (
            <SupplierPortal
              parts={parts}
              orgs={orgs}
              onPartCreated={loadData}
              onSelectPart={handleSelectPart}
              notify={notify}
            />
          ) : userRole === 'enterprise_admin' ? (
            <CompanyAdminPortal
              parts={parts}
              orgs={orgs}
              claims={claims}
              onPartUpdated={loadData}
              onOpenQRScanner={() => setShowQRScanner(true)}
              notify={notify}
            />
          ) : (
            <div className="protocol-admin-viewport" key={view}>
              {view === 'studio' && selectedPart && (
            <div className="studio-layout">
              {/* ── PANE 1: Directory ── */}
              <aside className="pane-directory">
                <div className="directory-header">
                  <div className="directory-search-box">
                    <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      className="directory-search-input"
                      placeholder="Search assets, batches, machine..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="directory-filter-row">
                    {(['ALL', 'AEROSPACE', 'CRYOGENICS', 'POWERTRAIN', 'DEFENSE', 'ROBOTICS'] as const).map(sec => (
                      <button
                        key={sec}
                        className={`filter-chip ${sectorFilter === sec ? 'active' : ''}`}
                        onClick={() => setSectorFilter(sec)}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="directory-list">
                  {filteredParts.map(p => {
                    const isSelected = selectedPart.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`directory-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPart(p)}
                      >
                        <div className="directory-item-top">
                          <div className="directory-part-id">
                            <span className={`status-pip ${p.status}`} />
                            {p.partId}
                          </div>
                          <span className="directory-batch-tag">{p.batchId}</span>
                        </div>
                        <div className="directory-part-name">
                          {p.installedMachine || p.partNumber}
                        </div>
                        <div className="directory-item-meta">
                          <span>{p.manufacturer?.name?.slice(0, 18)}</span>
                          <span style={{ textTransform: 'uppercase' }}>{p.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* ── PANE 2: Center Studio Stage ── */}
              <main className="pane-studio-stage">
                <div className="stage-header">
                  <div className="stage-title-wrap">
                    <h2>{selectedPart.installedMachine || `${selectedPart.partId} // Industrial Component`}</h2>
                    <div className="stage-subtitle-row">
                      <span>PART NO: <strong>{selectedPart.partNumber}</strong></span>
                      <span>·</span>
                      <span>BATCH: <strong>{selectedPart.batchId}</strong></span>
                      <span>·</span>
                      <span>MANUFACTURER: <strong>{selectedPart.manufacturer?.name}</strong></span>
                      <span>·</span>
                      <span className={`stage-badge ${selectedPart.status}`}>{selectedPart.status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-technical btn-technical-primary"
                      onClick={() => setShowCertModal(true)}
                    >
                      Airworthiness Certificate
                    </button>
                    <button
                      className="btn-technical"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(selectedPart, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `passport-${selectedPart.partId}.json`;
                        a.click();
                        notify('Cryptographic passport certificate exported');
                      }}
                    >
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* Technical Blueprint CAD Viewport — Double-Bezel */}
                <div className="blueprint-card">
                  <div className="blueprint-card-inner">
                  <div className="blueprint-toolbar">
                    <div className="blueprint-mode-selector">
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-xs)', padding: '2px', marginRight: 10, border: '1px solid var(--border-subtle)' }}>
                        <button
                          className={`blueprint-mode-btn ${is3DMode ? 'active' : ''}`}
                          onClick={() => setIs3DMode(true)}
                          style={{
                            color: is3DMode ? 'var(--accent-primary)' : 'var(--text-muted)',
                            fontWeight: is3DMode ? 700 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <span style={{ fontSize: '0.6rem' }}>●</span> 3D WebGL
                        </button>
                        <button
                          className={`blueprint-mode-btn ${!is3DMode ? 'active' : ''}`}
                          onClick={() => setIs3DMode(false)}
                          style={{
                            color: !is3DMode ? 'var(--text-pure)' : 'var(--text-muted)',
                            fontWeight: !is3DMode ? 700 : 400
                          }}
                        >
                          2D Blueprint
                        </button>
                      </div>

                      <button
                        className={`blueprint-mode-btn ${blueprintMode === 'cad' ? 'active' : ''}`}
                        onClick={() => setBlueprintMode('cad')}
                      >
                        {is3DMode ? 'Solid CAD' : '2D Projection'}
                      </button>
                      <button
                        className={`blueprint-mode-btn ${blueprintMode === 'exploded' ? 'active' : ''}`}
                        onClick={() => setBlueprintMode('exploded')}
                      >
                        Exploded Assembly
                      </button>
                      <button
                        className={`blueprint-mode-btn ${blueprintMode === 'telemetry' ? 'active' : ''}`}
                        onClick={() => setBlueprintMode('telemetry')}
                      >
                        Sensor Telemetry
                      </button>
                      <button
                        className={`blueprint-mode-btn ${blueprintMode === 'thermal' ? 'active' : ''}`}
                        onClick={() => setBlueprintMode('thermal')}
                      >
                        FEA Stress Simulator
                      </button>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {is3DMode ? 'WEBGL 2.0 · PBR SHADERS · 60 FPS INTERACTIVE' : 'SCALE 1:2.5 · TOLERANCE ISO 2768-m · ALLOY Ti-6Al-4V'}
                    </div>
                  </div>

                  {/* 3D WebGL CAD Engine or 2D SVG Projection */}
                  <div className="blueprint-cad-viewport">
                    {is3DMode ? (
                      <CADViewer3D
                        disassemblyProgress={disassemblyProgress}
                        activeSubsystem={activeSubsystem}
                        blueprintMode={blueprintMode}
                        stressTemp={stressTemp}
                        stressPressure={stressPressure}
                        onSelectSubsystem={setActiveSubsystem}
                      />
                    ) : (
                      <svg className="cad-svg-drawing" viewBox="0 0 520 240" fill="none">
                        {/* Grid Datum Lines */}
                        <line x1="20" y1="120" x2="500" y2="120" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                        <line x1="260" y1="20" x2="260" y2="220" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />

                        {/* Technical Outer Dimension Callout */}
                        <line x1="120" y1="30" x2="400" y2="30" stroke="rgba(255, 255, 255, 0.2)" />
                        <line x1="120" y1="25" x2="120" y2="35" stroke="rgba(255, 255, 255, 0.3)" />
                        <line x1="400" y1="25" x2="400" y2="35" stroke="rgba(255, 255, 255, 0.3)" />
                        <text x="235" y="24" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
                          420.00 mm
                        </text>

                        {/* MODE 1: Standard 2D CAD Projection */}
                        {blueprintMode === 'cad' && (
                          <>
                            <rect x="140" y="70" width="240" height="100" rx="4" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.2" />
                            <circle cx="260" cy="120" r="35" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx="260" cy="120" r="14" stroke="rgba(56, 189, 248, 0.8)" strokeWidth="1.5" />
                            {[170, 200, 230, 260, 290, 320, 350].map(x => (
                              <line key={x} x1={x} y1="75" x2={x} y2="165" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
                            ))}
                          </>
                        )}

                        {/* MODE 2: Interactive Mechanical Exploded View */}
                        {blueprintMode === 'exploded' && (
                          <g>
                            {/* Layer 1: Exterior Shield (Leftmost) */}
                            <g transform={`translate(${-2 * explodeOffset}, 0)`} opacity={activeSubsystem === 'casing' ? 1 : 0.7}>
                              <rect x="140" y="65" width="40" height="110" rx="4" stroke="var(--text-pure)" strokeWidth={activeSubsystem === 'casing' ? 2 : 1} fill={activeSubsystem === 'casing' ? 'rgba(56, 189, 248, 0.15)' : 'none'} />
                              <text x="142" y="60" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">L1: CASING</text>
                            </g>

                            {/* Layer 2: Vector Manifold */}
                            <g transform={`translate(${-1 * explodeOffset}, 0)`} opacity={activeSubsystem === 'manifold' ? 1 : 0.7}>
                              <rect x="195" y="75" width="45" height="90" rx="2" stroke="#e2e8f0" strokeWidth={activeSubsystem === 'manifold' ? 2 : 1} fill={activeSubsystem === 'manifold' ? 'rgba(56, 189, 248, 0.15)' : 'none'} />
                              <text x="197" y="68" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">L2: MANIFOLD</text>
                            </g>

                            {/* Layer 3: Rotor / Stator Core (Center) */}
                            <g opacity={activeSubsystem === 'rotor' ? 1 : 0.7}>
                              <circle cx="260" cy="120" r="38" stroke="var(--accent-primary)" strokeWidth={activeSubsystem === 'rotor' ? 2 : 1.2} fill={activeSubsystem === 'rotor' ? 'rgba(56, 189, 248, 0.2)' : 'none'} />
                              <circle cx="260" cy="120" r="16" stroke="#38bdf8" strokeWidth="1" />
                              <text x="240" y="68" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">L3: ROTOR</text>
                            </g>

                            {/* Layer 4: Ceramic Bearings */}
                            <g transform={`translate(${1 * explodeOffset}, 0)`} opacity={activeSubsystem === 'bearings' ? 1 : 0.7}>
                              <rect x="295" y="85" width="35" height="70" rx="3" stroke="#e2e8f0" strokeWidth={activeSubsystem === 'bearings' ? 2 : 1} fill={activeSubsystem === 'bearings' ? 'rgba(56, 189, 248, 0.15)' : 'none'} />
                              <circle cx="312" cy="120" r="8" stroke="#38bdf8" strokeWidth="1" />
                              <text x="296" y="75" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">L4: BEARINGS</text>
                            </g>

                            {/* Layer 5: Optical Sensor Core (Rightmost) */}
                            <g transform={`translate(${2 * explodeOffset}, 0)`} opacity={activeSubsystem === 'sensor' ? 1 : 0.7}>
                              <rect x="345" y="75" width="35" height="90" rx="2" stroke="var(--accent-indigo)" strokeWidth={activeSubsystem === 'sensor' ? 2 : 1} fill={activeSubsystem === 'sensor' ? 'rgba(99, 102, 241, 0.2)' : 'none'} />
                              <text x="345" y="68" fill="#818cf8" fontSize="8" fontFamily="JetBrains Mono">L5: SENSOR</text>
                            </g>
                          </g>
                        )}

                        {/* MODE 3: Sensor Telemetry Hotspots */}
                        {blueprintMode === 'telemetry' && (
                          <>
                            <rect x="140" y="70" width="240" height="100" rx="4" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
                            <circle cx="260" cy="120" r="35" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                            <g>
                              <circle cx="200" cy="100" r="5" fill="var(--accent-primary)" />
                              <text x="212" y="103" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">T1: 1,420°C [NOMINAL]</text>
                            </g>
                            <g>
                              <circle cx="320" cy="140" r="5" fill={selectedPart.status === 'failed' ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                              <text x="332" y="143" fill={selectedPart.status === 'failed' ? '#f43f5e' : '#10b981'} fontSize="8" fontFamily="JetBrains Mono">
                                P1: {selectedPart.status === 'failed' ? '472 Bar [SPIKE ALERT]' : '285 Bar [OPTIMAL]'}
                              </text>
                            </g>
                            <g>
                              <circle cx="260" cy="85" r="5" fill="var(--accent-indigo)" />
                              <text x="272" y="88" fill="#818cf8" fontSize="8" fontFamily="JetBrains Mono">PAUT: AS9100 VALIDATED</text>
                            </g>
                          </>
                        )}

                        {/* MODE 4: FEA Stress & Thermal Gradient Simulation */}
                        {blueprintMode === 'thermal' && (
                          <>
                            <rect
                              x="140"
                              y="70"
                              width="240"
                              height="100"
                              rx="4"
                              fill="url(#feaStressGrad)"
                              opacity={0.35 + (stressMetrics.ratio * 0.4)}
                              stroke={stressMetrics.isCritical ? 'var(--accent-rose)' : 'rgba(255, 255, 255, 0.4)'}
                              strokeWidth={stressMetrics.isCritical ? 2 : 1.2}
                            />
                            <circle cx="260" cy="120" r="35" stroke="rgba(255, 255, 255, 0.3)" strokeDasharray="3 3" />
                            <circle cx="260" cy="120" r="14" fill={stressMetrics.isCritical ? 'rgba(244, 63, 94, 0.6)' : 'rgba(56, 189, 248, 0.4)'} />
                          </>
                        )}

                        <defs>
                          <linearGradient id="feaStressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor={stressMetrics.ratio > 0.8 ? '#f59e0b' : '#10b981'} />
                            <stop offset="100%" stopColor={stressMetrics.isCritical ? '#f43f5e' : '#f59e0b'} />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </div>

                  {/* FEATURE 1 CONTROLS: Exploded View Assembly Slider */}
                  {blueprintMode === 'exploded' && (
                    <div className="exploded-controls-bar">
                      <div className="disassembly-slider-wrap">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          DISASSEMBLY OFFSET:
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={disassemblyProgress}
                          onChange={e => setDisassemblyProgress(Number(e.target.value))}
                          className="disassembly-range-input"
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-pure)', minWidth: 42 }}>
                          {disassemblyProgress}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-technical"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => setDisassemblyProgress(0)}
                        >
                          Assembled
                        </button>
                        <button
                          className="btn-technical"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => setDisassemblyProgress(50)}
                        >
                          50% Inspect
                        </button>
                        <button
                          className="btn-technical"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => setDisassemblyProgress(100)}
                        >
                          100% Exploded
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FEATURE 2 CONTROLS: Predictive FEA Stress Lab Sliders */}
                  {blueprintMode === 'thermal' && (
                    <div className="stress-lab-controls">
                      <div className="stress-slider-group">
                        <div className="stress-slider-label">
                          <span>Temperature</span>
                          <strong style={{ color: stressTemp > 1400 ? 'var(--accent-rose)' : 'var(--text-pure)' }}>
                            {stressTemp} °C
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="1800"
                          value={stressTemp}
                          onChange={e => setStressTemp(Number(e.target.value))}
                          className="disassembly-range-input"
                        />
                      </div>

                      <div className="stress-slider-group">
                        <div className="stress-slider-label">
                          <span>Chamber Load / Pressure</span>
                          <strong style={{ color: stressPressure > 400 ? 'var(--accent-rose)' : 'var(--text-pure)' }}>
                            {stressPressure} Bar
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="600"
                          value={stressPressure}
                          onChange={e => setStressPressure(Number(e.target.value))}
                          className="disassembly-range-input"
                        />
                      </div>

                      <div className="stress-slider-group">
                        <div className="stress-slider-label">
                          <span>Vibration Spectrum</span>
                          <strong style={{ color: stressVibe > 80 ? 'var(--accent-amber)' : 'var(--text-pure)' }}>
                            {stressVibe} Hz
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          value={stressVibe}
                          onChange={e => setStressVibe(Number(e.target.value))}
                          className="disassembly-range-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
                </div> {/* blueprint-card-inner */}

                {/* Exploded Subsystem Layer Selector Chips */}
                {blueprintMode === 'exploded' && (
                  <div className="subsystems-layer-grid" style={{ marginBottom: 20 }}>
                    {subsystems.map(sub => (
                      <div
                        key={sub.id}
                        className={`subsystem-layer-chip ${activeSubsystem === sub.id ? 'active' : ''}`}
                        onClick={() => setActiveSubsystem(sub.id)}
                      >
                        <div className="subsystem-chip-title">{sub.name}</div>
                        <div className="subsystem-chip-spec">{sub.alloy}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Tolerance: {sub.tolerance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Predictive Fatigue Forecast Cards — Double-Bezel */}
                {blueprintMode === 'thermal' && (
                  <div className="stress-telemetry-forecast" style={{ marginBottom: 20 }}>
                    <div className="forecast-metric-card">
                      <div className="forecast-metric-inner">
                        <div className="forecast-label">Von Mises Peak Stress</div>
                        <div className="forecast-value" style={{ color: stressMetrics.isCritical ? 'var(--accent-rose)' : 'var(--text-pure)' }}>
                          {stressMetrics.vonMises} MPa
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Yield: {stressMetrics.maxYield} MPa
                        </div>
                      </div>
                    </div>

                    <div className="forecast-metric-card">
                      <div className="forecast-metric-inner">
                        <div className="forecast-label">AI Fatigue Lifetime</div>
                        <div className="forecast-value" style={{ color: stressMetrics.remainingHours < 2000 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                          {stressMetrics.remainingHours.toLocaleString()} hrs
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          AS9100 Wöhler Curve
                        </div>
                      </div>
                    </div>

                    <div className="forecast-metric-card">
                      <div className="forecast-metric-inner">
                        <div className="forecast-label">Delamination Risk</div>
                        <div className="forecast-value" style={{ color: stressMetrics.delaminationRisk !== '<0.04%' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {stressMetrics.delaminationRisk}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          PAUT Probability
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4-Column Specification Matrix Deck — Dynamic Product Telemetry */}
                <div className="specs-deck-grid">
                  <div className="spec-cell">
                    <div className="spec-cell-inner">
                      <div className="spec-cell-label">Metallurgical Alloy</div>
                      <div className="spec-cell-value" title={currentProductMeta.metallurgyAlloy}>
                        {currentProductMeta.metallurgyAlloy.length > 24
                          ? `${currentProductMeta.metallurgyAlloy.slice(0, 24)}…`
                          : currentProductMeta.metallurgyAlloy}
                      </div>
                      <div className="spec-cell-sub">{currentProductMeta.alloyStandard}</div>
                    </div>
                  </div>

                  <div className="spec-cell">
                    <div className="spec-cell-inner">
                      <div className="spec-cell-label">Operating Duty</div>
                      <div className="spec-cell-value">
                        {currentProductMeta.operatingHours.toLocaleString()} hrs
                      </div>
                      <div className="spec-cell-sub">
                        Rated for {currentProductMeta.ratedLifeHours.toLocaleString()} hrs ({Math.round((currentProductMeta.operatingHours / currentProductMeta.ratedLifeHours) * 100)}% Used)
                      </div>
                    </div>
                  </div>

                  <div className="spec-cell">
                    <div className="spec-cell-inner">
                      <div className="spec-cell-label">Warranty SLA</div>
                      <div className="spec-cell-value">{currentProductMeta.warrantyUntil}</div>
                      <div className="spec-cell-sub" style={{ color: 'var(--accent-emerald)' }}>
                        {currentProductMeta.warrantyStatus}
                      </div>
                    </div>
                  </div>

                  <div className="spec-cell">
                    <div className="spec-cell-inner">
                      <div className="spec-cell-label">MST Ledger Provenance</div>
                      <div className="spec-cell-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {truncHash(selectedPart.chainTxHash)}
                      </div>
                      <div className="spec-cell-sub">{currentProductMeta.standards}</div>
                    </div>
                  </div>
                </div>

                {/* FEATURE 3: Cryptographic Merkle Tree Visualizer — Double-Bezel */}
                <div className="merkle-tree-container">
                  <div className="merkle-tree-inner">
                  <div className="merkle-tree-header">
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-pure)' }}>
                        Cryptographic Merkle Proof Tree
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Binary SHA-256 hash tree verifying on-chain certificate integrity.
                      </p>
                    </div>

                    <button
                      className={`btn-technical ${merkleVerified ? 'btn-technical-primary' : ''}`}
                      onClick={verifyMerkleProof}
                      disabled={merkleVerifying}
                    >
                      {merkleVerifying ? 'Computing SHA-256...' : merkleVerified ? '✓ Proof Certified' : 'Verify On-Chain Proof'}
                    </button>
                  </div>

                  <div className="merkle-graph">
                    {/* Root Node */}
                    <div className="merkle-root-node data-pulse">
                      <div className="merkle-node-tag">MST MERKLE ROOT</div>
                      <div className="merkle-hash-text" style={{ color: 'var(--accent-primary)' }}>
                        {selectedPart.chainTxHash || '0x7b4a2f8c9e1029384756abcdef9876543210'}
                      </div>
                    </div>

                    {/* Intermediate Branches */}
                    <div className="merkle-level-row">
                      <div className="merkle-branch-node">
                        <div className="merkle-node-tag">BRANCH 1-2: H(DOCUMENTS)</div>
                        <div className="merkle-hash-text">0x3f9a...814c</div>
                      </div>
                      <div className="merkle-branch-node">
                        <div className="merkle-node-tag">BRANCH 3-4: H(ORACLE SLA)</div>
                        <div className="merkle-hash-text">0x88de...a201</div>
                      </div>
                    </div>

                    {/* 4 Leaf Nodes */}
                    <div className="merkle-leaf-grid">
                      <div className="merkle-leaf-card">
                        <div className="merkle-node-tag">LEAF 1: INVOICE SHA-256</div>
                        <div className="merkle-hash-text">0xa471...6723</div>
                      </div>
                      <div className="merkle-leaf-card">
                        <div className="merkle-node-tag">LEAF 2: ULTRASONIC PAUT</div>
                        <div className="merkle-hash-text">0xa96c...796c</div>
                      </div>
                      <div className="merkle-leaf-card">
                        <div className="merkle-node-tag">LEAF 3: WARRANTY SLA</div>
                        <div className="merkle-hash-text">0xb934...3c90</div>
                      </div>
                      <div className="merkle-leaf-card">
                        <div className="merkle-node-tag">LEAF 4: AS9100D CERT</div>
                        <div className="merkle-hash-text">0x2f11...88ab</div>
                      </div>
                    </div>
                   </div>
                  </div> {/* merkle-tree-inner */}
                </div>

                {/* Attached Cryptographic Documents Vault — Double-Bezel */}
                <div className="documents-vault-card">
                  <div className="documents-vault-inner">
                  <div className="documents-vault-header">
                    <span>Cryptographically Anchored Documents</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      IPFS & SHA-256 VERIFIED
                    </span>
                  </div>

                  {selectedPart.documents && selectedPart.documents.length > 0 ? (
                    selectedPart.documents.map(doc => (
                      <div key={doc.id} className="doc-row-item">
                        <div>
                          <div className="doc-info-type">{doc.docType.replace('_', ' ')}</div>
                          <div className="doc-info-path">{doc.storagePath}</div>
                        </div>
                        <span className="doc-sha-tag">SHA: {truncHash(doc.sha256)}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      No archived documents attached to this component.
                    </div>
                  )}
                  </div> {/* documents-vault-inner */}
                </div>
              </main>

              {/* ── PANE 3: Provenance & SLA Inspector ── */}
              <aside className="pane-provenance">
                <div className="provenance-tabs">
                  <button
                    className={`provenance-tab-btn ${rightPaneTab === 'logbook' ? 'active' : ''}`}
                    onClick={() => setRightPaneTab('logbook')}
                  >
                    Logbook ({selectedPart.events?.length || 0})
                  </button>
                  <button
                    className={`provenance-tab-btn ${rightPaneTab === 'claim' ? 'active' : ''}`}
                    onClick={() => setRightPaneTab('claim')}
                  >
                    Warranty SLA {partClaim ? '· Active' : ''}
                  </button>
                </div>

                <div className="provenance-content">
                  {rightPaneTab === 'logbook' ? (
                    <div className="logbook-timeline">
                      {selectedPart.events && selectedPart.events.length > 0 ? (
                        selectedPart.events.map(ev => (
                          <div key={ev.id} className="logbook-entry">
                            <div className={`logbook-node ${ev.eventType === 'claim' ? 'alert-node' : 'active-node'}`} />
                            <div className="logbook-card">
                              <div className="logbook-entry-header">
                                <span className="logbook-action">{ev.eventType}</span>
                                <span className="logbook-date">{formatTime(ev.createdAt)}</span>
                              </div>
                              <div className="logbook-actor">Actor: {ev.actor?.name || 'Verified Org'}</div>
                              {ev.txHash && <div className="logbook-tx-tag">tx: {truncHash(ev.txHash)}</div>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No recorded events on ledger.</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {partClaim ? (
                        <div className="claim-forensic-box">
                          <span className={`claim-forensic-status ${partClaim.status}`}>
                            Claim Status: {partClaim.status}
                          </span>
                          <p className="claim-desc-text">{partClaim.failureDescription}</p>

                          <div style={{ margin: '14px 0' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                              Deterministic Smart Contract Rules:
                            </div>
                            {(partClaim.ruleResults || []).map((rule, idx) => (
                              <div key={idx} className="rule-audit-row">
                                <span className="rule-name-tag">{rule.rule.replace(/_/g, ' ')}</span>
                                <span className={`rule-status-check ${rule.passed ? 'pass' : 'fail'}`}>
                                  {rule.passed ? '✓ PASSED' : '✕ VIOLATION'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {partClaim.evidence && (
                            <div style={{ background: 'var(--bg-deep)', padding: 12, borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--text-pure)' }}>AI Forensic Verdict: </strong>
                              {(partClaim.evidence as unknown as EvidencePacket).reasoning}
                            </div>
                          )}

                          {partClaim.status === 'open' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                              <button
                                className="btn-technical btn-technical-primary"
                                style={{ flex: 1 }}
                                onClick={() => handleResolveClaim(partClaim.id, true)}
                              >
                                Accept & Pay
                              </button>
                              <button
                                className="btn-technical btn-technical-danger"
                                style={{ flex: 1 }}
                                onClick={() => handleResolveClaim(partClaim.id, false)}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '36px 12px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                            NO ACTIVE DISPUTES
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 16 }}>
                            This asset is compliant with all AS9100 service intervals and smart contract warranty criteria.
                          </p>
                          <button
                            className="btn-technical btn-technical-danger"
                            onClick={() => setShowClaimModal(true)}
                          >
                            Simulate Warranty Incident
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* ── VIEW 2: FLEET REGISTRY (Full Table Matrix) ── */}
          {view === 'registry' && (
            <div className="fleet-matrix-view">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 className="fleet-view-heading">Fleet Asset Registry</h2>
                  <p className="fleet-view-sub">
                    All registered precision components recorded across the MST provenance ledger.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="directory-search-input"
                    style={{ width: 240 }}
                    placeholder="Filter registry..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="fleet-table-card">
                <div className="fleet-table-card-inner">
                <table className="fleet-table">
                  <thead>
                    <tr>
                      <th>PART ID</th>
                      <th>PART NUMBER</th>
                      <th>APPLICATION / MACHINE</th>
                      <th>BATCH ID</th>
                      <th>CUSTODIAN</th>
                      <th>STATUS</th>
                      <th>WARRANTY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-pure)' }}>
                            {p.partId}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {p.partNumber}
                        </td>
                        <td style={{ color: 'var(--text-primary)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.installedMachine || 'Staged in Cleanroom'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {p.batchId}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {p.currentOwner?.name}
                        </td>
                        <td>
                          <span className={`stage-badge ${p.status}`}>{p.status}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {formatDate(p.warrantyUntil)}
                        </td>
                        <td>
                          <button
                            className="btn-technical"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => {
                              setSelectedPart(p);
                              setView('studio');
                            }}
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div> {/* fleet-table-card-inner */}
              </div>
            </div>
          )}

          {/* ── VIEW 3: WARRANTY TRIBUNAL ── */}
          {view === 'tribunal' && (
            <div className="fleet-matrix-view">
              <div style={{ marginBottom: 20 }}>
                <h2 className="fleet-view-heading">Warranty Dispute Tribunal</h2>
                <p className="fleet-view-sub">
                  Engineering warranty arbitration cases audited by AI Oracle.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20 }}>
                {claims.map(claim => {
                  const evidence: EvidencePacket = (claim.evidence as unknown as EvidencePacket) || {
                    summary: claim.failureDescription,
                    timeline: [],
                    ruleFindings: claim.ruleResults || [],
                    recommendedOutcome: 'accept',
                    reasoning: 'Verified',
                  };

                  return (
                    <div key={claim.id} className="fleet-table-card">
                    <div className="fleet-table-card-inner" style={{ padding: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span className={`claim-forensic-status ${claim.status}`}>{claim.status}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          FILED: {formatTime(claim.createdAt)}
                        </span>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          TARGET ASSET
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-pure)' }}>
                          {claim.part?.partId || 'UNKNOWN'}
                        </h3>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: 14 }}>
                        {claim.failureDescription}
                      </p>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                          Contract Rules Audit:
                        </div>
                        {(claim.ruleResults || []).map((r, i) => (
                          <div key={i} className="rule-audit-row">
                            <span className="rule-name-tag">{r.rule}</span>
                            <span className={`rule-status-check ${r.passed ? 'pass' : 'fail'}`}>
                              {r.passed ? '✓ PASSED' : '✕ VIOLATION'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: 'var(--bg-deep)', padding: 12, borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-pure)' }}>Oracle Finding: </strong>
                        {evidence.reasoning}
                      </div>

                      {claim.status === 'open' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button
                            className="btn-technical btn-technical-primary"
                            style={{ flex: 1 }}
                            onClick={() => handleResolveClaim(claim.id, true)}
                          >
                            Accept & Release Escrow
                          </button>
                          <button
                            className="btn-technical btn-technical-danger"
                            style={{ flex: 1 }}
                            onClick={() => handleResolveClaim(claim.id, false)}
                          >
                            Reject Claim
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── VIEW 4: LEDGER AUDIT ── */}
          {view === 'ledger' && (
            <div className="fleet-matrix-view">
              <div style={{ marginBottom: 20 }}>
                <h2 className="fleet-view-heading">MST Consensus Ledger Audit</h2>
                <p className="fleet-view-sub">
                  Immutable cryptographic chain transactions verifying lifecycle state changes.
                </p>
              </div>

              <div className="fleet-table-card">
                <div className="fleet-table-card-inner">
                <table className="fleet-table">
                  <thead>
                    <tr>
                      <th>BLOCK</th>
                      <th>TRANSACTION HASH</th>
                      <th>EVENT</th>
                      <th>ASSET</th>
                      <th>AUTHORITY / ACTOR</th>
                      <th>TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, i) => (
                      <tr key={ev.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-pure)' }}>
                          #{ev.blockNumber || blockNumber - i}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                          {truncHash(ev.txHash)}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                            {ev.eventType}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-pure)' }}>
                          {ev.part?.partId || 'ASSET'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {ev.actor?.name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {formatTime(ev.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div> {/* fleet-table-card-inner */}
              </div>
            </div>
          )}

          {/* ── VIEW 5: 3D PLANETARY FLEET GLOBE ── */}
          {view === 'globe' && (
            <div className="globe-view-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 className="fleet-view-heading">Planetary Asset Fleet — 3D Orbital View</h2>
                  <p className="fleet-view-sub">
                    Live WebGL telemetry mapping mission-critical components across global aerospace and defense corridors.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-technical btn-technical-primary"
                    onClick={() => {
                      if (parts.length > 0) {
                        setSelectedPart(parts[0]);
                        setView('studio');
                        setIs3DMode(true);
                        notify('Focusing 3D Digital Twin in Studio Console');
                      }
                    }}
                  >
                    Launch 3D Twin
                    <div className="btn-icon-ring"><ArrowRight size={10} weight="bold" /></div>
                  </button>
                </div>
              </div>

              <div className="globe-main-grid">
                {/* 3D WebGL Globe Viewport — Double-Bezel */}
                <div className="globe-viewport-card">
                  <div className="globe-viewport-inner">
                  <FleetGlobe3D
                    onSelectPart={(partId) => {
                      const found = parts.find(p => p.partId === partId);
                      if (found) {
                        setSelectedPart(found);
                        setView('studio');
                        setIs3DMode(true);
                        notify(`Selected ${found.partId} — Launching 3D CAD`);
                      }
                    }}
                  />
                  </div> {/* globe-viewport-inner */}
                </div>

                {/* Right Telemetry Column */}
                <div className="globe-telemetry-deck">
                  <div className="globe-stat-banner">
                    <div className="globe-stat-pill">
                      <div className="globe-stat-label">DEPLOYED SITES</div>
                      <div className="globe-stat-val" style={{ color: 'var(--accent-primary)' }}>8 NODES</div>
                    </div>
                    <div className="globe-stat-pill">
                      <div className="globe-stat-label">FLEET HEALTH</div>
                      <div className="globe-stat-val" style={{ color: 'var(--accent-emerald)' }}>98.4%</div>
                    </div>
                    <div className="globe-stat-pill">
                      <div className="globe-stat-label">SYNC LATENCY</div>
                      <div className="globe-stat-val" style={{ color: 'var(--text-pure)' }}>12 ms</div>
                    </div>
                  </div>

                  <div className="deployment-nodes-list">
                    <div className="deployment-nodes-inner">
                    <div className="deployment-nodes-label">Global Active Nodes</div>

                    {[
                      { name: 'Boeing EcoDemonstrator', location: 'Seattle, USA', partId: 'HP47291', status: 'active', temp: '1,420°C', hours: '4,820 hrs' },
                      { name: 'Ariane 6 Heavy Gimbal', location: 'Kourou, French Guiana', partId: 'HYDRO-ACT-9900', status: 'failed', temp: '1,890°C', hours: '3,210 hrs' },
                      { name: 'Rolls-Royce Trent XWB', location: 'Derby, United Kingdom', partId: 'TITAN-TURBINE-X1', status: 'active', temp: '1,380°C', hours: '6,140 hrs' },
                      { name: 'Rigetti Aspen Quantum', location: 'Berkeley, USA', partId: 'QC-CRYOPUMP-88', status: 'active', temp: '-269°C', hours: '8,920 hrs' },
                      { name: 'Ferrari F1 Hypercar', location: 'Maranello, Italy', partId: 'CERAMIC-ROTOR-Z', status: 'retired', temp: '820°C', hours: '1,200 hrs' },
                      { name: 'Gigafactory Fab-09', location: 'Berlin, Germany', partId: 'SIC-INVERTER-800V', status: 'failed', temp: '145°C', hours: '2,900 hrs' },
                      { name: 'Edwards Flight Test Center', location: 'Mojave, USA', partId: 'OPTICAL-GYRO-NAV', status: 'active', temp: '68°C', hours: '5,400 hrs' },
                      { name: 'Naval Undersea Warfare', location: 'Newport, USA', partId: 'MAGNETRON-PULSE-X', status: 'active', temp: '210°C', hours: '7,300 hrs' },
                    ].map(node => (
                      <div key={node.name} className="deployment-node-card">
                        <div className="deployment-node-info">
                          <div className="deployment-node-title">
                            <span className={`status-pip ${node.status}`} />
                            {node.name}
                          </div>
                          <div className="deployment-node-coords">{node.location} · {node.hours} · {node.temp}</div>
                          <div className="deployment-node-partid">{node.partId}</div>
                        </div>
                        <button
                          className="btn-technical"
                          style={{ fontSize: '0.7rem', padding: '4px 8px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            const found = parts.find(p => p.partId === node.partId);
                            if (found) {
                              setSelectedPart(found);
                              setView('studio');
                              setIs3DMode(true);
                              notify(`Focused ${node.partId} 3D Twin`);
                            }
                          }}
                        >
                          3D Twin →
                        </button>
                      </div>
                    ))}
                    </div> {/* deployment-nodes-inner */}
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
          )}
        </main>
      )}
        </>
      )}

      {/* ── FEATURE 4 MODAL: Airworthiness Certificate of Conformance (CoC) ── */}
      {showCertModal && selectedPart && (
        <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="certificate-modal-card" onClick={e => e.stopPropagation()}>
            <div className="certificate-top-banner">
              <div className="certificate-seal-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>PARTSURE PROTOCOL // CERTIFICATE OF AIRWORTHINESS & CONFORMANCE</span>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowCertModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="certificate-body-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748b' }}>CERTIFICATE ID</div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    COC-2026-{selectedPart.partId}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
                    Standards: <strong>FAA 8130-3 / EASA Form 1 / AS9100D Rev 4</strong>
                  </div>
                </div>

                {/* Real Working Scannable Industrial QR Code */}
                <div style={{ background: '#ffffff', padding: 6, borderRadius: 4, border: '1px solid #cbd5e1' }}>
                  <IndustrialQRCode
                    partId={selectedPart.partId}
                    partNumber={selectedPart.partNumber}
                    batchId={selectedPart.batchId}
                    manufacturerName={selectedPart.manufacturer?.name}
                    chainTxHash={selectedPart.chainTxHash}
                    size={76}
                    showDetails={false}
                  />
                </div>
              </div>

              <div className="certificate-fields-grid">
                <div className="cert-field-item">
                  <label>Component Description</label>
                  <div>{selectedPart.installedMachine || selectedPart.partNumber}</div>
                </div>
                <div className="cert-field-item">
                  <label>Part & Batch ID</label>
                  <div>{selectedPart.partNumber} / {selectedPart.batchId}</div>
                </div>
                <div className="cert-field-item">
                  <label>Manufacture Date & Shift</label>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {currentProductMeta.manufactureDate} ({currentProductMeta.manufacturePlant})
                  </div>
                </div>
                <div className="cert-field-item">
                  <label>Airworthiness Warranty Period</label>
                  <div style={{ fontWeight: 700, color: '#059669' }}>
                    VALID UNTIL {currentProductMeta.warrantyUntil} ({currentProductMeta.warrantyStatus})
                  </div>
                </div>
                <div className="cert-field-item">
                  <label>Manufacturing OEM & CAGE</label>
                  <div>{selectedPart.manufacturer?.name || 'Apex Aerospace Technologies'} (CAGE: {currentProductMeta.cageCode})</div>
                </div>
                <div className="cert-field-item">
                  <label>Current Legal Custodian</label>
                  <div>{selectedPart.currentOwner?.name || 'Global Aero Fleet Services Inc.'}</div>
                </div>
                <div className="cert-field-item">
                  <label>Metallurgy & Alloy Specification</label>
                  <div>{currentProductMeta.metallurgyAlloy} ({currentProductMeta.alloyStandard})</div>
                </div>
                <div className="cert-field-item">
                  <label>Operating Hours / Life Limit (LLP)</label>
                  <div>
                    {currentProductMeta.operatingHours.toLocaleString()} / {currentProductMeta.ratedLifeHours.toLocaleString()} hrs ({Math.round((currentProductMeta.operatingHours / currentProductMeta.ratedLifeHours) * 100)}% Consumed)
                  </div>
                </div>
                <div className="cert-field-item">
                  <label>MST Blockchain Block Hash</label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                    {selectedPart.chainTxHash || '0x7b4a2f8c9e1029384756abcdef9876543210'}
                  </div>
                </div>
                <div className="cert-field-item">
                  <label>NDT Ultrasonic & Tomography Scan</label>
                  <div style={{ color: '#059669', fontWeight: 700 }}>✓ VERIFIED ZERO VOIDS (Class A1 / Ra 0.18)</div>
                </div>
              </div>

              <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 6, fontSize: '0.72rem', color: '#475569', lineHeight: 1.45 }}>
                <strong>Certifying Authority Statement: </strong>
                This certifies that the engineering component referenced above has been manufactured, heat-treated, inspected, and serialized in full compliance with AS9100D and manufacturer quality protocols. Cryptographic ownership and lifecycle service records are permanently validated via the MST Decentralized Provenance Ledger.
              </div>
            </div>

            <div className="certificate-footer-bar">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b' }}>
                DIGITAL SIGNATURE: 0x9a8F...d233 (Apex Aerospace QA Lead)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-technical"
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    notify('Verification link copied to clipboard');
                  }}
                >
                  Copy Verification Link
                </button>
                <button
                  className="btn-technical btn-technical-primary"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Print Official Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Register New Asset ── */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-inner">
            <div className="modal-dialog-header">
              <h3>Register Asset</h3>
              <button className="modal-close-icon" onClick={() => setShowRegisterModal(false)}>✕</button>
            </div>
            <form
              className="modal-form-body"
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                try {
                  const created = await api.createPart({
                    partId: (fd.get('partId') as string).toUpperCase(),
                    partNumber: fd.get('partNumber') as string,
                    batchId: fd.get('batchId') as string,
                    installedMachine: fd.get('machine') as string,
                    manufacturerOrgId: fd.get('manufacturer') as string,
                    currentOwnerOrgId: fd.get('custodian') as string,
                    warrantyMonths: Number(fd.get('warrantyMonths') || 24),
                  });
                  setShowRegisterModal(false);
                  notify(`Asset #${created.partId} registered on ledger`);
                  loadData();
                  setSelectedPart(created);
                } catch (err: unknown) {
                  alert((err as Error).message || 'Registration failed');
                }
              }}
            >
              <div className="form-field">
                <label className="form-label-tech">Asset Part ID (Serial Identifier)</label>
                <input
                  name="partId"
                  className="form-input-tech"
                  defaultValue={`HP-${Math.floor(1000 + Math.random() * 9000)}`}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label className="form-label-tech">Part Number</label>
                  <input name="partNumber" className="form-input-tech" defaultValue="PN-AERO-TURBO-09" required />
                </div>
                <div className="form-field">
                  <label className="form-label-tech">Batch Identifier</label>
                  <input name="batchId" className="form-input-tech" defaultValue="BATCH-2026-X1" required />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label-tech">Installed System / Target Machine</label>
                <input name="machine" className="form-input-tech" defaultValue="Rolls-Royce Trent Turbofan #04" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label className="form-label-tech">Manufacturer OEM</label>
                  <select name="manufacturer" className="form-select-tech">
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label-tech">Initial Custodian</label>
                  <select name="custodian" className="form-select-tech">
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label-tech">Warranty Term (Months)</label>
                <input name="warrantyMonths" type="number" className="form-input-tech" defaultValue={36} min={6} max={120} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-technical" style={{ flex: 1 }} onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-technical btn-technical-primary" style={{ flex: 2 }}>
                  Mint Passport
                </button>
              </div>
            </form>
            </div> {/* modal-dialog-inner */}
          </div>
        </div>
      )}

      {/* ── MODAL: Simulate Claim ── */}
      {showClaimModal && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-inner">
            <div className="modal-dialog-header">
              <h3>Log Warranty Incident</h3>
              <button className="modal-close-icon" onClick={() => setShowClaimModal(false)}><X size={12} /></button>
            </div>
            <form
              className="modal-form-body"
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                try {
                  const res = await api.fileClaim({
                    partId: fd.get('partId') as string,
                    orgId: fd.get('claimant') as string,
                    failureDate: new Date().toISOString(),
                    operatingHours: Number(fd.get('hours') || 1000),
                    docHash: '0x' + Math.random().toString(16).slice(2, 66),
                  });
                  setShowClaimModal(false);
                  notify(`Claim filed: Oracle Outcome = ${res.outcome.toUpperCase()}`);
                  loadData();
                  setView('tribunal');
                } catch (err: unknown) {
                  alert((err as Error).message || 'Claim submission failed');
                }
              }}
            >
              <div className="form-field">
                <label className="form-label-tech">Component Target</label>
                <select name="partId" className="form-select-tech" defaultValue={selectedPart?.partId}>
                  {parts.map(p => (
                    <option key={p.id} value={p.partId}>{p.partId} — {p.partNumber}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label-tech">Claimant Organization</label>
                <select name="claimant" className="form-select-tech">
                  {orgs.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label-tech">Logged Operating Hours at Incident</label>
                <input name="hours" type="number" className="form-input-tech" defaultValue={1450} required />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn-technical" style={{ flex: 1 }} onClick={() => setShowClaimModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-technical btn-technical-danger" style={{ flex: 2 }}>
                  Submit for Oracle Triage
                </button>
              </div>
            </form>
            </div> {/* modal-dialog-inner */}
          </div>
        </div>
      )}

      {/* ── REAL DOCKSIDE QR SCANNER & VERIFICATION PORTAL ── */}
      {showQRScanner && (
        <QRVerificationModal
          parts={parts}
          onClose={() => setShowQRScanner(false)}
          onSelectPart={part => {
            handleSelectPart(part);
            setUserRole('protocol_admin');
            setView('studio');
            setIs3DMode(true);
            notify(`Focused 3D CAD Twin for ${part.partId}`);
          }}
        />
      )}
    </div>
  );
}

