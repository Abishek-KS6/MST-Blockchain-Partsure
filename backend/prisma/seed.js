import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function randomTx() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function randomSha() {
  return crypto.randomBytes(32).toString('hex');
}

async function seed() {
  console.log('⚡ Initializing Beast Mode Database Seed...');

  // Clean existing data in reverse order of foreign keys
  await prisma.claim.deleteMany();
  await prisma.event.deleteMany();
  await prisma.document.deleteMany();
  await prisma.part.deleteMany();
  await prisma.org.deleteMany();

  console.log('✓ Cleared previous database state.');

  // 1. Seed Organizations with verified Web3 wallet addresses
  const orgData = [
    {
      name: 'Apex Aerospace Technologies',
      role: 'oem',
      walletAddress: '0x9a8F58c8aF460D9D788647E326084e51EcC9d233',
    },
    {
      name: 'Titanium Precision Micro-Forging',
      role: 'supplier',
      walletAddress: '0x3D72B8B11B2Eb4399e5Fa3d5A7d52670eA86e42b',
    },
    {
      name: 'Hexcel Advanced Composites & Nano',
      role: 'supplier',
      walletAddress: '0x815C2277d337d13038D1964f43423712aE72d428',
    },
    {
      name: 'Gigafactory Fab-09 Advanced Robotics',
      role: 'factory',
      walletAddress: '0x71C8395B2902A241F830C8df06915152F9d7a22C',
    },
    {
      name: 'Global Aerospace MRO & Telemetry Services',
      role: 'service',
      walletAddress: '0x2a9BcD33e08542F6B56d4Fe49a5D8E3B68d37449',
    },
    {
      name: 'International Smart Contract Arbitration Tribunal',
      role: 'arbiter',
      walletAddress: '0x4E7A23C279eC8d9a4f6d332A005a76E9Fe610A88',
    },
  ];

  const orgs = {};
  for (const od of orgData) {
    const created = await prisma.org.create({ data: od });
    orgs[od.role] = created;
    orgs[od.name] = created;
  }
  console.log(`✓ Seeded ${orgData.length} Enterprise Ecosystem Organizations.`);

  const oem = orgs['Apex Aerospace Technologies'];
  const supplierTitanium = orgs['Titanium Precision Micro-Forging'];
  const supplierHexcel = orgs['Hexcel Advanced Composites & Nano'];
  const factory = orgs['Gigafactory Fab-09 Advanced Robotics'];
  const service = orgs['Global Aerospace MRO & Telemetry Services'];
  const arbiter = orgs['International Smart Contract Arbitration Tribunal'];

  // 2. Define 12 High-Tech Beast Mode Products / Parts
  const partsDefs = [
    {
      partId: 'HP47291',
      partNumber: 'PN-AERO-47291-B',
      batchId: 'BATCH-AERO-2024-Q3',
      manufacturerId: oem.id,
      currentOwnerId: service.id,
      installedMachine: 'Boeing EcoDemonstrator Testbed #09 (Port Thruster)',
      status: 'active',
      warrantyUntil: new Date('2027-11-15T00:00:00Z'),
      chainTxHash: '0x7b4a2f8c9e1029384756abcdef9876543210fedcba9876543210abcdef123456',
      operatingHours: 3450,
      description: 'High-Pressure Hydrogen Fuel Cell Injector Assembly with laser micro-nozzle array',
    },
    {
      partId: 'QC-CRYOPUMP-88',
      partNumber: 'PN-QC-8820-ULTRA',
      batchId: 'BATCH-QUANTUM-2025-01',
      manufacturerId: supplierTitanium.id,
      currentOwnerId: factory.id,
      installedMachine: 'Rigetti Quantum Supercluster Node 7 (0.015K Dilution Core)',
      status: 'active',
      warrantyUntil: new Date('2028-06-30T00:00:00Z'),
      chainTxHash: '0x9c3e41b7f8a920394857162534debcfa1029384756abcdef8901234567fedcba',
      operatingHours: 1240,
      description: 'Superconducting Helium-3 Dilution Refrigerator Pulse-Tube Core',
    },
    {
      partId: 'TITAN-TURBINE-X1',
      partNumber: 'PN-RB-TURB-9011',
      batchId: 'BATCH-ROLLS-SX9-04',
      manufacturerId: supplierTitanium.id,
      currentOwnerId: oem.id,
      installedMachine: 'Rolls-Royce Trent 1000 High-Bypass Turbofan SN-4819',
      status: 'active',
      warrantyUntil: new Date('2027-08-20T00:00:00Z'),
      chainTxHash: '0x1f2e3d4c5b6a708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
      operatingHours: 5120,
      description: 'Single-Crystal Titanium-Aluminide Ceramic Matrix Turbine Blade Array',
    },
    {
      partId: 'LIDAR-PHOENIX-4D',
      partNumber: 'PN-LID-4D-990',
      batchId: 'BATCH-APEX-LID-88',
      manufacturerId: oem.id,
      currentOwnerId: service.id,
      installedMachine: 'Volvo Autonomous Heavy Hauler Truck #104 (Autonomous Mining)',
      status: 'active',
      warrantyUntil: new Date('2026-12-31T00:00:00Z'),
      chainTxHash: '0x4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123',
      operatingHours: 6800,
      description: '1550nm Solid-State 4D Matrix FMCW LiDAR Transceiver with beam-steering optics',
    },
    {
      partId: 'HYDRO-ACT-9900',
      partNumber: 'PN-HYD-ACT-9900',
      batchId: 'BATCH-REXROTH-HYD-12',
      manufacturerId: supplierTitanium.id,
      currentOwnerId: service.id,
      installedMachine: 'Ariane 6 Rocket Gimbal Stage 1 (Main Actuator Bay 2)',
      status: 'failed',
      warrantyUntil: new Date('2027-04-10T00:00:00Z'),
      chainTxHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      operatingHours: 820,
      description: 'Supercritical 450-Bar Electro-Hydraulic Thrust Vector Actuator with redundant servo',
    },
    {
      partId: 'SIC-INVERTER-800V',
      partNumber: 'PN-SIC-800-REV4',
      batchId: 'BATCH-POWERTRAIN-2024-C',
      manufacturerId: factory.id,
      currentOwnerId: service.id,
      installedMachine: 'Porsche GT4 e-Performance Prototype Chassis #088',
      status: 'failed',
      warrantyUntil: new Date('2026-05-18T00:00:00Z'),
      chainTxHash: '0x8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
      operatingHours: 4100,
      description: '800V High-Bandgap Silicon-Carbide Dual Traction Inverter (450kW Peak output)',
    },
    {
      partId: 'NEURAL-ECU-PRO',
      partNumber: 'PN-NVD-DRIVE-THOR-2',
      batchId: 'BATCH-THOR-ALPHA-09',
      manufacturerId: oem.id,
      currentOwnerId: factory.id,
      installedMachine: 'Joby Aviation eVTOL Autonomous Air Taxi #03',
      status: 'active',
      warrantyUntil: new Date('2028-09-01T00:00:00Z'),
      chainTxHash: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      operatingHours: 2150,
      description: '2000-TOPS Dual Neural Compute Engine with triple-redundant lockstep CPU',
    },
    {
      partId: 'CERAMIC-ROTOR-Z',
      partNumber: 'PN-BRM-CCM-420',
      batchId: 'BATCH-BREMBO-CARB-01',
      manufacturerId: supplierHexcel.id,
      currentOwnerId: service.id,
      installedMachine: 'Ferrari 499P Le Mans Hypercar #51 (Front Axle Left)',
      status: 'retired',
      warrantyUntil: new Date('2025-06-15T00:00:00Z'),
      chainTxHash: '0x77889900aabbccddeeff11223344556677889900aabbccddeeff112233445566',
      operatingHours: 9800,
      description: 'Carbon-Silicon-Carbide Ventilated 3D-Matrix Brake Rotor (420x40mm racing spec)',
    },
    {
      partId: 'PLASMA-TORCH-MK3',
      partNumber: 'PN-HYPER-PLAS-300',
      batchId: 'BATCH-PLASMA-2024-X',
      manufacturerId: factory.id,
      currentOwnerId: oem.id,
      installedMachine: 'General Dynamics Submarine Hull Automated 6-Axis Robotic Welder',
      status: 'active',
      warrantyUntil: new Date('2027-01-20T00:00:00Z'),
      chainTxHash: '0x3344556677889900aabbccddeeff11223344556677889900aabbccddeeff1122',
      operatingHours: 3100,
      description: 'High-Frequency Shielded Swirl Plasma Arc Cutting Torch with optical arc monitoring',
    },
    {
      partId: 'OPTICAL-GYRO-NAV',
      partNumber: 'PN-RLG-NAV-770',
      batchId: 'BATCH-HONEYWELL-RLG-55',
      manufacturerId: oem.id,
      currentOwnerId: service.id,
      installedMachine: 'SpaceX Falcon Heavy Stage 2 Interplanetary Guidance Flight Unit',
      status: 'active',
      warrantyUntil: new Date('2029-12-31T00:00:00Z'),
      chainTxHash: '0x556677889900aabbccddeeff11223344556677889900aabbccddeeff11223344',
      operatingHours: 850,
      description: 'Tri-Axis Ring Laser Gyroscope Tactical Inertial Navigation System with zero-drift quartz',
    },
    {
      partId: 'COMPOSITE-SPAR-B7',
      partNumber: 'PN-CFRP-SPAR-787',
      batchId: 'BATCH-HEXCEL-CFRP-89',
      manufacturerId: supplierHexcel.id,
      currentOwnerId: service.id,
      installedMachine: 'Gulfstream G700 Long-Range Wing Box SN-044',
      status: 'failed',
      warrantyUntil: new Date('2027-10-05T00:00:00Z'),
      chainTxHash: '0x6677889900aabbccddeeff11223344556677889900aabbccddeeff1122334455',
      operatingHours: 1950,
      description: 'Intermediate-Modulus Autoclave Carbon-Fiber Wing Keel Spar with embedded fiber Bragg sensors',
    },
    {
      partId: 'MAGNETRON-PULSE-X',
      partNumber: 'PN-MAG-X-800',
      batchId: 'BATCH-RAYTHEON-X-11',
      manufacturerId: factory.id,
      currentOwnerId: oem.id,
      installedMachine: 'AN/SPY-6(V)1 Air & Missile Defense 3D AESA Radar Array Alpha',
      status: 'active',
      warrantyUntil: new Date('2028-03-15T00:00:00Z'),
      chainTxHash: '0x223344556677889900aabbccddeeff11223344556677889900aabbccddeeff22',
      operatingHours: 4200,
      description: 'Coaxial Pulsed X-Band Magnetron Cavity Oscillator (9.3GHz, 350kW Peak Power)',
    },
  ];

  const seededParts = [];

  for (const def of partsDefs) {
    const part = await prisma.part.create({
      data: {
        partId: def.partId,
        partNumber: def.partNumber,
        batchId: def.batchId,
        manufacturerOrgId: def.manufacturerId,
        currentOwnerOrgId: def.currentOwnerId,
        installedMachine: def.installedMachine,
        status: def.status,
        warrantyUntil: def.warrantyUntil,
        chainTxHash: def.chainTxHash,
      },
    });
    seededParts.push({ ...part, meta: def });
  }

  console.log(`✓ Seeded ${seededParts.length} High-Value Cybernetic Industrial Components.`);

  // 3. Seed Comprehensive Documents with IPFS & SHA256 hashes
  let docCount = 0;
  for (const item of seededParts) {
    // Every part has an Invoice, Smart Warranty, and Optical/NDT Inspection
    await prisma.document.create({
      data: {
        partId: item.id,
        docType: 'invoice',
        storagePath: `ipfs://bafybeic${randomSha().slice(0, 32)}/invoice.pdf`,
        sha256: randomSha(),
        uploadedByOrgId: item.manufacturerOrgId,
        extracted: {
          invoiceNumber: `INV-${item.partId}-2024`,
          unitCostUSD: 145000,
          currency: 'USD',
          smartContractEscrow: '0x8b32A442Fe90d182C0E83b4F50C25dF1391d1e67',
        },
        extractionModel: 'nvidia/nemotron-4-340b-instruct',
        confirmedAt: new Date(Date.now() - 180 * 86400000),
      },
    });

    await prisma.document.create({
      data: {
        partId: item.id,
        docType: 'warranty',
        storagePath: `ipfs://bafybeid${randomSha().slice(0, 32)}/warranty_sla.json`,
        sha256: randomSha(),
        uploadedByOrgId: item.manufacturerOrgId,
        extracted: {
          slaType: 'TIER-1-MISSION-CRITICAL',
          maxOperatingHours: 15000,
          thermalThresholdCelsius: 480,
          onChainResolutionOracle: arbiter.walletAddress,
        },
        extractionModel: 'meta/llama-3.1-405b-instruct',
        confirmedAt: new Date(Date.now() - 175 * 86400000),
      },
    });

    await prisma.document.create({
      data: {
        partId: item.id,
        docType: 'inspection',
        storagePath: `ipfs://bafybeih${randomSha().slice(0, 32)}/ndt_ultrasonic_scan.raw`,
        sha256: randomSha(),
        uploadedByOrgId: factory.id,
        extracted: {
          ndtMethod: 'Phased Array Ultrasonic Testing (PAUT)',
          internalPorosity: '<0.001%',
          laserSurfaceRoughnessRa: 0.18,
          inspectorSignature: 'MST-NODE-CERT-AUTH-09',
        },
        extractionModel: 'nvidia/visual-inspection-v3',
        confirmedAt: new Date(Date.now() - 150 * 86400000),
      },
    });

    docCount += 3;
  }
  console.log(`✓ Seeded ${docCount} Cryptographically Anchored Verification Documents.`);

  // 4. Seed Full Lifecycle Event History for Each Part
  let eventCount = 0;
  let blockNumber = 18450100;

  for (const item of seededParts) {
    const pDate = new Date(Date.now() - 200 * 86400000);

    // Event 1: Register on MST Blockchain
    await prisma.event.create({
      data: {
        partId: item.id,
        eventType: 'register',
        actorOrgId: item.manufacturerOrgId,
        payload: {
          action: 'DIGITAL_PASSPORT_MINTED',
          specs: item.meta.description,
          standards: ['ISO-9001', 'AS9100D', 'FAA-PMA-CERT'],
          cryptoProof: randomSha(),
        },
        docHash: randomSha(),
        txHash: item.chainTxHash || randomTx(),
        blockNumber: blockNumber++,
        createdAt: new Date(pDate.getTime() + 1 * 86400000),
      },
    });

    // Event 2: Transfer to Integration Facility
    await prisma.event.create({
      data: {
        partId: item.id,
        eventType: 'transfer',
        actorOrgId: item.manufacturerOrgId,
        payload: {
          from: item.manufacturerOrgId,
          to: factory.id,
          carrier: 'Secure Aerospace Freight Logistics',
          tempShockSensorLogged: 'NORMAL_RANGE',
        },
        docHash: randomSha(),
        txHash: randomTx(),
        blockNumber: blockNumber++,
        createdAt: new Date(pDate.getTime() + 15 * 86400000),
      },
    });

    // Event 3: Assembly & Calibration Installation
    await prisma.event.create({
      data: {
        partId: item.id,
        eventType: 'install',
        actorOrgId: factory.id,
        payload: {
          machine: item.installedMachine,
          torqueNM: 142.5,
          calibrationOffsetPPM: 0.04,
          opticalAlignment: 'PASSED',
        },
        docHash: randomSha(),
        txHash: randomTx(),
        blockNumber: blockNumber++,
        createdAt: new Date(pDate.getTime() + 30 * 86400000),
      },
    });

    // Event 4: Periodic Telemetry Service & Ultrasonic Diagnostic
    await prisma.event.create({
      data: {
        partId: item.id,
        eventType: 'service',
        actorOrgId: service.id,
        payload: {
          operatingHoursLogged: item.meta.operatingHours,
          vibrationAnalysisRMS: '0.012g',
          coolantSpectrometry: 'OPTIMAL',
          firmwareHash: '0x99281a8b',
        },
        docHash: randomSha(),
        txHash: randomTx(),
        blockNumber: blockNumber++,
        createdAt: new Date(pDate.getTime() + 80 * 86400000),
      },
    });

    // Additional conditional events
    if (item.status === 'failed') {
      await prisma.event.create({
        data: {
          partId: item.id,
          eventType: 'flag_suspect',
          actorOrgId: service.id,
          payload: {
            anomalyType: 'HIGH_PRESSURE_BURST_EVENT',
            criticalSensorAlert: 'PRESSURE_DELTA_EXCEEDED_450_BAR',
            automaticSafetyShutdown: true,
          },
          docHash: randomSha(),
          txHash: randomTx(),
          blockNumber: blockNumber++,
          createdAt: new Date(Date.now() - 10 * 86400000),
        },
      });

      await prisma.event.create({
        data: {
          partId: item.id,
          eventType: 'claim',
          actorOrgId: service.id,
          payload: {
            claimType: 'WARRANTY_MATERIAL_DEFECT',
            requestedAction: 'FULL_COMPONENT_REPLACEMENT_AND_ESCROW_SETTLEMENT',
            aiTriageTriggered: true,
          },
          docHash: randomSha(),
          txHash: randomTx(),
          blockNumber: blockNumber++,
          createdAt: new Date(Date.now() - 8 * 86400000),
        },
      });
      eventCount += 6;
    } else if (item.status === 'retired') {
      await prisma.event.create({
        data: {
          partId: item.id,
          eventType: 'service',
          actorOrgId: service.id,
          payload: {
            status: 'SCHEDULED_DECOMMISSION',
            reason: 'DUTY_CYCLE_LIMIT_REACHED_SAFELY',
            recycledMaterialsReclaimed: 'CERAMIC_MATRIX_COMPOSITE_100%',
          },
          docHash: randomSha(),
          txHash: randomTx(),
          blockNumber: blockNumber++,
          createdAt: new Date(Date.now() - 40 * 86400000),
        },
      });
      eventCount += 5;
    } else {
      eventCount += 4;
    }
  }
  console.log(`✓ Seeded ${eventCount} Immutable Blockchain Lifecycle Ledger Records.`);

  // 5. Seed Claims with Real AI Evidence Packets and Rule Results
  const failedHydro = seededParts.find(p => p.partId === 'HYDRO-ACT-9900');
  const failedSic = seededParts.find(p => p.partId === 'SIC-INVERTER-800V');
  const failedSpar = seededParts.find(p => p.partId === 'COMPOSITE-SPAR-B7');

  if (failedHydro) {
    await prisma.claim.create({
      data: {
        partId: failedHydro.id,
        status: 'open',
        failureDescription:
          'Supercritical pressure chamber seal breach occurred at 472 bar during Ariane 6 static test firing. Operating hours: 820 hrs.',
        decidedByOrgId: null,
        ruleResults: [
          { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Part cryptographic passport verified on MST chain block #18450104' },
          { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Claimant MRO is validated current custodian' },
          { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Failure date falls within active warranty window (Expires 2027-04-10)' },
          { rule: 'SERVICE_HISTORY', passed: true, detail: 'Mandatory 500-hour inspection completed on schedule' },
          { rule: 'SUSPECT_FLAG_CHECK', passed: false, detail: 'Flagged for seal delta breach sensor alert 10 days ago' },
          { rule: 'BATCH_RELIABILITY', passed: true, detail: 'No other batch failures detected in BATCH-REXROTH-HYD-12' },
        ],
        evidence: {
          summary: 'High-pressure seal containment failure under nominal flight qualification stress parameters.',
          timeline: [
            '2024-Q1: Precision titanium forging and electron-beam welding verified.',
            '2024-Q2: Stage 1 gimbal assembly installed and calibrated at 142.5 Nm.',
            '2024-Q3: 500-hr ultrasonic diagnostic showed zero micro-fissures.',
            'Recent: Sensor alert triggered: dynamic seal breach under 472 bar spike.',
          ],
          ruleFindings: [
            { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Valid on-chain passport' },
            { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Valid legal owner' },
            { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Active SLA coverage' },
            { rule: 'SERVICE_HISTORY', passed: true, detail: 'Compliant service timeline' },
            { rule: 'SUSPECT_FLAG_CHECK', passed: false, detail: 'Anomalous thermal spikes logged' },
            { rule: 'BATCH_RELIABILITY', passed: true, detail: 'Batch integrity verified' },
          ],
          recommendedOutcome: 'accept',
          reasoning:
            'AI Neural Assessment: The component failed well within its 15,000-hour rated operational threshold due to unexpected elastomer seal degradation. All maintenance and calibration procedures strictly adhered to AS9100 protocols. Recommended: Accept manufacturer warranty claim; initiate root cause metallurgy scan.',
        },
      },
    });
  }

  if (failedSic) {
    await prisma.claim.create({
      data: {
        partId: failedSic.id,
        status: 'accepted',
        failureDescription:
          'Thermal runaway and gate dielectric breakdown detected across Phase B half-bridge at 800V sustained track discharge.',
        decidedByOrgId: arbiter.id,
        ruleResults: [
          { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Verified on MST ledger' },
          { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Custodian valid' },
          { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Valid during failure incident' },
          { rule: 'SERVICE_HISTORY', passed: true, detail: 'Telemetry uploaded every 100 hours' },
          { rule: 'SUSPECT_FLAG_CHECK', passed: true, detail: 'No counterfeit flags' },
          { rule: 'BATCH_RELIABILITY', passed: true, detail: 'Isolated silicon die flaw' },
        ],
        evidence: {
          summary: 'Silicon carbide MOSFET gate breakdown under thermal cycle stress.',
          timeline: [
            '2024-02: Manufactured at Fab-09 cleanroom facility.',
            '2024-04: Dynamometer qualification passed at 450kW peak.',
            '2024-09: Overcurrent protection engaged during high-G acceleration lap.',
          ],
          ruleFindings: [
            { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Valid on-chain passport' },
            { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Valid legal owner' },
            { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Covered by warranty' },
            { rule: 'SERVICE_HISTORY', passed: true, detail: 'Compliant telemetry logs' },
            { rule: 'SUSPECT_FLAG_CHECK', passed: true, detail: 'Authentic hardware verified' },
            { rule: 'BATCH_RELIABILITY', passed: true, detail: 'Isolated incident' },
          ],
          recommendedOutcome: 'accept',
          reasoning:
            'Arbitration Tribunal Ruling: Smart contract warranty conditions met. Die failure attributed to silicon wafer crystal lattice dislocation. 100% replacement reimbursement approved from OEM escrow smart contract.',
        },
      },
    });
  }

  if (failedSpar) {
    await prisma.claim.create({
      data: {
        partId: failedSpar.id,
        status: 'disputed',
        failureDescription:
          'Ultrasonic phased-array scan revealed 14mm delamination void in carbon composite wing spar keel web after high-altitude turbulence.',
        decidedByOrgId: null,
        ruleResults: [
          { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Registered on chain' },
          { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Aircraft operator owner' },
          { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Within 3-year airframe structural warranty' },
          { rule: 'SERVICE_HISTORY', passed: true, detail: 'C-Check maintenance records verified' },
          { rule: 'SUSPECT_FLAG_CHECK', passed: false, detail: 'Disputed exceedance of G-force flight envelope' },
          { rule: 'BATCH_RELIABILITY', passed: true, detail: 'No other autoclave batches reported' },
        ],
        evidence: {
          summary: 'Airframe spar structural delamination under disputed flight load telemetry.',
          timeline: [
            '2024-01: Autoclave curing at 180°C and 7 bar pressure.',
            '2024-03: Wing assembly structural integration test passed.',
            '2024-08: Fiber Bragg grating sensors registered 3.8G transient load spike.',
          ],
          ruleFindings: [
            { rule: 'REGISTRATION_CHECK', passed: true, detail: 'Passport verified' },
            { rule: 'OWNERSHIP_CHECK', passed: true, detail: 'Owner verified' },
            { rule: 'WARRANTY_VALIDITY', passed: true, detail: 'Structural warranty active' },
            { rule: 'SERVICE_HISTORY', passed: true, detail: 'C-Check completed' },
            { rule: 'SUSPECT_FLAG_CHECK', passed: false, detail: 'Flight recorder flight envelope disputed' },
            { rule: 'BATCH_RELIABILITY', passed: true, detail: 'Batch verified' },
          ],
          recommendedOutcome: 'reject',
          reasoning:
            'AI Evidence Engine: Telemetry reveals flight envelope limit exceeded during severe mountain wave turbulence (+3.8G vs +2.5G max operational limit). Structural warranty specifically excludes aerodynamic overstress beyond operating handbook limits. Escalated to human arbiter panel for flight data recorder cross-examination.',
        },
      },
    });
  }

  console.log(`✓ Seeded AI Neural Claims & Smart Warranty Arbitration Records.`);
  console.log('🚀 Beast Mode Database Seed Complete!');
}

seed()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
