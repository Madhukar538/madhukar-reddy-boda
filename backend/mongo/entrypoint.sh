#!/bin/bash
# Before MongoDB starts for real, sets the root and API users from the environment, so the
# passwords in Coolify are always the ones that work: on a new volume, an old one, or after
# either password changes (no old password needed). This happens on a private server with no
# access control, bound to 127.0.0.1:27018 inside this container, for a few seconds. Then the
# official entrypoint starts MongoDB as usual, with access control on (--auth).
set -euo pipefail

prep_log=/tmp/set-users-mongod.log
mongod_as_owner() { if [ "$(id -u)" = 0 ]; then gosu mongodb mongod "$@"; else mongod "$@"; fi; }

if [ "$(id -u)" = 0 ]; then
  # The data must belong to the mongodb user, as the official entrypoint ensures too.
  find -L /data/db /data/configdb \! -user mongodb -exec chown mongodb '{}' +
fi

mongod_as_owner --dbpath /data/db --bind_ip 127.0.0.1 --port 27018 --wiredTigerCacheSizeGB 0.25 \
  --fork --logpath "$prep_log" >/dev/null
for _ in $(seq 1 60); do
  mongosh --quiet --port 27018 --eval 'db.adminCommand({ ping: 1 }).ok' >/dev/null 2>&1 && break
  sleep 1
done
if ! mongosh --quiet --port 27018 /usr/local/share/mongo/set-users.js; then
  echo "set-users: failed; see $prep_log" >&2
  mongod_as_owner --dbpath /data/db --shutdown >/dev/null || true
  exit 1
fi
mongod_as_owner --dbpath /data/db --shutdown >/dev/null

# The volume is now initialised with both users, so the official entrypoint skips its own
# first-start setup and just starts mongod with --auth.
exec /usr/local/bin/docker-entrypoint.sh "$@"
