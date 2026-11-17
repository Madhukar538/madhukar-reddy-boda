# Copies the nightly database dumps off the server (see offsite.sh).
FROM rclone/rclone:1.68.2
COPY offsite.sh /usr/local/bin/offsite.sh
RUN chmod +x /usr/local/bin/offsite.sh
ENTRYPOINT ["/usr/local/bin/offsite.sh"]
