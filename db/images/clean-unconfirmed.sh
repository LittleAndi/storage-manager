#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <storageAccountName> <containerName> [--dry-run]"
  exit 1
}

[ $# -lt 2 ] && usage

ACCOUNT_NAME="$1"
CONTAINER_NAME="$2"
shift 2

DRY_RUN=false
if [ "${1-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

command -v az >/dev/null 2>&1 || { echo "Azure CLI (az) not found in PATH"; exit 2; }

echo "Listing unconfirmed blobs in container '$CONTAINER_NAME' (account: $ACCOUNT_NAME)..."
mapfile -t BLOBS < <(az storage blob list \
  --account-name "$ACCOUNT_NAME" \
  --container-name "$CONTAINER_NAME" \
  --include m \
  --query "[?metadata.status=='unconfirmed'].name" \
  -o tsv)

if [ ${#BLOBS[@]} -eq 0 ]; then
  echo "No unconfirmed blobs found."
  exit 0
fi

echo "Found ${#BLOBS[@]} blob(s)."
$DRY_RUN && echo "--dry-run enabled; no deletions will occur."

for blob in "${BLOBS[@]}"; do
  echo "Deleting $blob ..."
  if ! $DRY_RUN; then
    # az storage blob delete \
    #   --account-name "$ACCOUNT_NAME" \
    #   --container-name "$CONTAINER_NAME" \
    #   --name "$blob"
    echo "$blob"
  fi
done

echo "Done."
