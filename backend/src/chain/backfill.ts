import { ChainIndexer } from './indexer.js';
import dotenv from 'dotenv';

dotenv.config();

async function backfill() {
  const indexer = new ChainIndexer();
  // Start from block 0 or the contract deployment block
  await indexer.sync(0);
  console.log('Backfill complete.');
}

backfill().catch(console.error);
