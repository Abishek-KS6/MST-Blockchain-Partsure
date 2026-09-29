import { Client } from '@mstblockchain/mst-sdk';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export class ChainIndexer {
  private client: Client;
  private contractAddress: string;
  private abi = [
    {
      "anonymous": false,
      "inputs": [
        { "indexed": true, "internalType": "address", "name": "actor", "type": "address" },
        { "indexed": true, "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
        { "indexed": false, "internalType": "bytes32", "name": "docHash", "type": "bytes32" },
        { "indexed": false, "internalType": "string", "name": "eventType", "type": "string" },
        { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "name": "LifecycleEvent",
      "type": "event"
    }
  ];

  constructor() {
    this.client = new Client(process.env.MST_RPC_URL!, process.env.DEPLOYER_PRIVATE_KEY!);
    this.contractAddress = process.env.PART_REGISTRY_ADDRESS!;
  }

  async sync(fromBlock: number) {
    console.log(`Syncing from block ${fromBlock}...`);
    const currentBlock = await this.client.provider.getBlockNumber();

    // In a real scenario, we would fetch logs from the RPC.
    // Since MST SDK is lightweight, we assume the provider can fetch logs.
    const logs = await this.client.provider.getLogs({
      address: this.contractAddress,
      fromBlock: fromBlock,
      toBlock: currentBlock
    });

    const iface = new ethers.Interface(this.abi);

    for (const log of logs) {
      const parsed = iface.parseLog(log);
      if (!parsed || parsed.name !== 'LifecycleEvent') continue;

      const { actor, partIdHash, docHash, eventType } = parsed.args;
      const txHash = log.transactionHash;

      await this.processEvent(actor, partIdHash, docHash, eventType, txHash, log.blockNumber);
    }
  }

  private async processEvent(actor: string, partIdHash: string, docHash: string, eventType: string, txHash: string, blockNumber: number) {
    // 1. Idempotent Event Upsert
    await prisma.event.upsert({
      where: { txHash: txHash },
      update: {},
      create: {
        partId: (await this.getPartId(partIdHash)),
        eventType: eventType as any,
        actorOrgId: (await this.getOrgId(actor)),
        payload: { actor, partIdHash },
        docHash: docHash,
        txHash: txHash,
        blockNumber: blockNumber
      }
    });

    // 2. Update Part State
    if (eventType === 'register' || eventType === 'transfer') {
      const part = await prisma.part.findUnique({ where: { partId: (await this.getPartId(partIdHash)) } });
      await prisma.part.update({
        where: { id: part!.id },
        data: {
          currentOwnerOrgId: (await this.getOrgId(actor)),
          status: eventType === 'register' ? 'active' : part!.status
        }
      });
    }
  }

  private async getPartId(hash: string): Promise<string> {
    // In production, we'd have a mapping of hash -> uuid
    const part = await prisma.part.findFirst({ where: { partId: hash } });
    return part?.id || 'unknown';
  }

  private async getOrgId(wallet: string): Promise<string> {
    const org = await prisma.org.findUnique({ where: { walletAddress: wallet } });
    return org?.id || 'unknown';
  }
}
