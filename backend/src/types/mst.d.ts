declare module '@mstblockchain/mst-sdk' {
    export class Client {
        provider: any;
        signer: any;
        constructor(rpcUrl: string, privateKey?: string);
        static createRandom(rpcUrl: string): Promise<Client>;
    }
    export class Provider {
        getBlockNumber(): Promise<number>;
        getBalance(address: string): Promise<string>;
        getTransactionReceipt(hash: string): Promise<any>;
        waitForTransaction(hash: string): Promise<any>;
        estimateGas(txObject: any): Promise<number>;
        getLogs(params: any): Promise<any[]>;
    }
    export class Signer {
        getAddress(): string;
        getPrivateKey(): string;
        estimateGas(method: string, args: any[]): Promise<number>;
        sendTransaction(tx: any): Promise<string>;
        sendNative(to: string, amount: string): Promise<string>;
        sendToken(tokenAddress: string, to: string, amount: string): Promise<string>;
        deploy(abi: any, bytecode: string, args?: any[]): Promise<string>;
    }
}
