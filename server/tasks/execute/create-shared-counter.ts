import { bcs } from '@mysten/sui/bcs';
import { COUNTER_PACKAGE_ID } from '~~/utils/constants';
import { executeTransaction } from '~~/utils/executor';
import { defineLoggedTask } from '~~/utils/logger';

export default defineLoggedTask({
	meta: {
		name: 'execute:create-shared-counter',
		description: 'Creates a shared counter object',
	},
	async run() {
		const { digest, effects } = await executeTransaction('create-shared-counter', (tx, sender) => {
			tx.moveCall({
				package: COUNTER_PACKAGE_ID,
				module: 'counter',
				function: 'create',
			});
		});

		const parsedEffects = bcs.TransactionEffects.fromBase64(effects);

		const created = parsedEffects.V2.changedObjects
			.filter(([id, change]) => change.idOperation.Created)
			.map(([id, change]) => {
				return {
					objectId: id,
					digest: change.outputState.ObjectWrite[0],
					version: parsedEffects.V2.lamportVersion,
				};
			});

		return {
			result: {
				digest,
				effects,
				created,
			},
		};
	},
	logResult: (result) => ({
		digest: result.digest,
	}),
});
