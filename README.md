# cash-tabelog

食べログに掲載されている店舗のうち「カード決済可能」な店舗の割合を、
全国+都道府県別に集計して棒グラフで表示します。

- `src/index.ts` — 集計スクリプト(Bun + TypeScript + cheerio)。
  全店舗数とカード対応店舗数(`?ChkCard=1`)を取得し `ratio.json` に書き出します
- `index.html` — `ratio.json` を Chart.js で描画する静的ページ
- `.github/workflows/fetch.yml` — **毎週月曜 3:00 JST に自動実行**し、
  変化があれば `ratio.json` をコミットします(手動実行も可)
- `.github/workflows/deploy.yml` — `index.html` / `ratio.json` の変更を
  **GitHub Pages に自動デプロイ**します

## 使い方

### Docker(手元に Bun 不要)

```shell
docker compose run --rm fetch    # ratio.json を更新(カレントに出力)
docker compose run --rm doctor   # サイト構造の診断
```

### Bun を直接使う場合

```shell
bun install
bun run fetch    # ratio.json を更新
bun run doctor   # サイト構造の診断
bun run check    # 型チェック
```

公開ページ: https://5ym.github.io/cash-tabelog/
(`ratio.json` が更新されるたびに自動で再デプロイされます)

## メモ

- リクエストは同時 4 本に制限しています(先方への配慮)
- **注意**: 食べログは GitHub Actions(データセンターIP)からのアクセスを 403 で拒否するため、
  定期取得ジョブはホステッドランナーでは失敗します。手元やサーバーで `bun run fetch` を実行して
  push すれば、Pages への反映は自動で行われます(セルフホステッドランナーでも可)
- `ratio.json` の形式は従来と互換です:
  `{ "全国": { "all": "...", "card": "..." }, "北海道": { ... }, ... }`
