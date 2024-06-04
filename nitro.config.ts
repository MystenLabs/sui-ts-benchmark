//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: 'server',
	experimental: {
		tasks: true,
	},
	scheduledTasks: {
		// Run `cms:update` task every minute
		'* * * * *': [
			'execute:simple-transfer',
			'execute:owned-counter',
			'execute:shared-counter',
			'report:balance',
		],
	},
});
