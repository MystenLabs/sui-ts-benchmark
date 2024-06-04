export default eventHandler(async (event) => {
	const payload = { ...getQuery(event) };
	const task = getRouterParam(event, 'task');
	let taskResult;

	switch (task) {
		case 'simple-transfer':
			taskResult = await runTask('execute:simple-transfer', { payload });
			break;
		case 'owned-counter':
			taskResult = await runTask('execute:owned-counter', { payload });
			break;

		case 'shared-counter':
			taskResult = await runTask('execute:shared-counter', { payload });
			break;
		default:
			throw new Error(`Task ${task} not found`);
	}

	return taskResult.result;
});
