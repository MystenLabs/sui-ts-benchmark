export class SerialQueue {
	#queue: Array<() => void> = [];

	async runTask<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.#queue.push(() => {
				task()
					.finally(() => {
						this.#queue.shift();
						if (this.#queue.length > 0) {
							this.#queue[0]();
						}
					})
					.then(resolve, reject);
			});

			if (this.#queue.length === 1) {
				this.#queue[0]();
			}
		});
	}
}
