import { load } from 'cheerio';

/**
 * サイト構造の診断コマンド: `bun run doctor`
 * トップのリスティングページを1回だけ取得し、
 * HTTP ステータス / セレクタの一致数を表示する。
 * セレクタが空振りした場合は HTML を debug.html に保存して調査できるようにする。
 */

const BASE_URL = process.env.TABELOG_BASE_URL ?? 'https://tabelog.com/rstLst';
const COUNT_SELECTOR = '.c-page-count>.c-page-count__num:last-of-type>strong';
const PREF_LINK_SELECTOR = '.list-balloon__table--pref>dd>ul>li>a';

const res = await fetch(BASE_URL, {
	headers: {
		'user-agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
		accept: 'text/html,application/xhtml+xml'
	}
});
console.log(`URL:    ${BASE_URL}`);
console.log(`Status: ${res.status} ${res.statusText}`);

if (!res.ok) {
	console.log('→ HTTP エラーです。構造変更ではなくアクセス拒否(bot/IP ブロック等)の可能性が高いです。');
	process.exit(1);
}

const html = await res.text();
const $ = load(html);
const title = $('title').text().trim();
const count = $(COUNT_SELECTOR).text();
const prefLinks = $(PREF_LINK_SELECTOR).length;

console.log(`Title:  ${title}`);
console.log(`件数セレクタ (${COUNT_SELECTOR}): "${count}"`);
console.log(`都道府県リンク (${PREF_LINK_SELECTOR}): ${prefLinks} 件`);

if (!count || prefLinks === 0) {
	await Bun.write('debug.html', html);
	console.log('→ セレクタが一致しません。サイト構造が変更された可能性があります。');
	console.log('  取得した HTML を debug.html に保存しました。クラス名を確認してください。');
	process.exit(1);
}
console.log('→ 構造は想定どおりです。');
