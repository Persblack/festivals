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
exit $failed
