#!/usr/bin/env bash
# Add or remove a custom domain on the pkfit-share Netlify site.
#
# Usage:
#   NETLIFY_TOKEN=nfp_xxx ./scripts/netlify-domain.sh add console.deployaxiom.com
#   NETLIFY_TOKEN=nfp_xxx ./scripts/netlify-domain.sh remove console.deployaxiom.com
#   NETLIFY_TOKEN=nfp_xxx ./scripts/netlify-domain.sh list
#
# Get a token: https://app.netlify.com/user/applications#personal-access-tokens

set -euo pipefail

SITE_ID="${NETLIFY_SITE_ID:-7e016840-c5b8-4cbd-b141-8393a8f063e1}"

if [ -z "${NETLIFY_TOKEN:-}" ]; then
  echo "ERROR: NETLIFY_TOKEN env var is required" >&2
  echo "  export NETLIFY_TOKEN=nfp_xxx" >&2
  echo "  Generate at: https://app.netlify.com/user/applications#personal-access-tokens" >&2
  exit 1
fi

cmd="${1:-list}"
domain="${2:-}"

api() {
  curl -fsS -X "$1" "https://api.netlify.com/api/v1/$2" \
    -H "Authorization: Bearer $NETLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    ${3:+-d "$3"}
}

case "$cmd" in
  list)
    api GET "sites/$SITE_ID" | python3 -c "
import json, sys
s = json.load(sys.stdin)
print('Primary:', s.get('custom_domain') or '(none)')
aliases = s.get('domain_aliases') or []
print('Aliases:', ', '.join(aliases) if aliases else '(none)')
print('Default URL:', s.get('default_domain') or s.get('url'))
"
    ;;
  add)
    [ -z "$domain" ] && { echo "Usage: $0 add <domain>"; exit 1; }
    current=$(api GET "sites/$SITE_ID" | python3 -c "import json,sys; print(','.join(json.load(sys.stdin).get('domain_aliases') or []))")
    new=$([ -z "$current" ] && echo "$domain" || echo "$current,$domain")
    aliases_json=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1].split(',')))" "$new")
    api PATCH "sites/$SITE_ID" "{\"domain_aliases\": $aliases_json}" >/dev/null
    echo "Added alias: $domain"
    echo "Now add a CNAME record at your DNS provider:"
    echo "  Host:   ${domain%%.*}"
    echo "  Type:   CNAME"
    echo "  Target: pkfit-share.netlify.app."
    ;;
  remove)
    [ -z "$domain" ] && { echo "Usage: $0 remove <domain>"; exit 1; }
    current=$(api GET "sites/$SITE_ID" | python3 -c "import json,sys; print(','.join(json.load(sys.stdin).get('domain_aliases') or []))")
    new=$(python3 -c "import sys; print(','.join(d for d in sys.argv[1].split(',') if d and d != sys.argv[2]))" "$current" "$domain")
    aliases_json=$(python3 -c "import json,sys; print(json.dumps([d for d in sys.argv[1].split(',') if d]))" "$new")
    api PATCH "sites/$SITE_ID" "{\"domain_aliases\": $aliases_json}" >/dev/null
    echo "Removed alias: $domain"
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Usage: $0 {list|add <domain>|remove <domain>}"
    exit 1
    ;;
esac
