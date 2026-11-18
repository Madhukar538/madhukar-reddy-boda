#!/bin/sh
# Copies the nightly dumps in /backups (the mongo-backups volume, mounted read-only) to
# S3-compatible storage off this server: Cloudflare R2 by default. Every file is encrypted
# here, before it leaves, with OFFSITE_ENCRYPTION_PASSWORD (rclone crypt), so the bucket
# only ever holds ciphertext. Copies older than OFFSITE_KEEP_DAYS are removed from the bucket.
#
# After each copy, rclone cryptcheck confirms every dump in the bucket decrypts to exactly the
# local file, and the outcome goes to /status/offsite.json (the backup-status volume) for the admin.
#
# Idle until configured: without the OFFSITE_* settings it logs that and does nothing.
set -eu

# Written whole under a temporary name, then moved: the API never reads half a file.
status() { # isConfigured isOk message [copies]
  mkdir -p /status
  printf '{"at":"%s","isConfigured":%s,"isOk":%s,"message":"%s","copies":%s}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "$3" "${4:-0}" > /status/offsite.json.tmp \
    && mv /status/offsite.json.tmp /status/offsite.json
}

for name in OFFSITE_ENDPOINT OFFSITE_BUCKET OFFSITE_ACCESS_KEY_ID OFFSITE_SECRET_ACCESS_KEY OFFSITE_ENCRYPTION_PASSWORD; do
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "offsite: $name is not set, so nothing is copied off the server. Set the OFFSITE_* variables to turn it on."
    status false false "Not set up: the OFFSITE_* settings are missing."
    while true; do sleep 86400; done
  fi
done

EVERY_HOURS="${OFFSITE_EVERY_HOURS:-6}"
KEEP_DAYS="${OFFSITE_KEEP_DAYS:-60}"

# The bucket (an S3 remote) and, on top of it, the encrypted view the dumps are written through.
export RCLONE_CONFIG_BUCKET_TYPE=s3
export RCLONE_CONFIG_BUCKET_PROVIDER="${OFFSITE_PROVIDER:-Cloudflare}"
export RCLONE_CONFIG_BUCKET_ENDPOINT="$OFFSITE_ENDPOINT"
export RCLONE_CONFIG_BUCKET_ACCESS_KEY_ID="$OFFSITE_ACCESS_KEY_ID"
export RCLONE_CONFIG_BUCKET_SECRET_ACCESS_KEY="$OFFSITE_SECRET_ACCESS_KEY"
# A key limited to one bucket cannot create or list buckets: don't try.
export RCLONE_CONFIG_BUCKET_NO_CHECK_BUCKET=true
export RCLONE_CONFIG_SEALED_TYPE=crypt
export RCLONE_CONFIG_SEALED_REMOTE="bucket:$OFFSITE_BUCKET/portfolio"
# File names stay readable (they are only dates); the contents are encrypted.
export RCLONE_CONFIG_SEALED_FILENAME_ENCRYPTION=off
export RCLONE_CONFIG_SEALED_DIRECTORY_NAME_ENCRYPTION=false
RCLONE_CONFIG_SEALED_PASSWORD="$(rclone obscure "$OFFSITE_ENCRYPTION_PASSWORD")"
export RCLONE_CONFIG_SEALED_PASSWORD

copy() {
  # Only finished dumps (a dump being written is still *.part); a name already there is never rewritten.
  if ! rclone copy /backups sealed: --include 'portfolio-*.{tar,gz}' --immutable --quiet; then
    echo "offsite: copy FAILED, will retry in ${EVERY_HOURS}h" >&2
    status true false "The copy failed; retrying in ${EVERY_HOURS}h."
    return 0
  fi
  copies=$(rclone lsf sealed: --include 'portfolio-*.{tar,gz}' | wc -l | tr -d ' ')
  # Each local dump must be in the bucket and decrypt to the same bytes (checked by hash, no download).
  if rclone cryptcheck /backups sealed: --one-way --include 'portfolio-*.{tar,gz}' --quiet; then
    echo "offsite: copied and verified, $copies dumps in the bucket"
    status true true "Copied and verified." "$copies"
  else
    echo "offsite: verification FAILED: a copy in the bucket does not match its dump" >&2
    status true false "A copy in the bucket does not match its dump." "$copies"
  fi
  rclone delete sealed: --include 'portfolio-*.{tar,gz}' --min-age "${KEEP_DAYS}d" --quiet \
    || echo "offsite: removing copies older than ${KEEP_DAYS} days FAILED" >&2
}

while true; do
  copy
  sleep $((EVERY_HOURS * 3600))
done
