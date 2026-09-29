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

    console.log('Compiling PartRegistry...');
    const source = fs.readFileSync('./contracts/PartRegistry.sol', 'utf8');
    const input = {
        language: 'Solidity',
        sources: { 'PartRegistry.sol': { content: source } },
        settings: {
            outputSelection: {
                '*': {
                    '*': [
                        'abi',
                        'evm.bytecode',
                        'evm.deployedBytecode'
                    ]
                }
            },
            optimizer: { enabled: true, runs: 200 }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (!output.contracts || !output.contracts['PartRegistry.sol']) {
        console.error('Compilation failed or contract not found in output');
        console.log('Full output:', JSON.stringify(output));
        process.exit(1);
    }
    const contract = output.contracts['PartRegistry.sol']['PartRegistry'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('Contract compiled successfully.');

    console.log('Deploying PartRegistry to MST Testnet...');
    const deployTxHash = await client.signer.deploy(abi, '0x' + bytecode, []);
    console.log(`Deployment Transaction Hash: ${deployTxHash}`);

    const receipt = await client.provider.waitForTransaction(deployTxHash);
    const contractAddress = receipt.contractAddress;
    console.log(`Contract deployed at: ${contractAddress}`);

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
