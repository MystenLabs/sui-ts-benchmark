import {
	JsonRpcError,
	SuiHTTPStatusError,
	SuiTransport,
	SuiTransportRequestOptions,
	SuiTransportSubscribeOptions,
} from '@mysten/sui/client';
import { request as httpRequest } from 'node:https';
import { request as httpsRequest } from 'node:https';
import { parse as parseServerTiming } from 'server-timify';
import { Instrumentation } from './metrics';
import { logger } from './logger';

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
			const start = Date.now();
			const timings: { [key: string]: number } = {};

			const req = (this.#url.startsWith('https://') ? httpsRequest : httpRequest)(
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
						logger.info(`[${input.method} Server-Timing: ${serverTiming}`);
						const timings = Array.isArray(serverTiming)
							? serverTiming.map((header) => parseServerTiming(header)).flat()
							: parseServerTiming(serverTiming);

						timings.forEach((timing) => {
							this.#metrics
								.getHistogram(`${timing.name}:${input.method}`)
								.record(timing.duration ?? 0);
						});
					}

					const response = [];

					res.once('readable', () => {
						timings.firstByte = Date.now();
					});

					res.on('data', (chunk) => {
						response.push(chunk);
					});

					res.on('end', () => {
						timings.duration = Date.now();
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

						Object.entries(timings).forEach(([key, value]) => {
							this.#metrics.getHistogram(`${input.method}:${key}`).record(value);
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
				timings.socketConnected = Date.now();
				socket.on('lookup', () => {
					timings.dnsLookup = Date.now();
				});
				socket.on('connect', () => {
					timings.tcpConnect = Date.now();
				});
				socket.on('secureConnect', () => {
					timings.tlsConnect = Date.now();
				});
			});
		});
	}

	subscribe<T>(input: SuiTransportSubscribeOptions<T>): never {
		throw new Error('Method not implemented.');
	}
}
