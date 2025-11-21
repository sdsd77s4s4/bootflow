#!/usr/bin/env bash
# Bash script to get token and run insert + get against Supabase REST
# Usage (non-interactive):
#   export PROJECT_URL="https://<PROJECT>.supabase.co"
#   export ANON_KEY="<ANON_PUBLIC_KEY>"
#   export TEST_EMAIL="cliente@test.local"
#   export TEST_PASSWORD="Senha123!"
#   ./supabase/automation/run_tests.sh

set -euo pipefail

PROJECT_URL=${PROJECT_URL:-}
ANON_KEY=${ANON_KEY:-}
TEST_EMAIL=${TEST_EMAIL:-}
TEST_PASSWORD=${TEST_PASSWORD:-}

if [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$TEST_EMAIL" ] || [ -z "$TEST_PASSWORD" ]; then
  echo "Missing environment variables. Set PROJECT_URL, ANON_KEY, TEST_EMAIL, TEST_PASSWORD." >&2
  exit 2
fi

# obtain token
echo "Obtendo token para $TEST_EMAIL..."
TOKEN_JSON=$(curl -s -X POST "$PROJECT_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$TOKEN_JSON" | jq -r '.access_token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to obtain access_token:" >&2
  echo "$TOKEN_JSON" >&2
  exit 3
fi

echo "Token obtido."

# insert cobranca
echo "Enviando POST /rest/v1/cobrancas ..."
INSERT_RESP=$(curl -s -X POST "$PROJECT_URL/rest/v1/cobrancas" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cliente_id\":\"$TEST_EMAIL\",\"valor\":19.90,\"data_vencimento\":\"$(date -d "+7 days" +%Y-%m-%d)\",\"status\":\"pendente\",\"descricao\":\"Teste RLS automático\"}")

echo "INSERT response:"
echo "$INSERT_RESP" | jq .

# list cobrancas
echo "Consultando /rest/v1/cobrancas ..."
LIST_RESP=$(curl -s -X GET "$PROJECT_URL/rest/v1/cobrancas" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN")

echo "$LIST_RESP" | jq .

echo "Teste automático concluído."
