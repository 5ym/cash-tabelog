import { load } from 'cheerio';

/**
 * 食べログの掲載店舗数(全店舗 / カード決済可)を全国+都道府県別に取得し、
 * ./ratio.json に書き出す。出力形式は従来と同じ:
 * { "全国": { all, card }, "<都道府県>": { all, card }, ... }
 */

const BASE_URL = process.env.TABELOG_BASE_URL ?? 'https://tabelog.com/rstLst';
const COUNT_SELECTOR = '.c-page-count>.c-page-count__num:last-of-type>strong';
const PREF_LINK_SELECTOR = '.list-balloon__table--pref>dd>ul>li>a';
/** 同時リクエスト数の上限(先方に負荷をかけない) */
const CONCURRENCY = 4;

type Variant = 'all' | 'card';
type Counts = Partial<Record<Variant, string>>;

const VARIANT_QUERY: Record<Variant, string> = {
	all: '',
	card: '?ChkCard=1'
};

async function fetchHtml(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
			accept: 'text/html,application/xhtml+xml'
		}
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}: ${url}`);
	}
	return res.text();
}

/** リスティングページから掲載件数を抜き出す。 */
function extractCount(html: string): string {
	return load(html)(COUNT_SELECTOR).text();
}

/** トップのリスティングページから都道府県名 → リンクの一覧を抜き出す。 */
function extractPrefLinks(html: string): Map<string, string> {
	const $ = load(html);
	const links = new Map<string, string>();
	$(PREF_LINK_SELECTOR).each((_i, el) => {
		const a = $(el);
		const name = a.first().text().trim();
		const href = a.attr('href');
		if (name && href) links.set(name, href);
	});
	return links;
}

/** 上限付き並列マップ。 */
async function mapWithLimit<T, R>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const i = next++;
			results[i] = await fn(items[i]);
		}
	});
	await Promise.all(workers);
	return results;
}

async function collect(variant: Variant): Promise<{
	national: string;
	prefectures: Map<string, string>;
}> {
	const top = await fetchHtml(BASE_URL + VARIANT_QUERY[variant]);
	const national = extractCount(top);
	const links = extractPrefLinks(top);

	const entries = [...links.entries()];
	const counts = await mapWithLimit(entries, CONCURRENCY, async ([name, href]) => {
		const count = extractCount(await fetchHtml(href));
		console.log(`${variant}: ${name} = ${count}`);
		return [name, count] as const;
	});
	return { national, prefectures: new Map(counts) };
}

const [all, card] = await Promise.all([collect('all'), collect('card')]);

const data: Record<string, Counts> = {
	全国: { all: all.national, card: card.national }
};
for (const [name, count] of all.prefectures) {
	data[name] = { all: count, card: card.prefectures.get(name) ?? '' };
}

await Bun.write('./ratio.json', JSON.stringify(data, null, 4));
console.log(`saved: ratio.json (${Object.keys(data).length} entries)`);
