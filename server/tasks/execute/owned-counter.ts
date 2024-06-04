import { executeTransaction } from '~~/utils/executor';

export default defineTask({
	meta: {
		name: 'execute:owned-counter',
		description: 'Executes a transaction to increment an owned counter',
	},
	async run() {
		const { digest, effects } = await executeTransaction('owned-counter', (tx, sender) => {
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
