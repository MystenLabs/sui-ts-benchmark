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
		// Run simple transfter every minute
		'* * * * *': ['execute:simple-transfer', 'report:balance'],
		// Run shared-counter every minute, but offset by 30 seconds so that the logs are not comingled.
		'30 * * * * *': ['execute:shared-counter'],
		// Run `report:ping` task every 10 seconds
		'*/10 * * * * *': ['report:ping'],
		// Smash coins every hour
		'0 * * * *': ['execute:smash-coins'],
	},
});
