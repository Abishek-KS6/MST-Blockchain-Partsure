'use client';

import React, { useState } from 'react';
import { Part, Org, Claim } from '@/lib/api';
import CADViewer3D from './CADViewer3D';
import FleetGlobe3D from './FleetGlobe3D';
import {
  ShieldCheck, Gear, Airplane, QrCode,
  Stack, BookOpen, Globe, ArrowRight,
  FileText, CheckCircle, Warning, Cpu,
  Lock, ArrowSquareOut, Compass, Calendar, Clock
} from '@phosphor-icons/react';

interface LandingPageExperienceProps {
  parts: Part[];
  orgs: Org[];
  claims: Claim[];
  onLaunchConsole: () => void;
  onOpenQRScanner: () => void;
  onViewCert: (part: Part) => void;
}

export default function LandingPageExperience({
  parts,
  orgs,
  claims,
  onLaunchConsole,
  onOpenQRScanner,
  onViewCert,
}: LandingPageExperienceProps) {
  // ── 3D Showcase State ──
  const [disassemblyProgress, setDisassemblyProgress] = useState(25);
  const [blueprintMode, setBlueprintMode] = useState<'cad' | 'exploded' | 'telemetry' | 'thermal'>('exploded');
  const [stressTemp, setStressTemp] = useState(1280);
  const [stressPressure, setStressPressure] = useState(640);
  const [activeSubsystem, setActiveSubsystem] = useState('rotor');

  // ── Verification Playground State ──
  const defaultOrgOEM: Org = {
    id: 'org-oem',
    name: 'Apex Aero Forgings GmbH',
    role: 'oem',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  };
  const defaultOrgFleet: Org = {
    id: 'org-airline',
    name: 'Global Aero Fleet Services Inc.',
    role: 'airline',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  };

  const sampleParts: Part[] = parts.length > 0 ? parts.slice(0, 3) : [
    {
      id: 'demo-1',
      partId: 'CFM56-HPT-0921',
      partNumber: 'AN-7702-TI',
      batchId: 'BATCH-2024-08A',
      manufacturerOrgId: 'org-oem',
      currentOwnerOrgId: 'org-airline',
      installedMachine: 'BOEING 737-800 // N782AA',
      status: 'active',
      warrantyUntil: '2028-12-31',
      chainTxHash: '0x8f2d9c1b4e6a7350f0c2e8a1d4b6c8e0a2f4c6e8',
      manufacturer: defaultOrgOEM,
      currentOwner: defaultOrgFleet,
    },
    {
      id: 'demo-2',
      partId: 'GE90-CRYO-VALVE-44',
      partNumber: 'CV-9910-INCONEL',
      batchId: 'BATCH-2024-11C',
      manufacturerOrgId: 'org-oem',
      currentOwnerOrgId: 'org-airline',
      installedMachine: 'BOEING 777-300ER // F-GSQA',
      status: 'active',
      warrantyUntil: '2029-06-30',
      chainTxHash: '0x3a4b5c6d7e8f90123456789abcdef0123456789a',
      manufacturer: defaultOrgOEM,
      currentOwner: defaultOrgFleet,
    },
    {
      id: 'demo-3',
      partId: 'LEAP-1B-BEARING-08',
      partNumber: 'BRG-HYBRID-CR8',
      batchId: 'BATCH-2024-04F',
      manufacturerOrgId: 'org-oem',
      currentOwnerOrgId: 'org-airline',
      installedMachine: 'AIRBUS A320neo // D-AINA',
      status: 'active',
      warrantyUntil: '2027-09-15',
      chainTxHash: '0x7e8f90123456789abcdef0123456789abcdef012',
      manufacturer: defaultOrgOEM,
      currentOwner: defaultOrgFleet,
    },
  ];

  const [selectedSamplePart, setSelectedSamplePart] = useState<Part>(sampleParts[0]);
  const [isVerifyingScan, setIsVerifyingScan] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(true);

  const getProductDetails = (part: Part) => {
    const isValve = part.partId.includes('VALVE') || part.partNumber.includes('VALVE') || part.partNumber.includes('CV');
    const isBearing = part.partId.includes('BEARING') || part.partNumber.includes('BRG');

    if (isValve) {
      return {
        manufactureDate: '18-MAY-2024 // 14:15 UTC',
        manufactureFacility: 'Titanium Precision Micro-Forging (Bavaria)',
        cageCode: 'CAGE: C4921 / NSN: 4820-01-612-4401',
        warrantyUntil: part.warrantyUntil || '2029-06-30',
        warrantyStatus: 'ACTIVE // 100% COVERAGE',
        warrantyDaysRemaining: 1005,
        warrantyCoverage: '100% Comprehensive OEM Valve & Seal Escrow Replacement',
        materialSpec: 'Inconel 718 Superalloy (AMS 5596 / ASTM B637)',
        heatTreatment: 'Solution Annealed 980°C + Double Precipitation Aged',
        flightHours: 1820,
        lifeLimitHours: 15000,
        flightCycles: 450,
        maxFlightCycles: 4000,
        operatingTempRange: '-253°C Cryogenic to +700°C',
        maxPressureMpa: 450,
        ndtUltrasonic: 'Class AA Immersion - 0 Inclusions',
        ndtXray: 'Computed Micro-Tomography Passed',
        ndtCMM: '±0.0010 mm Geometric Tolerance',
        nextInspectionDue: '12-NOV-2027',
        installedPosition: 'Boeing 777-300ER // GE90 Fuel Metering Manifold',
        pufHardwareId: '#PUF-718-CRYO-VALVE-44',
        airworthinessStandards: 'FAA 8130-3 / EASA Form 1 / AS9100D Rev D',
      };
    }

    if (isBearing) {
      return {
        manufactureDate: '09-FEB-2024 // 09:40 UTC',
        manufactureFacility: 'Hexcel Advanced Composites & Nano (Zurich)',
        cageCode: 'CAGE: H7812 / NSN: 3110-01-499-1022',
        warrantyUntil: part.warrantyUntil || '2027-09-15',
        warrantyStatus: 'ACTIVE // 100% COVERAGE',
        warrantyDaysRemaining: 534,
        warrantyCoverage: 'OEM Tier-1 Rolling Element Replacement Indemnity',
        materialSpec: 'Silicon Nitride (Si3N4) Ceramic Hybrid + Cronidur 30 Steel',
        heatTreatment: 'Hot Isostatic Pressed (HIP) at 1,750°C / 200 MPa',
        flightHours: 3100,
        lifeLimitHours: 25000,
        flightCycles: 920,
        maxFlightCycles: 8000,
        operatingTempRange: '-60°C to +450°C (High-Speed Spool)',
        maxPressureMpa: 720,
        ndtUltrasonic: 'Resonant Acoustic Method (RAM) Passed',
        ndtXray: 'Fluorescent Penetrant Inspection Level 4',
        ndtCMM: '±0.0008 mm Sphericity Validated',
        nextInspectionDue: '30-OCT-2026',
        installedPosition: 'Airbus A320neo // LEAP-1B High-Pressure Core Bearing #3',
        pufHardwareId: '#PUF-CR8-HYBRID-BRG-08',
        airworthinessStandards: 'FAA 8130-3 / EASA Form 1 / AS9100D Rev D',
      };
    }

    // Default: Titanium Turbofan Rotor Assembly / Blade
    return {
      manufactureDate: '14-MAR-2024 // 08:30 UTC',
      manufactureFacility: 'Apex Aerospace Technologies (Munich)',
      cageCode: 'CAGE: C4921 / NSN: 2840-01-529-8812',
      warrantyUntil: part.warrantyUntil || '2028-12-31',
      warrantyStatus: 'ACTIVE // 100% COVERAGE',
      warrantyDaysRemaining: 824,
      warrantyCoverage: '100% Comprehensive OEM Metallurgical & In-Flight Escrow',
      materialSpec: 'Ti-6Al-4V Grade 5 Alpha-Beta Alloy (AMS 4911 / ASTM B265)',
      heatTreatment: 'Vacuum Annealed 730°C / Rapid Argon Gas Quenched',
      flightHours: 4820,
      lifeLimitHours: 20000,
      flightCycles: 1240,
      maxFlightCycles: 6000,
      operatingTempRange: '-65°C Continuous to +1,650°C Peak',
      maxPressureMpa: 850,
      ndtUltrasonic: 'Zero Voids / Ra 0.18 Sub-Surface Integrity',
      ndtXray: 'High-Energy Industrial CT Volumetric Scan Passed',
      ndtCMM: '±0.0015 mm Coordinate Measuring Validated',
      nextInspectionDue: '18-APR-2027',
      installedPosition: 'Boeing 737-800 // Tail N782AA (Left CFM56 Nacelle, Pos #1)',
      pufHardwareId: '#PUF-9021-X-TITAN',
      airworthinessStandards: 'FAA 8130-3 / EASA Form 1 / AS9100D Rev D',
    };
  };

  const digitalTwinSpecs = getProductDetails(sampleParts[0]);
  const activeSelectedSpecs = getProductDetails(selectedSamplePart);

  const handleSimulateVerify = (part: Part) => {
    setSelectedSamplePart(part);
    setIsVerifyingScan(true);
    setTimeout(() => {
      setIsVerifyingScan(false);
      setVerificationSuccess(true);
    }, 700);
  };

  // ── AI Arbitration Case Study State ──
  const [incidentScenario, setIncidentScenario] = useState<'thermal_excursion' | 'fatigue_microcrack'>('thermal_excursion');

  return (
    <div className="landing-site">
      {/* ── STICKY LUXURY NAVIGATION ── */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-brand-mark">P</div>
            <div>
              <div className="landing-brand-title">PARTSURE</div>
              <div className="landing-brand-tag">PROTOCOL 01 // SOVEREIGN PROVENANCE</div>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#digital-twin" className="landing-nav-link">Digital Twin</a>
            <a href="#threat-matrix" className="landing-nav-link">The Threat</a>
            <a href="#verification-playground" className="landing-nav-link">Verification</a>
            <a href="#ai-tribunal" className="landing-nav-link">AI Tribunal</a>
            <a href="#global-mesh" className="landing-nav-link">Fleet Mesh</a>
            <a href="#architecture" className="landing-nav-link">Architecture</a>
          </nav>

          <div className="landing-header-actions">
            <div className="landing-status-badge">
              <span className="status-dot-pulse" />
              <span>MAINNET // 100% OPERATIONAL</span>
            </div>

            <button className="btn-hero-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={onOpenQRScanner}>
              <QrCode size={14} weight="bold" />
              <span>Optical QR</span>
            </button>

            <button className="btn-launch-console" onClick={onLaunchConsole}>
              <span>Launch Console</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* ── CINEMATIC HERO SECTION ── */}
      <section className="landing-hero">
        <div className="hero-pill-badge">
          <ShieldCheck size={14} weight="bold" color="var(--accent-cyan)" />
          <span>CRYPTOGRAPHIC SOVEREIGNTY // AS9100D & FAA 8130-3 COMPLIANT</span>
        </div>

        <h1 className="hero-headline">
          <span className="text-gradient">The Cryptographic Standard for</span><br />
          <span className="text-accent-glow">Mission-Critical Aerospace Assets.</span>
        </h1>

        <p className="hero-subhead">
          Eliminating counterfeit alloys, unverified paper certificates, and multi-month warranty litigation
          with immutable hardware passports and deterministic AI claim arbitration.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={onLaunchConsole}>
            <span>Enter Operations Console</span>
            <ArrowRight size={15} weight="bold" />
          </button>

          <a href="#digital-twin" className="btn-hero-secondary">
            <Compass size={15} weight="bold" />
            <span>Explore 3D Digital Twin</span>
          </a>

          <a href="#verification-playground" className="btn-hero-secondary">
            <QrCode size={15} weight="bold" />
            <span>Test Live Verification</span>
          </a>
        </div>

        {/* Live Protocol Telemetry Ribbon */}
        <div className="hero-stats-ribbon">
          <div className="stat-capsule">
            <span className="stat-capsule-label">MONITORED ASSET VALUE</span>
            <span className="stat-capsule-val">$42.8B+</span>
            <span className="stat-capsule-note">
              <CheckCircle size={12} weight="fill" /> Active Sovereign Coverage
            </span>
          </div>

          <div className="stat-capsule">
            <span className="stat-capsule-label">ARBITRATION RESOLUTION</span>
            <span className="stat-capsule-val" style={{ color: 'var(--accent-cyan)' }}>4.2 SEC</span>
            <span className="stat-capsule-note">
              <span>vs. 280 Days Industry Benchmark</span>
            </span>
          </div>

          <div className="stat-capsule">
            <span className="stat-capsule-label">PROVENANCE INTEGRITY</span>
            <span className="stat-capsule-val" style={{ color: 'var(--accent-emerald)' }}>100.0%</span>
            <span className="stat-capsule-note">
              <CheckCircle size={12} weight="fill" /> Zero Undetected Counterfeits
            </span>
          </div>

          <div className="stat-capsule">
            <span className="stat-capsule-label">GLOBAL DEFENSE NODES</span>
            <span className="stat-capsule-val">68 NODES</span>
            <span className="stat-capsule-note">
              <span>Air-Gapped & NATO Interoperable</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 01: THE THREAT MATRIX // THE COUNTERFEIT CRISIS ── */}
      <section id="threat-matrix" className="landing-section">
        <span className="section-kicker">01 // THE COUNTERFEIT VULNERABILITY</span>
        <h2 className="section-title">Paper Certifications Are Failing Modern Aerospace.</h2>
        <p className="section-desc">
          High-performance gas turbines, hypersonic manifolds, and cryogenic valves are operating under
          extreme tolerances. Yet the global supply chain relies on photocopied paper documents.
        </p>

        <div className="crisis-grid">
          <div className="crisis-card">
            <div className="crisis-card-number">VULNERABILITY 01</div>
            <h3 className="crisis-card-title">Forged FAA 8130-3 & EASA Form 1 Documents</h3>
            <p className="crisis-card-desc">
              Over $42 billion in suspect unapproved parts (SUP) circulate globally. Fraudulent distributors
              forge heat-treatment and NDT inspection records using simple PDF manipulation.
            </p>
            <span className="crisis-metric-highlight">$42B+ Suspect Market</span>
          </div>

          <div className="crisis-card">
            <div className="crisis-card-number">VULNERABILITY 02</div>
            <h3 className="crisis-card-title">9-Month Warranty Litigation Deadlocks</h3>
            <p className="crisis-card-desc">
              When an engine blade suffers micro-cracking, OEMs blame flight crews for thermal over-stress,
              while airlines blame titanium casting porosity. Claims take up to 300 days to adjudicate.
            </p>
            <span className="crisis-metric-highlight">280 Days Avg. Delay</span>
          </div>

          <div className="crisis-card">
            <div className="crisis-card-number">VULNERABILITY 03</div>
            <h3 className="crisis-card-title">Zero Cryptographic Lineage Post-Installation</h3>
            <p className="crisis-card-desc">
              Once an asset is installed inside a high-bypass turbofan, physical paperwork is separated.
              Field maintenance technicians have no air-gapped method to verify metallurgic provenance.
            </p>
            <span className="crisis-metric-highlight">Zero Digital Anchors</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 02: 3D DIGITAL TWIN & DISASSEMBLY STAGE ── */}
      <section id="digital-twin" className="landing-section">
        <span className="section-kicker">02 // DIGITAL TWIN TELEMETRY</span>
        <h2 className="section-title">Interactive 3D Hardware Telemetry.</h2>
        <p className="section-desc">
          Every PartSure component is mapped to an interactive 3D digital twin. Drag to orbit, scrub the exploded
          disassembly slider, or toggle thermal finite element heatmaps.
        </p>

        <div className="digital-twin-stage-card">
          <div className="twin-stage-header">
            <div className="twin-stage-meta">
              <span className="twin-stage-title">CFM56-HPT-0921 // High-Pressure Titanium Rotor Assembly</span>
              <span className="twin-stage-hash">ROOT: 0x8f2d...e8a1</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mode-toggle-btn active" style={{ cursor: 'default' }}>
                METALLURGY: Ti-6Al-4V GRADE 5
              </span>
              <span className="mode-toggle-btn active" style={{ cursor: 'default', color: 'var(--accent-emerald)' }}>
                AS9100D CERTIFIED
              </span>
            </div>
          </div>

          <div className="twin-viewport-container">
            <CADViewer3D
              disassemblyProgress={disassemblyProgress}
              activeSubsystem={activeSubsystem}
              blueprintMode={blueprintMode}
              stressTemp={stressTemp}
              stressPressure={stressPressure}
              onSelectSubsystem={setActiveSubsystem}
            />
          </div>

          <div className="twin-stage-controls">
            <div className="disassembly-scrubber-wrap">
              <div className="scrubber-label-row">
                <span>EXPLODED ASSEMBLY SCRUBBER</span>
                <span>DISASSEMBLY OFFSET: {disassemblyProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={disassemblyProgress}
                onChange={e => setDisassemblyProgress(Number(e.target.value))}
                className="scrubber-slider"
              />
            </div>

            <div className="mode-toggle-group">
              {(['cad', 'exploded', 'thermal', 'telemetry'] as const).map(mode => (
                <button
                  key={mode}
                  className={`mode-toggle-btn ${blueprintMode === mode ? 'active' : ''}`}
                  onClick={() => setBlueprintMode(mode)}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comprehensive Technical Passport & Lifecycle Telemetry */}
        <div className="product-passport-deck">
          <div className="passport-card">
            <div className="passport-card-header">
              <span className="passport-card-title">
                <FileText size={15} weight="bold" color="var(--accent-cyan)" />
                Fabrication & Dates
              </span>
              <span className="passport-card-tag">BATCH LOT 08A</span>
            </div>
            <div className="passport-spec-list">
              <div className="passport-spec-item">
                <span className="passport-spec-key">Manufacture Timestamp</span>
                <span className="passport-spec-val">{digitalTwinSpecs.manufactureDate}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Warranty Valid Until</span>
                <span className="passport-spec-val" style={{ color: 'var(--accent-emerald)' }}>
                  {digitalTwinSpecs.warrantyUntil}
                </span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Warranty Coverage Status</span>
                <span className="warranty-badge-pill warranty-badge-active">
                  <CheckCircle size={12} weight="fill" />
                  {digitalTwinSpecs.warrantyStatus}
                </span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Next Mandatory NDT Overhaul</span>
                <span className="passport-spec-val">{digitalTwinSpecs.nextInspectionDue}</span>
              </div>
            </div>
          </div>

          <div className="passport-card">
            <div className="passport-card-header">
              <span className="passport-card-title">
                <Cpu size={15} weight="bold" color="var(--accent-cyan)" />
                Metallurgy & Material
              </span>
              <span className="passport-card-tag">AMS 4911</span>
            </div>
            <div className="passport-spec-list">
              <div className="passport-spec-item">
                <span className="passport-spec-key">Alloy Specification</span>
                <span className="passport-spec-val">{digitalTwinSpecs.materialSpec}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Heat Treatment Lot</span>
                <span className="passport-spec-val">{digitalTwinSpecs.heatTreatment}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Manufacturing Plant / CAGE</span>
                <span className="passport-spec-val">{digitalTwinSpecs.cageCode}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Silicon PUF Hardware Anchor</span>
                <span className="passport-spec-val" style={{ color: 'var(--accent-cyan)' }}>
                  {digitalTwinSpecs.pufHardwareId}
                </span>
              </div>
            </div>
          </div>

          <div className="passport-card">
            <div className="passport-card-header">
              <span className="passport-card-title">
                <Compass size={15} weight="bold" color="var(--accent-cyan)" />
                Operating Envelope & Life
              </span>
              <span className="passport-card-tag">LLP TRACKED</span>
            </div>
            <div className="passport-spec-list">
              <div className="passport-spec-item">
                <span className="passport-spec-key">Life Limit (LLP) Consumed</span>
                <span className="passport-spec-val">
                  {digitalTwinSpecs.flightHours.toLocaleString()} / {digitalTwinSpecs.lifeLimitHours.toLocaleString()} hrs (
                  {Math.round((digitalTwinSpecs.flightHours / digitalTwinSpecs.lifeLimitHours) * 100)}%)
                </span>
                <div className="life-limit-meter-wrap">
                  <div className="life-limit-bar-bg">
                    <div
                      className="life-limit-bar-fill"
                      style={{
                        width: `${Math.round((digitalTwinSpecs.flightHours / digitalTwinSpecs.lifeLimitHours) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Total Flight Cycles</span>
                <span className="passport-spec-val">
                  {digitalTwinSpecs.flightCycles.toLocaleString()} / {digitalTwinSpecs.maxFlightCycles.toLocaleString()} Cycles
                </span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Operating Thermal Envelope</span>
                <span className="passport-spec-val">{digitalTwinSpecs.operatingTempRange}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Proof Pressure Limit</span>
                <span className="passport-spec-val">{digitalTwinSpecs.maxPressureMpa} MPa (Hydrostatic Certified)</span>
              </div>
            </div>
          </div>

          <div className="passport-card">
            <div className="passport-card-header">
              <span className="passport-card-title">
                <Airplane size={15} weight="bold" color="var(--accent-cyan)" />
                Installation & Compliance
              </span>
              <span className="passport-card-tag">FAA 8130-3</span>
            </div>
            <div className="passport-spec-list">
              <div className="passport-spec-item">
                <span className="passport-spec-key">Active Airframe Tail</span>
                <span className="passport-spec-val">{digitalTwinSpecs.installedPosition}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Airworthiness Standards</span>
                <span className="passport-spec-val">{digitalTwinSpecs.airworthinessStandards}</span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">NDT Immersion Scan</span>
                <span className="passport-spec-val" style={{ color: 'var(--accent-emerald)' }}>
                  {digitalTwinSpecs.ndtUltrasonic}
                </span>
              </div>
              <div className="passport-spec-item">
                <span className="passport-spec-key">Genesis Hash Verification</span>
                <span className="passport-spec-val" style={{ color: 'var(--text-muted)' }}>
                  0x8f2d...e8a1 (Block #4,912,042)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03: LIVE CRYPTOGRAPHIC VERIFICATION PLAYGROUND ── */}
      <section id="verification-playground" className="landing-section">
        <span className="section-kicker">03 // REAL-TIME PROVENANCE PLAYGROUND</span>
        <h2 className="section-title">Verify Any Component Hash in Sub-Second Real-Time.</h2>
        <p className="section-desc">
          Test the PartSure verification engine with real aerospace assets. Select a component below to simulate
          an optical laser-etch scan and compute its cryptographic Merkle lineage.
        </p>

        <div className="sandbox-split-grid">
          {/* Part Selector */}
          <div className="part-selector-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                SELECT ACTIVE TEST SPECIMEN
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                3 SPECIMENS REGISTERED
              </span>
            </div>

            {sampleParts.map(part => (
              <div
                key={part.id}
                className={`sample-part-btn ${selectedSamplePart.id === part.id ? 'active' : ''}`}
                onClick={() => handleSimulateVerify(part)}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                    {part.partId}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    PN: {part.partNumber} • {part.installedMachine || 'UNASSIGNED STOCK'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    VERIFIED
                  </span>
                </div>
              </div>
            ))}

            <button
              className="btn-technical btn-technical-cyan"
              style={{ width: '100%', marginTop: 8 }}
              onClick={onOpenQRScanner}
            >
              <QrCode size={14} weight="bold" />
              <span>Launch Live Optical QR Scanner</span>
            </button>
          </div>

          {/* Verification Result Deck */}
          <div className="verification-result-deck">
            <div className="reticle-scan-animation">
              {isVerifyingScan && <div className="reticle-laser-line" />}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="status-dot-pulse" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ffffff', fontWeight: 700 }}>
                    {isVerifyingScan ? 'EXECUTING LASER RETICLE SPECTROMETRY...' : 'PROVENANCE SIGNATURE VERIFIED'}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>
                  BLOCK #4,912,042
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <span className="stat-capsule-label">HARDWARE SERIAL ID / BATCH LOT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: '#ffffff', fontWeight: 700 }}>
                  {selectedSamplePart.partId}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
                  PN: {selectedSamplePart.partNumber} • {selectedSamplePart.batchId}
                </span>
              </div>

              <div>
                <span className="stat-capsule-label">MANUFACTURE TIMESTAMP & SHIFT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700 }}>
                  {activeSelectedSpecs.manufactureDate}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'block' }}>
                  {activeSelectedSpecs.cageCode}
                </span>
              </div>

              <div>
                <span className="stat-capsule-label">AIRWORTHINESS WARRANTY COVERAGE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  VALID UNTIL {activeSelectedSpecs.warrantyUntil}
                </span>
                <div style={{ marginTop: 4 }}>
                  <span className="warranty-badge-pill warranty-badge-active" style={{ fontSize: '0.65rem' }}>
                    <CheckCircle size={11} weight="fill" />
                    {activeSelectedSpecs.warrantyDaysRemaining} DAYS COVERAGE REMAINING
                  </span>
                </div>
              </div>

              <div>
                <span className="stat-capsule-label">METALLURGY & HEAT TREATMENT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                  {activeSelectedSpecs.materialSpec}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {activeSelectedSpecs.heatTreatment}
                </span>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span className="stat-capsule-label">CURRENT AIRFRAME DEPLOYMENT</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff' }}>
                  {activeSelectedSpecs.installedPosition}
                </span>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div className="life-limit-meter-label">
                  <span>LIFE LIMIT (LLP) CONSUMPTION</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>
                    {activeSelectedSpecs.flightHours.toLocaleString()} / {activeSelectedSpecs.lifeLimitHours.toLocaleString()} hrs (
                    {Math.round((activeSelectedSpecs.flightHours / activeSelectedSpecs.lifeLimitHours) * 100)}% CONSUMED)
                  </span>
                </div>
                <div className="life-limit-bar-bg" style={{ marginTop: 4 }}>
                  <div
                    className="life-limit-bar-fill"
                    style={{
                      width: `${Math.round((activeSelectedSpecs.flightHours / activeSelectedSpecs.lifeLimitHours) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Non-Destructive Testing (NDT) Audit Strip */}
            <div className="ndt-checklist-deck">
              <div className="ndt-check-capsule">
                <CheckCircle size={15} weight="fill" color="var(--accent-emerald)" />
                <div className="ndt-check-text">
                  <strong>ULTRASONIC CMM</strong>
                  <div>{activeSelectedSpecs.ndtUltrasonic}</div>
                </div>
              </div>

              <div className="ndt-check-capsule">
                <CheckCircle size={15} weight="fill" color="var(--accent-emerald)" />
                <div className="ndt-check-text">
                  <strong>X-RAY TOMOGRAPHY</strong>
                  <div>{activeSelectedSpecs.ndtXray}</div>
                </div>
              </div>

              <div className="ndt-check-capsule">
                <Clock size={15} weight="bold" color="var(--accent-cyan)" />
                <div className="ndt-check-text">
                  <strong>NEXT OVERHAUL DUE</strong>
                  <div>{activeSelectedSpecs.nextInspectionDue}</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                SHA-256 MERKLE ROOT: {selectedSamplePart.chainTxHash || '0x8f2d9c1b4e6a7350f0c2e8a1d4b6c8e0a2f4c6e8'}
              </div>
              <button
                className="btn-technical btn-technical-primary"
                onClick={() => onViewCert(selectedSamplePart)}
              >
                <FileText size={13} weight="bold" />
                <span>View Airworthiness CoC</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 04: AUTONOMOUS AI WARRANTY TRIBUNAL ── */}
      <section id="ai-tribunal" className="landing-section">
        <span className="section-kicker">04 // DETERMINISTIC AI ORACLE</span>
        <h2 className="section-title">Autonomous Tribunal. Claims Adjudicated in 4.2 Seconds.</h2>
        <p className="section-desc">
          PartSure replaces protracted legal battles with multi-agent deterministic AI arbitration. Flight-line IoT
          telemetry is compared directly against OEM thermodynamic physics envelopes.
        </p>

        <div className="tribunal-showcase-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                ACTIVE SIMULATION SCENARIO
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                {incidentScenario === 'thermal_excursion'
                  ? 'Turbine Blade Thermal Excursion at FL380 // 1,480°C Spike'
                  : 'Sub-Surface Casting Porosity Fracture // Batch Batch-2024-08A'}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`mode-toggle-btn ${incidentScenario === 'thermal_excursion' ? 'active' : ''}`}
                onClick={() => setIncidentScenario('thermal_excursion')}
              >
                Scenario A: Flight Thermal Overstress
              </button>
              <button
                className={`mode-toggle-btn ${incidentScenario === 'fatigue_microcrack' ? 'active' : ''}`}
                onClick={() => setIncidentScenario('fatigue_microcrack')}
              >
                Scenario B: Forge Casting Defect
              </button>
            </div>
          </div>

          <div className="arbitration-timeline">
            <div className="timeline-step-card active">
              <div className="timeline-step-badge">STEP 01 // TELEMETRY INGESTION</div>
              <div className="timeline-step-title">Black-Box IoT Ingest</div>
              <div className="timeline-step-desc">
                High-frequency strain gauges and pyrometer logs extracted via ARINC 429 digital bus.
              </div>
            </div>

            <div className="timeline-step-card active">
              <div className="timeline-step-badge">STEP 02 // PHYSICS VERIFICATION</div>
              <div className="timeline-step-title">Thermodynamic Envelope</div>
              <div className="timeline-step-desc">
                AI cross-references flight parameters against OEM AS9100D metallurgical tolerances.
              </div>
            </div>

            <div className="timeline-step-card active">
              <div className="timeline-step-badge">STEP 03 // DETERMINATION</div>
              <div className="timeline-step-title">Deterministic Verdict</div>
              <div className="timeline-step-desc">
                {incidentScenario === 'thermal_excursion'
                  ? 'EGT exceeded maximum allowable limit by 180°C for 42s. Verdict: Airline Operational Fault.'
                  : 'Casting void confirmed via ultrasonic tomographic baseline. Verdict: OEM Fabrication Defect.'}
              </div>
            </div>

            <div className="timeline-step-card active">
              <div className="timeline-step-badge">STEP 04 // ESCROW SETTLEMENT</div>
              <div className="timeline-step-title">Automated Payout</div>
              <div className="timeline-step-desc">
                Smart contract multi-sig immediately executes $185,000 indemnity payout in 4.2 seconds.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 05: GLOBAL 3D FLEET & SATELLITE CORRIDOR MESH ── */}
      <section id="global-mesh" className="landing-section">
        <span className="section-kicker">05 // GLOBAL INFRASTRUCTURE</span>
        <h2 className="section-title">Decentralized Aerospace Mesh Across 4 Continents.</h2>
        <p className="section-desc">
          Live monitoring of commercial fleets, defense airframes, and certified MRO facilities across
          international flight corridors.
        </p>

        <div className="digital-twin-stage-card" style={{ height: '580px' }}>
          <div className="twin-stage-header">
            <div className="twin-stage-meta">
              <span className="twin-stage-title">MST GLOBAL SATELLITE CORRIDOR MESH</span>
              <span className="twin-stage-hash">4 CONTINENTS // 68 HUBS</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
              ROTATING TELEMETRY FEED
            </div>
          </div>

          <div style={{ width: '100%', height: 'calc(100% - 60px)', position: 'relative' }}>
            <FleetGlobe3D
              onSelectPart={(partId: string) => {
                const found = parts.find(p => p.partId === partId || p.id === partId);
                if (found) setSelectedSamplePart(found);
              }}
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 06: BENTO ARCHITECTURE // DEFENSE SPECIFICATIONS ── */}
      <section id="architecture" className="landing-section">
        <span className="section-kicker">06 // DEFENSE & SOVEREIGN ARCHITECTURE</span>
        <h2 className="section-title">Engineered for Zero-Tolerance Environments.</h2>
        <p className="section-desc">
          PartSure is built from the ground up for classified defense, commercial aerospace, and nuclear power sectors.
        </p>

        <div className="bento-grid">
          <div className="bento-item bento-item-span2">
            <div className="bento-icon">
              <Lock size={20} weight="bold" />
            </div>
            <h3 className="bento-title">Zero-Knowledge CAD & Metallurgy Shield</h3>
            <p className="bento-desc">
              Verify that an alloy meets strict military tolerances without disclosing proprietary CAD drawings,
              chemical formulations, or classified defense specifications to third-party inspectors.
            </p>
          </div>

          <div className="bento-item">
            <div className="bento-icon">
              <Cpu size={20} weight="bold" />
            </div>
            <h3 className="bento-title">Physical Silicon PUF</h3>
            <p className="bento-desc">
              Physical Unclonable Functions (PUF) microscopic silicon chips laser-embedded into titanium castings.
            </p>
          </div>

          <div className="bento-item">
            <div className="bento-icon">
              <QrCode size={20} weight="bold" />
            </div>
            <h3 className="bento-title">Air-Gapped Optical Verifiers</h3>
            <p className="bento-desc">
              Flight-line technicians can scan laser-etched 2D DataMatrix codes on aircraft carrier decks with zero internet.
            </p>
          </div>

          <div className="bento-item bento-item-span2">
            <div className="bento-icon">
              <ShieldCheck size={20} weight="bold" />
            </div>
            <h3 className="bento-title">Automated Multi-Sig Escrow Indemnity</h3>
            <p className="bento-desc">
              No protracted court battles. Pre-funded collateral escrows release compensation directly to airlines or
              OEMs the instant the AI arbitration tribunal publishes a cryptographically signed proof.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 07: CTA BANNER ── */}
      <section className="landing-section" style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', background: 'linear-gradient(180deg, rgba(20, 24, 36, 0.8), rgba(8, 10, 15, 0.95))', padding: '60px 40px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>
            Ready to Protect Your Sovereign Fleet?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 32px' }}>
            Access the full PartSure operational protocol suite to register serialized assets,
            conduct optical dockside scans, and file AI arbitration claims.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn-hero-primary" onClick={onLaunchConsole}>
              <span>Launch Protocol Console</span>
              <ArrowRight size={15} weight="bold" />
            </button>
            <button className="btn-hero-secondary" onClick={onOpenQRScanner}>
              <QrCode size={15} weight="bold" />
              <span>Scan Component QR</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── PREMIUM WEBSITE FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="landing-brand-mark" style={{ width: 28, height: 28, fontSize: '0.9rem' }}>P</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                PARTSURE CORE PROTOCOL
              </div>
              <div className="footer-genesis-tag">
                GENESIS BLOCK: 0x9b4f2c018a3d7e551204cf8a91b2c4e6a8e0 // AS9100D REV D
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#digital-twin" className="landing-nav-link">Digital Twin</a>
            <a href="#threat-matrix" className="landing-nav-link">Vulnerabilities</a>
            <a href="#verification-playground" className="landing-nav-link">Provenance</a>
            <a href="#ai-tribunal" className="landing-nav-link">AI Tribunal</a>
            <span className="landing-nav-link" onClick={onLaunchConsole} style={{ color: 'var(--accent-cyan)' }}>
              Protocol Console →
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            © 2026 PARTSURE PROTOCOL FOUNDATION. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
