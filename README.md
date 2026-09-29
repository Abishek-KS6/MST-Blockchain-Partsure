# 🛡️ PartSure AI: Digital Lifecycle Passports for Industrial Components

PartSure AI is a trust-layer for the industrial supply chain, ensuring that critical components—from jet engine turbines to medical imaging sensors—have an immutable, verifiable, and AI-enhanced lifecycle history.

## 🔴 The Problem
Industrial components move through a complex web of OEMs, suppliers, factories, and service providers. Currently, lifecycle data (installation dates, service logs, warranty claims) exists in fragmented PDFs, emails, and proprietary databases. This leads to:
- **Warranty Fraud**: Falsified service records or claims for expired parts.
- **Safety Risks**: Unknown service history for critical components.
- **Inefficient Claims**: Weeks of manual evidence gathering for a single warranty claim.

## 🟢 The Solution
PartSure AI creates a **Digital Lifecycle Passport**. Every major event in a part's life is signed by the authorized organization and anchored on the MST Blockchain. AI agents then extract data from supporting documents (invoices, service reports) to create "Evidence Packets" that make warranty adjudication deterministic and instant.

## 🏗️ Architecture

```mermaid
graph TD
    subgraph "MST Blockchain (Source of Truth)"
        Registry[PartRegistry Contract]
        Events[Lifecycle Events]
    end

    subgraph "Backend (Indexing & AI)"
        Indexer[Chain Indexer]
        DB[(PostgreSQL)]
        AI[NVIDIA NIM Agents]
        API[Fastify API]
    end

    subgraph "Interface Layer"
        Frontend[Next.js Dashboard]
        MCP[MCP Server for Claude]
    end

    Registry --> Events
    Events --> Indexer
    Indexer --> DB
    DB --> AI
    AI --> API
    API --> Frontend
    API --> MCP
```

## ⛓️ Why MST Blockchain?
Standard databases can be edited. PartSure AI requires **Role-Gated Multi-Party Events**. 
- An **OEM** must register the part.
- Only a **FACTORY** can record an installation.
- Only a **SERVICE** provider can log operating hours.
- Only an **ARBITER** can resolve a claim.
By using MST, we ensure that no single party can fabricate a part's history.

### On-Chain vs Off-Chain
| Data Type | Location | Why? |
| :--- | :--- | :--- |
| Event Type, Actor, Part Hash | **On-Chain** | Immutability and auditability. |
| Document Hashes (SHA256) | **On-Chain** | Verifies off-chain document integrity. |
| Full Documents, PDF, Images | **Off-Chain** | Privacy and storage costs. |
| PII, Prices, Internal Notes | **Off-Chain** | Data sovereignty and privacy. |

## 🚀 Local Setup

### 1. Prerequisites
- Node.js v20+
- PostgreSQL running locally

### 2. Environment Configuration
Create a `.env` file in the root and `backend/` directory:
```env
# NVIDIA AI
NVIDIA_API_KEY=your_key
NVIDIA_VISION_MODEL=model_id
NVIDIA_TEXT_MODEL=model_id

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/partsure"

# MST Blockchain
MST_RPC_URL=https://testnetrpc.mstblockchain.com
DEPLOYER_PRIVATE_KEY=0x...
PART_REGISTRY_ADDRESS=0x...
```

### 3. Installation & Launch
```bash
# Install dependencies
npm install

# Setup Database
cd backend
npm run db:migrate
npm run db:seed

# Start Backend
npm run dev
```

## 🧪 Demo & Verification
- **Contract Address**: `[Fill after deploy]`
- **Sample Register Tx**: `[Fill after deploy]`
- **Sample Claim Tx**: `[Fill after deploy]`

### Demo Script
1. Run the backend.
2. Use the frontend to `Register` a part as an OEM.
3. `Transfer` custody to a Factory.
4. `Install` the part in a machine.
5. `File a Claim` as the Factory.
6. Observe the AI Evidence Packet generated in the dashboard.

## ⚠️ Limitations & Future Work
- **Physical Linkage**: This system proves the *digital* record is valid. Physical authenticity requires tamper-evident NFC/RFID tags linked to the on-chain ID.
- **Human-in-the-loop**: AI generates the evidence and recommends an outcome, but a human Arbiter must sign the final `resolveClaim` transaction.
