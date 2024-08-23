import { SuiClient, getFullnodeUrl, SuiHTTPTransport } from '@mysten/sui/client';
import { SerialTransactionExecutor, Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1';
import { Keypair, decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { metrics } from './metrics';
import { SerialQueue } from './queue';
import { logger } from './logger';

const transport = new SuiHTTPTransport({
    fetch: (input, init) => {
		// try to parse init as json
		let method = '<unknown>';
		if (init && init.body) {
			try {
				const body = JSON.parse(init.body);
				method = body.method;
			} catch (e) {
				// ignore
			}
		}

		let clientStart = process.hrtime();
		return fetch(input, init)
			.then((response) => {
				let clientDuration = process.hrtime(clientStart);
				let serverTiming = response.headers.get('server-timing');
				if (serverTiming) {
					logger.info(`[${method} client time: ${clientDuration} Server-Timing: ${serverTiming}`);
				}
				return response;
			});
	},
	url: process.env.SUI_JSON_RPC_URL ?? getFullnodeUrl('testnet'),
});

export const suiClient = new SuiClient({
	transport
});

const TEST_PRIVATE_KEY = 'suiprivkey1qqrwqg3h2t0y4d3umhw6tk6v423vs2j7qt6kmuwcga3093dcy80q5x6l9st';
export const keypair = fromExportedKeypair(process.env.SUI_PRIVATE_KEY ?? TEST_PRIVATE_KEY);

export const serialExecutor = new SerialTransactionExecutor({
	client: suiClient,
	signer: keypair,
});

let gasPrice: bigint | null = null;

async function getGasPrice() {
	if (!gasPrice) {
		gasPrice = await suiClient.getReferenceGasPrice();
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
			return serialExecutor.executeTransaction(transaction);
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
