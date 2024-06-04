import { MIST_PER_SUI } from '@mysten/sui/utils';
import { keypair, suiClient } from '~~/utils/executor';
import { metrics } from '~~/utils/metrics';

export default defineTask({
	meta: {
		name: 'report:balance',
		description: 'Reports the SUI balance of the current account',
	},
	run: async () => {
		const address = keypair.toSuiAddress();
		const balance = await suiClient.getBalance({
			owner: address,
		});

		metrics.setGauge('balance', Number(balance.totalBalance) / Number(MIST_PER_SUI));

		return {
			result: {
				address,
				balance: Number(balance.totalBalance) / Number(MIST_PER_SUI),
			},
		};
	},
});
