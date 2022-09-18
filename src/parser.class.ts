type GetObjectKeys<T> = T extends Record<string, unknown>[]
	? GetObjectKeys<T>
	: T extends Record<string, unknown>
	? keyof T
	: never;

interface Options<T> {
	readonly headers: GetObjectKeys<T>[];
	readonly defaultValue?: string;
	readonly transforms?: {
		readonly [K in keyof T]?: (value: T[K]) => unknown | Promise<unknown>;
	};
	readonly delimiter?: string;
	readonly eol?: string;
}

export default class Parser<T extends Record<string, unknown>> {
	public static parse<T extends Record<string, unknown>>(data: T | T[], options: Options<T>) {
		const parser = new Parser<T>(data, options);

		return parser.parse();
	}

	private _data: T | T[];

	private constructor(data: T | T[], private options: Options<T>) {
		this.data = data;
	}

	public async parse(): Promise<string> {
		const { headers, defaultValue = 'N/A', delimiter = ',', eol = '\n' } = this.options;
		const rowsIndexedByHeader = this.indexRowsByHeader(this.data);
		const result: unknown[] = [];
		for (let i = 0; i < headers.length; i++) {
			const values = await this.executeTransforms(i, rowsIndexedByHeader, defaultValue);
			for (let j = 0; j < values.length; j++) {
				result[headers.length * j + i] =
					typeof values[j] === 'object' || Array.isArray(values[j]) ? JSON.stringify(values[j]) : values[j];
			}
		}
		return this.buildCsv(result, eol, delimiter);
	}

	private indexRowsByHeader(rows: T[]): Map<string, unknown[]> {
		return rows
			.map(Object.entries)
			.flat()
			.reduce(
				(acc, [key, value]) => acc.set(key, [...(acc.get(key) ?? []), value]),
				new Map<string, unknown[]>(this.options.headers.map((key) => [key, []])),
			);
	}

	private executeTransforms(index: number, map: Map<string, unknown[]>, defaultValue: string) {
		const headerValues = map.get(this.options.headers[index]);
		if (headerValues === undefined || headerValues.length === 0) {
			return Promise.resolve(Array.from({ length: this.data.length }, () => defaultValue));
		}
		return Promise.all(
			headerValues.map(async (value: any) => this.options.transforms?.[this.options.headers[index]]?.(value) ?? value),
		);
	}

	private buildCsv(result: unknown[], eol: string, delimiter: string) {
		let csv = `${this.options.headers.join(delimiter)}${eol}`;
		for (let i = 0; i < result.length; i += this.options.headers.length) {
			csv += `${result.slice(i, i + this.options.headers.length).join(delimiter)}${eol}`;
		}
		return csv;
	}

	private get data(): T[] {
		return Array.isArray(this._data) ? this._data : [this._data];
	}

	private set data(data: T | T[]) {
		this._data = data;
	}
}
