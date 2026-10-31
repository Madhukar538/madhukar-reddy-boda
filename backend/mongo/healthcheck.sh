#!/bin/sh
# Healthy only when the API's own user can sign in, so the API never starts against a
# database it can't use. Credentials as options, not in a URL, so any password works.
exec mongosh --quiet --port 27017 \
  --username "$MONGO_APP_USERNAME" --password "$MONGO_APP_PASSWORD" \
  --authenticationDatabase "${MONGO_APP_DATABASE:-portfolio}" \
  --eval 'db.runCommand({ ping: 1 }).ok' >/dev/null
