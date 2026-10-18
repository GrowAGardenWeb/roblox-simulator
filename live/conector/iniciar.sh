#!/bin/sh
cd "$(dirname "$0")"
U="$1"
[ -z "$U" ] && printf "Tu usuario de TikTok: " && read U
[ -d node_modules ] || npm install --omit=dev
node conector.mjs "$U" "$2"
