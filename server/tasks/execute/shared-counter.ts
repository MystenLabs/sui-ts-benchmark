import { executeTransaction } from '~~/utils/executor';

export default defineTask({
	meta: {
		name: 'execute:shared-counter',
		description: 'Executes a transaction to increment a shared counter',
	},
	async run() {
		const { digest, effects } = await executeTransaction('shared-counter', (tx, sender) => {
			const [coin] = tx.splitCoins(tx.gas, [1]);
			tx.transferObjects([coin], sender.toSuiAddress());
		});

		return {
			result: {
				digest,
				effects,
			},
		};
	},
});
