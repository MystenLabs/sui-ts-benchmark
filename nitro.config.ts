//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: 'server',
	esbuild: {
		options: {
			target: 'es2020',
		},
	},
	experimental: {
		tasks: true,
	},
	scheduledTasks: {
		// Run `cms:update` task every minute
		'* * * * *': [
			'execute:simple-transfer',
			'execute:shared-counter',
			'report:balance',
		],
	},
});
