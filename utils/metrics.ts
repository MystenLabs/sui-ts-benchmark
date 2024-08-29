import {
	MeterProvider,
	ConsoleMetricExporter,
	PeriodicExportingMetricReader,
	View,
	ExplicitBucketHistogramAggregation,
} from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Counter, Histogram, Meter } from '@opentelemetry/api';


const TXN_HISTOGRAM_BUCKETS = [0, 250, 350, 450, 600, 750, 1000, 1250, 1500, 1750, 2000, 3000, 5000, 10000];
const PING_HISTOGRAM_BUCKETS = [0, 10, 20, 40, 60, 80, 100, 150, 200, 250, 300, 400, 500];

export class Instrumentation {
	meter: Meter;
	histogram: Meter;
	#histograms = new Map<string, Histogram>();
	#counters = new Map<string, Counter>();
	#gauges = new Map<string, number>();

	constructor(port: number | null = null) {
		// Create the Prometheus exporter
		const exporter = port
			? new PrometheusExporter({ port: port }, () => {
					console.log(`Prometheus scrape endpoint running on port ${port}`);
				})
			: new ConsoleMetricExporter();

		const reader =
			exporter instanceof ConsoleMetricExporter
				? new PeriodicExportingMetricReader({
						exporter,
						exportIntervalMillis: 10_000,
					})
				: exporter;

		// Initialize the Meter provider
		const meterProvider = new MeterProvider({
			readers: [reader],
		});

		this.meter = meterProvider.getMeter('benchmark-meter');
	}

	getCounter(name: string) {
		if (!this.#counters.has(name)) {
			this.#counters.set(name, this.meter.createCounter(name));
		}

		return this.#counters.get(name)!;
	}

	setGauge(name: string, value: number) {
		if (!this.#gauges.has(name)) {
			const gauge = this.meter.createObservableGauge(name);
			gauge.addCallback((result) => {
				result.observe(this.#gauges.get(name)!);
			});
		}
		this.#gauges.set(name, value);
	}

	getHistogram(name: string, buckets: number[]) {
		if (!this.#histograms.has(name)) {
			this.#histograms.set(name, this.meter.createHistogram(name, {
				advice: { explicitBucketBoundaries: buckets },
			}));
		}

		return this.#histograms.get(name)!;
	}

	async measureExecution<T>(name: string, callback: () => T | Promise<T>) {
		const counter = this.getCounter(`${name}:calls`);
		const success_counter = this.getCounter(`${name}:success`);
		const error_counter = this.getCounter(`${name}:errors`);
		const buckets = name === 'report:ping' ? PING_HISTOGRAM_BUCKETS : TXN_HISTOGRAM_BUCKETS;
		const histogram = this.getHistogram(`${name}:duration`, buckets);
		// force counters to initialize if they haven't
		counter.add(0);
		success_counter.add(0);
		error_counter.add(0);

		const start = process.hrtime.bigint();
		counter.add(1);
		try {
			const result = await callback();
			success_counter.add(1);
			const end = process.hrtime.bigint();
			const duration = Number(end - start) / 1e6;
			histogram.record(duration);
			this.setGauge(`${name}:duration`, duration);
			return result;
		} catch (e) {
			error_counter.add(1);
			throw e;
		}
	}
}

export const metrics = new Instrumentation(
	process.env.PROMETHEUS_PORT ? Number(process.env.PROMETHEUS_PORT) : null,
);
