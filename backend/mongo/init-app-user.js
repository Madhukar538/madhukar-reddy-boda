// Runs once, when the MongoDB data volume is first created (docker-entrypoint-initdb.d).
// Creates the API's own user, allowed to read and write its database and nothing else.
// The root user (MONGO_INITDB_ROOT_*) is only for admin work by hand; the API never uses it.
const database = process.env.MONGO_APP_DATABASE || 'portfolio';
const username = process.env.MONGO_APP_USERNAME;
const password = process.env.MONGO_APP_PASSWORD;
if (!username || !password) {
  throw new Error('MONGO_APP_USERNAME and MONGO_APP_PASSWORD must be set.');
}
db.getSiblingDB(database).createUser({
  user: username,
  pwd: password,
  roles: [{ role: 'readWrite', db: database }],
});
print(`Created user "${username}" with readWrite on "${database}".`);
