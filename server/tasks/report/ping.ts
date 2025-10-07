import { suiClient } from '~~/utils/executor';
import { metrics } from '~~/utils/metrics';

export default defineTask({
	meta: {
		name: 'report:ping',
		description:
			'Attempts to estimate network latency by calling sui_getReferenceGasPrice (a very cheap method)',
	},
	run: async () => {
		metrics.measureExecution('report:ping', async () => {
			await suiClient.getReferenceGasPrice();
		});

		return { result: {} };
	},
});
