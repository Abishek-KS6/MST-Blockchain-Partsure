# PartSure AI - Digital Lifecycle Passport for Industrial Components

## Project Overview
A digital lifecycle passport for industrial components on the MST Blockchain.

## Stack
- Monorepo: TypeScript (npm workspaces)
- Blockchain: MST Testnet
- Backend: Fastify + Prisma + PostgreSQL
- Frontend: Next.js + Tailwind
- AI: NVIDIA NIM via OpenAI SDK
- MCP: Custom server for external AI agents

## Development Rules
- Chain is the source of truth for lifecycle events. Postgres is an index plus off-chain data.
- Never put documents, prices, or personal data on-chain. Only hashes and event metadata.
- All LLM output must pass a Zod schema. Warranty rules are deterministic code, never LLM judgment.
- A human confirms extracted data before it is signed and anchored on-chain.
- Secrets only in .env. Never commit .env. Provide .env.example only.
- Every AI call goes through `backend/src/ai/nim.ts`. Model IDs come from env vars.
- Every contract function has a test. Explain any non-obvious design decision in a comment.
- Do not assume MST is EVM-compatible. Verify from docs.mstblockchain.com and the SDK package README before choosing contract tooling.
