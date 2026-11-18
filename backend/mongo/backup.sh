#!/bin/sh
# Nightly dump of every site's database (portfolio, and site_<slug> for each other site)
# into one archive in /backups (the mongo-backups volume), keeping the newest $BACKUP_KEEP
# files. Runs as the API's own user, which can read the application databases but not
# MongoDB's own admin, config and local.
#
# Every dump is then restore-checked: restored into a throwaway MongoDB inside this
# container (never the live one), and every collection of every database the live server
# had must come back. The outcome goes to /status (the backup-status volume) for Admin → Traffic:
#   backup.json        the last attempt: when, and whether it was good
#   backup-good.json   the last dump that restored cleanly: when, file, size, databases, collections, documents
# BACKUP_ONCE=1 runs one backup and check, then exits (the CI drill uses it).
set -eu

KEEP="${BACKUP_KEEP:-14}"
AT="${BACKUP_AT_UTC:-21:00}" # 21:00 UTC is 02:30 in India: the quietest hour
STATUS=/status
SCRATCH_PORT=27099

live() {
  mongosh --quiet --host mongo --port 27017 --username "$MONGO_APP_USERNAME" --password "$MONGO_APP_PASSWORD" \
    --authenticationDatabase portfolio portfolio "$@"
}

# Written whole under a temporary name, then moved: the API never reads half a file.
write_status() {
  mkdir -p "$STATUS"
  printf '%s\n' "$2" > "$STATUS/$1.tmp" && mv "$STATUS/$1.tmp" "$STATUS/$1"
}

attempt() { # isOk message
  write_status backup.json "{\"at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"isOk\":$1,\"message\":\"$2\"}"
}

# Restores $1 into a throwaway mongod and checks every collection named in $EXPECTED came back.
# Prints the backup-good.json document on success; returns non-zero with the reason on stderr otherwise.
# Every application database's collections, as db.collection, sorted and comma-separated.
LIST_COLLECTIONS='
  const skip = ["admin", "config", "local"];
  const names = db.adminCommand({ listDatabases: 1, nameOnly: true }).databases
    .map((d) => d.name).filter((n) => !skip.includes(n))
    .flatMap((n) => db.getSiblingDB(n).getCollectionNames().filter((c) => !c.startsWith("system.")).map((c) => n + "." + c));
  print(names.sort().join(","));'

restore_check() {
  dir=$(mktemp -d /tmp/restore-check.XXXXXX)
  ok=0
  if mongod --dbpath "$dir" --port "$SCRATCH_PORT" --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25 \
      --fork --logpath "$dir/mongod.log" >/dev/null; then
    if mongorestore --host 127.0.0.1 --port "$SCRATCH_PORT" --gzip --archive="$1" --quiet; then
      FILE="$(basename "$1")" BYTES="$(stat -c %s "$1")" \
      mongosh --quiet --host 127.0.0.1 --port "$SCRATCH_PORT" portfolio --eval '
        const skip = ["admin", "config", "local"];
        const expected = (process.env.EXPECTED || "").split(",").filter(Boolean);
        const databases = db.adminCommand({ listDatabases: 1, nameOnly: true }).databases.map((d) => d.name).filter((n) => !skip.includes(n));
        const names = databases.flatMap((n) => db.getSiblingDB(n).getCollectionNames().filter((c) => !c.startsWith("system.")).map((c) => n + "." + c));
        const missing = expected.filter((n) => !names.includes(n));
        if (missing.length > 0) { console.error("missing after restore: " + missing.join(", ")); quit(1); }
        const documents = names.reduce((sum, n) => { const [d, ...c] = n.split("."); return sum + db.getSiblingDB(d).getCollection(c.join(".")).countDocuments(); }, 0);
        print(JSON.stringify({ at: new Date().toISOString(), file: process.env.FILE, bytes: Number(process.env.BYTES), databases: databases.length, collections: names.length, documents }));
      ' && ok=1
    else
      echo "backup: restore of $1 FAILED" >&2
    fi
    mongod --dbpath "$dir" --shutdown >/dev/null 2>&1 || true
  else
    echo "backup: could not start the throwaway MongoDB for the restore check" >&2
  fi
  rm -rf "$dir"
  [ "$ok" = 1 ]
}

backup() {
  file="/backups/portfolio-$(date -u +%Y-%m-%dT%H%M%SZ).gz"
  # The collections there are now, in every site's database: each must come back from the dump.
  if ! EXPECTED=$(live --eval "$LIST_COLLECTIONS"); then
    echo "backup: FAILED, could not reach the database" >&2
    attempt false "Could not reach the database."
    return 0
  fi
  export EXPECTED
  # Written under a temporary name first, so a half-written dump never looks like a good one.
  if mongodump --host mongo --port 27017 --username "$MONGO_APP_USERNAME" --password "$MONGO_APP_PASSWORD" \
      --authenticationDatabase portfolio --gzip --archive="$file.part" --quiet \
      --nsExclude 'admin.*' --nsExclude 'config.*' --nsExclude 'local.*'; then
    mv "$file.part" "$file"
    echo "backup: wrote $file ($(du -h "$file" | cut -f1))"
    if good=$(restore_check "$file"); then
      write_status backup-good.json "$good"
      attempt true "Dumped and restore-checked."
      echo "backup: restore check passed: $good"
    else
      # Kept, in case it is still useful, but not counted as good.
      attempt false "The dump did not restore cleanly."
      echo "backup: restore check FAILED for $file" >&2
    fi
  else
    rm -f "$file.part"
    attempt false "The dump failed."
    echo "backup: FAILED, keeping the previous dumps" >&2
  fi
  # Oldest first out, beyond the newest $KEEP.
  ls -1t /backups/portfolio-*.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
}

# One straight away, so a fresh deploy has a copy before its first night.
backup
[ "${BACKUP_ONCE:-}" = 1 ] && exit 0
while true; do
  now=$(date -u +%s)
  next=$(date -u -d "today $AT" +%s)
  [ "$next" -gt "$now" ] || next=$((next + 86400))
  echo "backup: next at $(date -u -d "@$next" +%Y-%m-%dT%H:%MZ)"
  sleep $((next - now))
  backup
done
