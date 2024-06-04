import { executeTransaction } from '~~/utils/executor';

export default defineTask({
	meta: {
		name: 'execute:simple-transfer',
		description: 'Executes a simple transfer transaction',
	},
	async run() {
		const { digest, effects } = await executeTransaction('simple-transfer', (tx, sender) => {
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
