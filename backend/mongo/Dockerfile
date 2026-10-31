# MongoDB with this app's scripts built in. Baked into the image rather than bind-mounted,
# because Coolify deploys from a helper container and can't mount files from the repository.
#   entrypoint.sh   sets root and the API's user from the environment, then starts MongoDB
#   set-users.js    creates or updates both users (the API's: readWrite on its database only)
#   healthcheck.sh  healthy only when the API's user can sign in
#   backup.sh       the nightly dump (the mongo-backup service)
FROM mongo:8.0
COPY --chmod=0644 set-users.js /usr/local/share/mongo/set-users.js
COPY --chmod=0755 entrypoint.sh healthcheck.sh backup.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["mongod"]
