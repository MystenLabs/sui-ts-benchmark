import { COUNTER_PACKAGE_ID, SHARED_COUNTER_ID } from '~~/utils/constants';
import { executeTransaction, suiClient } from '~~/utils/executor';
import { defineLoggedTask } from '~~/utils/logger';

export default defineLoggedTask({
	meta: {
		name: 'execute:shared-counter',
		description: 'Executes a transaction to increment a shared counter',
	},
	async run() {
		const { digest, effects } = await executeTransaction('shared-counter', (tx) => {
			tx.moveCall({
				package: COUNTER_PACKAGE_ID,
				module: 'counter',
				function: 'increment',
				arguments: [tx.object(SHARED_COUNTER_ID)],
			});
		});

		await suiClient.waitForTransaction({ digest });

		const counter = await suiClient.getObject({
			id: SHARED_COUNTER_ID,
			options: { showContent: true },
		});

		return {
			result: {
				digest,
				effects,
				counter: counter.data.content,
			},
		};
	},
	logResult: (result) => ({
		digest: result.digest,
	}),
});
