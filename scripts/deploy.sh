#!/bin/bash
# Build, upload to Hostinger, smoke-test the live site. Exit != 0 on any failure.
# Also run weekly by ~/Library/LaunchAgents/si.synners.rebuild.plist so the hub
# pages (built from "upcoming at build time") drop festivals that are over.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== $(date '+%Y-%m-%d %H:%M') deploy"
npm run check
rsync -az --delete --delete-excluded --exclude .DS_Store --exclude '__*' \
  -e "ssh -i $HOME/.ssh/riima_hostinger -p 65002 -o BatchMode=yes" \
  dist/ u228336674@92.113.24.34:domains/synners.si/public_html/

# Cookie jar + pauses: the Hostinger CDN answers rapid cookieless requests with a 307 loop.
jar=$(mktemp)
trap 'rm -f "$jar"' EXIT
data=$(ls dist/data/ | head -1)
failed=0
for path in / /sitemap.xml /festivals/ /list/ "/data/$data"; do
  code=$(curl -s -o /dev/null -c "$jar" -b "$jar" -w '%{http_code}' "https://synners.si$path")
  echo "$code $path"
  [ "$code" = 200 ] || failed=1
  sleep 1
done
[ "$failed" = 0 ] || exit 1

# IndexNow (Bing, Yandex, Seznam): submit the sitemap URLs that are new or got a new
# lastmod since the last successful submit. The first run submits everything.
key=9ec56a91b278209636ba1fc081b09a39
sent=.cache/indexnow-sitemap.xml
mkdir -p .cache
touch "$sent"
urls=$(grep -Fvxf "$sent" dist/sitemap.xml | sed -n 's|.*<loc>\([^<]*\)</loc>.*|\1|p' | head -10000 || true)
if [ -n "$urls" ]; then
  body=$(printf '%s\n' "$urls" | python3 -c 'import json,sys; print(json.dumps({"host":"synners.si","key":sys.argv[1],"keyLocation":"https://synners.si/"+sys.argv[1]+".txt","urlList":sys.stdin.read().split()}))' "$key")
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json; charset=utf-8' --data "$body" https://api.indexnow.org/indexnow || true)
  echo "$code IndexNow ($(printf '%s\n' "$urls" | wc -l | tr -d ' ') URLs)"
  # 200/202 = accepted; anything else retries the same URLs next deploy.
  case "$code" in 200|202) cp dist/sitemap.xml "$sent" ;; esac
fi
