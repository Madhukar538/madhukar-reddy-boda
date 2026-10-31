#!/bin/sh
# Healthy only when the API's own user can sign in, so the API never starts against a
# database it can't use.
exec mongosh --quiet \
  "mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}@localhost:27017/${MONGO_APP_DATABASE:-portfolio}?authSource=${MONGO_APP_DATABASE:-portfolio}" \
  --eval 'db.runCommand({ ping: 1 }).ok' >/dev/null
