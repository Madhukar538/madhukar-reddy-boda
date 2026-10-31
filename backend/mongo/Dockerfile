# MongoDB with this app's scripts built in: the first-start user script and the nightly backup.
# Baked into the image rather than bind-mounted, because Coolify deploys from a helper
# container and can't mount files from the repository (they arrive as empty folders).
FROM mongo:8.0
COPY --chmod=0644 init-app-user.js /docker-entrypoint-initdb.d/init-app-user.js
COPY --chmod=0755 backup.sh /usr/local/bin/backup.sh
