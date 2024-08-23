import {
	JsonRpcError,
	SuiHTTPStatusError,
	SuiTransport,
	SuiTransportRequestOptions,
	SuiTransportSubscribeOptions,
} from '@mysten/sui/client';
import { request } from 'node:https';
import { parse as parseServerTiming } from 'server-timify';
import { Instrumentation } from './metrics';
import { logger } from './logger';

const elapsedSeconds = (start: [number, number]) => {
	const [seconds, nanoseconds] = process.hrtime(start);
	return seconds + nanoseconds / 1e9;
}

export class InstrumentedTransport implements SuiTransport {
	#requestId = 1;
	#url: string;
	#metrics: Instrumentation;

	constructor({ url, metrics }: { url: string; metrics: Instrumentation }) {
		this.#url = url;
		this.#metrics = metrics;
	}

	async request<T>(input: SuiTransportRequestOptions): Promise<T> {
		this.#requestId += 1;

		return new Promise((resolve, reject) => {
			const start = process.hrtime();
			const timings: { [key: string]: number } = {};

			const req = request(
				this.#url,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				},
				(res) => {
					const serverTiming = res.headers['server-timing'];

					if (serverTiming) {
						const timings = Array.isArray(serverTiming)
							? serverTiming.map((header) => parseServerTiming(header)).flat()
							: parseServerTiming(serverTiming);

						logger.info({ method: input.method, serverTimings: timings });

						timings.forEach((timing) => {
							this.#metrics.setGauge(`${timing.name}:${input.method}`, timing.duration ?? 0);
						});
					}

					const response = [];

					res.once('readable', () => {
						timings.firstByte = elapsedSeconds(start);
					});

					res.on('data', (chunk) => {
						response.push(chunk);
					});

					res.on('end', () => {
						timings.duration = elapsedSeconds(start);
						if (res.statusCode > 299) {
							reject(
								new SuiHTTPStatusError(
									`Unexpected status code: ${res.statusCode}`,
									res.statusCode,
									res.statusMessage,
								),
							);
							return;
						}

						const data = JSON.parse(Buffer.concat(response).toString());

						if ('error' in data && data.error != null) {
							reject(new JsonRpcError(data.error.message, data.error.code));
							return;
						}

						logger.info({ method: input.method, clientTimings: timings });
						Object.entries(timings).forEach(([key, value]) => {
							this.#metrics.setGauge(`${input.method}:${key}`, value);
						});

						resolve(data.result);
					});

					res.on('error', (err) => {
						reject(err);
					});
				},
			);

			req.on('error', (err) => {
				reject(err);
			});

			req.end(
				JSON.stringify({
					jsonrpc: '2.0',
					id: this.#requestId,
					method: input.method,
					params: input.params,
				}),
			);

			req.on('socket', (socket) => {
				timings.socketConnected = elapsedSeconds(start);
				socket.on('lookup', () => {
					timings.dnsLookup = elapsedSeconds(start);
				});
				socket.on('connect', () => {
					timings.tcpConnect = elapsedSeconds(start);
				});
				socket.on('secureConnect', () => {
					timings.tlsConnect = elapsedSeconds(start);
				});
			});
		});
	}

	subscribe<T>(input: SuiTransportSubscribeOptions<T>): never {
		throw new Error('Method not implemented.');
	}
}
