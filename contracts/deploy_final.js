const { Client } = require('@mstblockchain/mst-sdk');
const solc = require('solc');
const fs = require('fs');
require('dotenv').config();

async function main() {
    const rpcUrl = 'https://testnetrpc.mstblockchain.com';
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!privateKey) {
        console.error('Error: DEPLOYER_PRIVATE_KEY not found in .env');
        process.exit(1);
    }

    const client = new Client(rpcUrl, privateKey);

    // 1. Compile Contract
    console.log('Compiling PartRegistry...');
    const source = fs.readFileSync('./contracts/PartRegistry.sol', 'utf8');
    const input = {
        language: 'Solidity',
        sources: { 'PartRegistry.sol': { content: source } },
        settings: {
            outputSelection: {
                '*': {
                    evm: { bytecode: { linkedOptimization: true }, interface: {} }
                }
            },
            optimizer: { enabled: true, runs: 200 }
        }
    };

    // Note: solc.compile expects a JSON string
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach(err => {
            if (err.severity === 'error') console.error(`Solc Error: ${err.message}`);
        });
        if (output.errors.some(err => err.severity === 'error')) process.exit(1);
    }

    const contract = output.contracts['PartRegistry.sol']['PartRegistry'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('Contract compiled successfully.');

    // 2. Deploy Contract
    console.log('Deploying PartRegistry to MST Testnet...');
    const deployTxHash = await client.signer.deploy(abi, '0x' + bytecode, []);
    console.log(`Deployment Transaction Hash: ${deployTxHash}`);

    const receipt = await client.provider.waitForTransaction(deployTxHash);
    const contractAddress = receipt.contractAddress;
    console.log(`Contract deployed at: ${contractAddress}`);

    // 3. Register a part to prove it works
    console.log('Registering a part to verify...');

    // We need to encode the registerPart function call.
    // Since we can't use ethers.Interface easily here without adding more deps,
    // and the prompt asks for deployment + 1 tx, we can use a simple manual encode
    // or just use the deploy tx as proof if needed.
    // However, let's try to do a basic register call.

    // Simplified approach: use a small ethers instance just for encoding
    const ethers = require('ethers');
    const iface = new ethers.Interface(abi);
    const partIdHash = ethers.id("HP47291");
    const docHash = ethers.id("DOC_ROOT_HASH");
    const data = iface.encodeFunctionData('registerPart', [partIdHash, "BATCH-001", docHash]);

    const regTxHash = await client.signer.sendTransaction({
        to: contractAddress,
        data: data
    });
    console.log(`RegisterPart Transaction Hash: ${regTxHash}`);
    await client.provider.waitForTransaction(regTxHash);

    console.log('\n--- FINAL RESULTS ---');
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Register TX Hash: ${regTxHash}`);
}

main().catch(console.error);
