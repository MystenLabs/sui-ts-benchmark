import { bcs } from '@mysten/sui/bcs';
import { COUNTER_PACKAGE_ID } from '~~/utils/constants';
import { executeTransaction } from '~~/utils/executor';

export default defineTask({
	meta: {
		name: 'execute:create-owned-counter',
		description: 'Creates an owned counter object',
	},
	async run() {
		const { digest, effects } = await executeTransaction('create-owned-counter', (tx, sender) => {
			tx.moveCall({
				package: COUNTER_PACKAGE_ID,
				module: 'counter',
				function: 'create_owned',
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
});
