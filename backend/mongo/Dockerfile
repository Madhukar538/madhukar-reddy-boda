# MongoDB with this app's scripts built in. Baked into the image rather than bind-mounted,
# because Coolify deploys from a helper container and can't mount files from the repository.
#   entrypoint.sh       starts MongoDB, then keeps the API's user in step with the environment
#   ensure-app-user.js  creates or updates that user (readWrite on its database only)
#   healthcheck.sh      healthy only when the API's user can sign in
#   backup.sh           the nightly dump (the mongo-backup service)
FROM mongo:8.0
COPY --chmod=0644 ensure-app-user.js /usr/local/share/mongo/ensure-app-user.js
COPY --chmod=0755 entrypoint.sh healthcheck.sh backup.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["mongod"]
