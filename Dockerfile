FROM oven/bun:1.3-slim

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src

# 出力先(ratio.json / debug.html)はマウントされたカレントに書く。
# モジュール解決はスクリプト位置(/app)基準なので cwd が /out でも問題ない。
WORKDIR /out
ENTRYPOINT ["bun"]
CMD ["/app/src/index.ts"]
