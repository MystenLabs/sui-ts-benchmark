import { CoinStruct } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { keypair, queue, serialExecutor, suiClient } from '~~/utils/executor';
import { defineLoggedTask } from '~~/utils/logger';

export default defineLoggedTask({
	meta: {
		name: 'execute:smash-coins',
		description: 'Smash all sui coins into a single gas coin',
	},
	async run() {
		const { digest } = await queue.runTask(async () => {
			await serialExecutor.waitForLastTransaction();
			const coins = await loadAllCoins();
			const firstCoin = coins.shift();
			let digest: string | undefined;
			let gasCoin = {
				objectId: firstCoin.coinObjectId,
				digest: firstCoin.digest,
				version: firstCoin.version,
			};

			while (coins.length) {
				console.log(`Smashing coins: ${coins.length} remaining`);
				const transaction = new Transaction();
				transaction.setGasPayment([
					gasCoin,
					...coins.splice(0, 254).map((coin) => ({
						objectId: coin.coinObjectId,
						digest: coin.digest,
						version: coin.version,
					})),
				]);

				const result = await suiClient.signAndExecuteTransaction({
					transaction,
					signer: keypair,
				});

				digest = result.digest;

				const { effects } = await suiClient.waitForTransaction({
					digest,
					options: {
						showEffects: true,
					},
				});

				gasCoin = effects.gasObject.reference;
			}

			await serialExecutor.resetCache();

			return { digest };
		});

		return {
			result: {
				digest,
			},
		};
	},
	logResult: (result) => ({
		digest: result.digest,
	}),
});

async function loadAllCoins() {
	const coins: CoinStruct[] = [];

	let hasMore = true;
	let cursor: string | null = null;

	while (hasMore) {
		const page = await suiClient.getCoins({
			cursor,
			owner: keypair.toSuiAddress(),
		});

		coins.push(...page.data);
		hasMore = page.hasNextPage;
		cursor = page.nextCursor;
	}

	coins.sort((a, b) => Number(BigInt(b.balance) - BigInt(a.balance)));

	return coins;
}
