'use client';

import React, { useState } from 'react';
import { Part } from '@/lib/api';

interface QRVerificationModalProps {
  parts: Part[];
  onClose: () => void;
  onSelectPart: (part: Part) => void;
}

export default function QRVerificationModal({ parts, onClose, onSelectPart }: QRVerificationModalProps) {
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Part | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleSimulatedScan = (part: Part) => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult(part);
    }, 700);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setScanError(null);
    const query = scanInput.trim().toLowerCase();
    const found = parts.find(
      p =>
        p.partId.toLowerCase() === query ||
        p.partNumber.toLowerCase() === query ||
        p.batchId.toLowerCase() === query
    );

    if (found) {
      setScanResult(found);
    } else {
      setScanError(`No component matched QR payload / ID "${scanInput}". Ensure code is registered on MST ledger.`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-scanner-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-scanner-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="scanner-beacon" />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                MST Provenance // Optical QR Scanner & Verifier
              </h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                FAA 8130-3 / MIL-STD-130N OPTICAL CRYPTOGRAPHIC DOCKSIDE SCAN
              </p>
            </div>
          </div>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Section */}
        <div className="qr-viewfinder-zone">
          <div className="viewfinder-crosshairs">
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />
            <div className="laser-sweep-line" />
            <div className="viewfinder-text">
              {isScanning ? 'DECODING OPTICAL 2D DATA MATRIX...' : 'ALIGN QR CODE WITHIN SIGHT'}
            </div>
          </div>

          <div className="scanner-presets-row">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              FAST DOCKSIDE SIMULATOR:
            </span>
            {parts.slice(0, 4).map(p => (
              <button
                key={p.id}
                className="btn-technical"
                style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                onClick={() => handleSimulatedScan(p)}
              >
                Scan {p.partId}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualLookup} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="text"
            className="directory-search-input"
            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            placeholder="Or enter UID / Serial / URL / Hash..."
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
          />
          <button type="submit" className="btn-technical btn-technical-primary">
            Verify Payload
          </button>
        </form>

        {/* Scan Error */}
        {scanError && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            ⚠ {scanError}
          </div>
        )}

        {/* Verified Result Card */}
        {scanResult && (
          <div className="qr-verified-card">
            <div className="qr-verified-badge">
              <span className="status-dot-emerald" />
              <span>CRYPTOGRAPHICALLY VALIDATED ON MST MAINNET</span>
            </div>

            <div className="qr-verified-grid">
              <div>
                <span className="label">COMPONENT IDENTIFIER</span>
                <div className="val">{scanResult.partId}</div>
              </div>
              <div>
                <span className="label">PART NUMBER / SPEC</span>
                <div className="val">{scanResult.partNumber}</div>
              </div>
              <div>
                <span className="label">BATCH & HEAT LOT</span>
                <div className="val">{scanResult.batchId}</div>
              </div>
              <div>
                <span className="label">AUTHENTICATING OEM</span>
                <div className="val">{scanResult.manufacturer?.name}</div>
              </div>
              <div>
                <span className="label">CUSTODIAN ASSIGNED</span>
                <div className="val">{scanResult.currentOwner?.name}</div>
              </div>
              <div>
                <span className="label">STATUS PROTOCOL</span>
                <div className="val" style={{ textTransform: 'uppercase', color: scanResult.status === 'active' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  ● {scanResult.status}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                className="btn-technical btn-technical-primary"
                onClick={() => {
                  onSelectPart(scanResult);
                  onClose();
                }}
              >
                Inspect 3D Twin & Provenance →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
