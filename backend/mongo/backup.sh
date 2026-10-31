#!/bin/sh
# Nightly dump of the portfolio database into /backups (the mongo-backups volume),
# keeping the newest $BACKUP_KEEP files. Runs as the API's own user: it can read
# the portfolio database and nothing else.
set -eu

KEEP="${BACKUP_KEEP:-14}"
AT="${BACKUP_AT_UTC:-21:00}" # 21:00 UTC is 02:30 in India: the quietest hour

backup() {
  file="/backups/portfolio-$(date -u +%Y-%m-%dT%H%M%SZ).gz"
  # Written under a temporary name first, so a half-written dump never looks like a good one.
  if mongodump --host mongo --port 27017 --username "$MONGO_APP_USERNAME" --password "$MONGO_APP_PASSWORD" \
      --authenticationDatabase portfolio --db portfolio --gzip --archive="$file.part" --quiet; then
    mv "$file.part" "$file"
    echo "backup: wrote $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.part"
    echo "backup: FAILED, keeping the previous dumps" >&2
  fi
  # Oldest first out, beyond the newest $KEEP.
  ls -1t /backups/portfolio-*.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
}

# One straight away, so a fresh deploy has a copy before its first night.
backup
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "today $AT" +%s)
  [ "$next" -gt "$now" ] || next=$((next + 86400))
  echo "backup: next at $(date -u -d "@$next" +%Y-%m-%dT%H:%MZ)"
  sleep $((next - now))
  backup
done
