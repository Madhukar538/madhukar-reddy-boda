#!/bin/bash
# Starts MongoDB exactly as the official image does (which creates the root user on a new
# volume), then, once the real server is up, makes sure the API's user matches the environment.
set -u

/usr/local/bin/docker-entrypoint.sh "$@" &
mongo_pid=$!
trap 'kill -TERM "$mongo_pid" 2>/dev/null' TERM INT

# Where the image's temporary first-start server keeps its pid file (TMPDIR is usually unset).
temp_pidfile="${TMPDIR:-}/docker-entrypoint-temp-mongod.pid"
root_failures=0
for _ in $(seq 1 150); do
  kill -0 "$mongo_pid" 2>/dev/null || break
  # Wait for the real server, not the temporary one the image runs while creating root.
  if [ -e "$temp_pidfile" ] || ! mongosh --quiet --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1; then
    sleep 2
    continue
  fi
  if mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
      --authenticationDatabase admin /usr/local/share/mongo/ensure-app-user.js; then
    break
  fi
  # Allow for the moment between the first start and the restart that follows it.
  root_failures=$((root_failures + 1))
  if [ "$root_failures" -ge 30 ]; then
    echo "ensure-app-user: can't sign in as root. MONGO_ROOT_PASSWORD must be the one this volume was" \
      "first created with; if the volume has no data yet, remove the mongo-data volume and redeploy." >&2
    break
  fi
  sleep 2
done

# Exit with mongod's own status. A stop signal interrupts "wait" while mongod is still shutting
# down, so keep waiting until it has really gone.
status=0
while kill -0 "$mongo_pid" 2>/dev/null; do
  wait "$mongo_pid"
  status=$?
done
exit "$status"
