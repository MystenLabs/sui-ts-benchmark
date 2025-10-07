import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SerialTransactionExecutor, Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { Keypair, decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { metrics } from './metrics';
import { SerialQueue } from './queue';

export const suiClient = new SuiClient({
	url: process.env.SUI_JSON_RPC_URL ?? getFullnodeUrl('testnet'),
});

export const keypair = fromExportedKeypair(process.env.SUI_PRIVATE_KEY);

export const serialExecutor = new SerialTransactionExecutor({
	client: suiClient,
	signer: keypair,
});

let gasPrice: bigint | null = null;

async function getGasPrice() {
	if (!gasPrice) {
		gasPrice = await suiClient.getReferenceGasPrice();
		console.log('fetched gasPrice', gasPrice);
	}

	return gasPrice;
}

export const queue = new SerialQueue();

export function executeTransaction(
	name: string,
	defineTransaction: (tx: Transaction, sender: Keypair) => Promise<void> | void,
) {
	return queue.runTask(async () => {
		const transaction = await metrics.measureExecution(`build:${name}`, async () => {
			const tx = new Transaction();
			tx.setSenderIfNotSet(keypair.toSuiAddress());
			tx.setGasPrice(await getGasPrice());
			tx.setGasBudget(50_000_000n);

			await defineTransaction(tx, keypair);

			return tx;
		});

		return metrics.measureExecution(`execute:${name}`, async () => {
			try {
				return await serialExecutor.executeTransaction(transaction);
			} catch (error) {
				console.log('error, clearing gasPrice');
				gasPrice = null;
				throw error;
			}
		});
	});
}

export function fromExportedKeypair(secret: string) {
	const decoded = decodeSuiPrivateKey(secret);
	const schema = decoded.schema;
	const secretKey = decoded.secretKey;

	switch (schema) {
		case 'ED25519':
			return Ed25519Keypair.fromSecretKey(secretKey);
		case 'Secp256k1':
			return Secp256k1Keypair.fromSecretKey(secretKey);
		case 'Secp256r1':
			return Secp256r1Keypair.fromSecretKey(secretKey);
		default:
			throw new Error(`Invalid keypair schema ${schema}`);
	}
}
