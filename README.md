# cash-tabelog

食べログに掲載されている店舗のうち「カード決済可能」な店舗の割合を、
全国+都道府県別に集計して棒グラフで表示します。

- `src/index.ts` — 集計スクリプト(Bun + TypeScript + cheerio)。
  全店舗数とカード対応店舗数(`?ChkCard=1`)を取得し `ratio.json` に書き出します
- `index.html` — `ratio.json` を Chart.js で描画する静的ページ
- `.github/workflows/fetch.yml` — **毎週月曜 3:00 JST に自動実行**し、
  変化があれば `ratio.json` をコミットします(手動実行も可)

## 使い方

```shell
bun install
bun run fetch   # ratio.json を更新
bun run check   # 型チェック
```

`index.html` は静的ファイルなのでそのまま配信できます
(`ratio.json` と同じ場所に置くだけ)。

## メモ

- リクエストは同時 4 本に制限しています(先方への配慮)
- `ratio.json` の形式は従来と互換です:
  `{ "全国": { "all": "...", "card": "..." }, "北海道": { ... }, ... }`
