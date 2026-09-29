import { Client } from '@mstblockchain/mst-sdk';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export class ChainBridge {
  private client: Client;
  private contractAddress: string;
  private abi: any;

  constructor() {
    const rpcUrl = process.env.MST_RPC_URL || 'https://testnetrpc.mstblockchain.com';
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY || '';
    this.client = new Client(rpcUrl, privateKey);
    this.contractAddress = process.env.PART_REGISTRY_ADDRESS || '';

    // Simplified ABI matching PartRegistry.sol
    this.abi = [
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "string", "name": "batchId", "type": "string" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "registerPart",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "address", "name": "toOrg", "type": "address" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "transferCustody",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "string", "name": "machineRef", "type": "string" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "recordInstall",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "uint256", "name": "operatingHours", "type": "uint256" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "recordService",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "fileClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "bool", "name": "accepted", "type": "bool" },
          { "internalType": "bytes32", "name": "docHash", "type": "bytes32" }
        ],
        "name": "resolveClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "bytes32", "name": "partIdHash", "type": "bytes32" },
          { "internalType": "bytes32", "name": "reasonHash", "type": "bytes32" }
        ],
        "name": "flagSuspect",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
  }

  async execute(method: string, args: any[], signerPrivateKey?: string) {
    const iface = new ethers.Interface(this.abi);
    const data = iface.encodeFunctionData(method, args);

    // Use provided signer or fallback to default (demo wallet)
    const effectiveClient = signerPrivateKey
      ? new Client(process.env.MST_RPC_URL!, signerPrivateKey)
      : this.client;

    const txHash = await effectiveClient.signer.sendTransaction({
      to: this.contractAddress,
      data: data
    });

    return txHash;
  }

  async registerPart(partIdHash: string, batchId: string, docHash: string, key?: string) {
    return this.execute('registerPart', [partIdHash, batchId, docHash], key);
  }

  async transferCustody(partIdHash: string, toOrg: string, docHash: string, key?: string) {
    return this.execute('transferCustody', [partIdHash, toOrg, docHash], key);
  }

  async fileClaim(partIdHash: string, docHash: string, key?: string) {
    return this.execute('fileClaim', [partIdHash, docHash], key);
  }

  async resolveClaim(partIdHash: string, accepted: boolean, docHash: string, key?: string) {
    return this.execute('resolveClaim', [partIdHash, accepted, docHash], key);
  }
}
