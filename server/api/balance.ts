export default eventHandler(async (event) => {
	const { result } = await runTask('report:balance', { payload: { ...getQuery(event) } });

	return result;
});
