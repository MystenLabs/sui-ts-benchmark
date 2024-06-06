import { Task } from 'nitropack/runtime';
import pino from 'pino';
import { resolve, join } from 'path';
import { mkdirSync } from 'fs';

const logDir = resolve(process.cwd(), 'logs');
mkdirSync(logDir, { recursive: true });

export const logger = pino(pino.destination(join(logDir, 'server.log')));

export function defineLoggedTask<T>(
	task: Task<T> & {
		logResult?: (result: T) => Record<string, unknown>;
	},
) {
	const child = logger.child({ task: task.meta.name });
	return defineTask({
		...task,
		async run(...args: Parameters<typeof task.run>) {
			const start = Date.now();
			child.info(`Running task ${task.meta.name}`);

			try {
				const result = await task.run(...args);

				child.info(
					{
						duration: Date.now() - start,
						...task.logResult?.(result.result),
					},
					`Task ${task.meta.name} completed in ${Date.now() - start}ms`,
				);
				return result;
			} catch (error) {
				child.error(
					{
						error,
						duration: Date.now() - start,
					},
					`Error running task ${task.meta.name}`,
				);
				throw error;
			}
		},
	});
}
