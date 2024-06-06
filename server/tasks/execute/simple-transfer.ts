import { executeTransaction } from '~~/utils/executor';
import { defineLoggedTask } from '~~/utils/logger';

export default defineLoggedTask({
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
	logResult: (result) => ({
		digest: result.digest,
	}),
});
