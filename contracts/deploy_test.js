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
    console.log('Compiling contract...');
    const source = fs.readFileSync('./contracts/SimpleCounter.sol', 'utf8');
    const input = {
        language: 'Solidity',
        sources: { 'SimpleCounter.sol': { content: source } },
        settings: { outputSelection: { '*': { importedAddresses: { '*': {} }, evm: { bytecode: { linkedOptimization: true }, interface: {} } } } }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['SimpleCounter.sol']['SimpleCounter'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('Contract compiled successfully.');

    // 2. Deploy Contract
    console.log('Deploying to MST Testnet...');
    const deployTxHash = await client.signer.deploy(abi, '0x' + bytecode, []);
    console.log(`Deployment Transaction Hash: ${deployTxHash}`);

    const receipt = await client.provider.waitForTransaction(deployTxHash);
    const contractAddress = receipt.contractAddress;
    console.log(`Contract deployed at: ${contractAddress}`);

    // 3. Interact: Call increment()
    console.log('Calling increment()...');
    // The SDK's signer.sendTransaction takes a raw tx object.
    // We need to encode the function call.
    const ethers = require('ethers');
    const iface = new ethers.Interface(abi);
    const data = iface.encodeFunctionData('increment');

    const incTxHash = await client.signer.sendTransaction({
        to: contractAddress,
        data: data,
        // Gas limit estimation usually handled by SDK or set manually
    });
    console.log(`Increment Transaction Hash: ${incTxHash}`);

    await client.provider.waitForTransaction(incTxHash);

    // 4. Verify Result
    const count = await client.provider.call({
        to: contractAddress,
        data: iface.encodeFunctionData('getCount')
    });
    // Note: provider.call return value depends on SDK implementation, might be raw hex
    console.log(`Current Count: ${count}`);

    console.log('\n--- SUMMARY ---');
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Deploy TX: ${deployTxHash}`);
    console.log(`Increment TX: ${incTxHash}`);
}

main().catch(console.error);
