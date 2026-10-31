// Makes sure the API's own user exists, with the password and role from the environment.
// Run by entrypoint.sh on every start, as root: a fresh volume, an older volume created
// before this user existed, and a changed MONGO_APP_PASSWORD are all handled the same way.
const database = process.env.MONGO_APP_DATABASE || 'portfolio';
const username = process.env.MONGO_APP_USERNAME;
const password = process.env.MONGO_APP_PASSWORD;
if (!username || !password) {
  throw new Error('MONGO_APP_USERNAME and MONGO_APP_PASSWORD must be set.');
}
const target = db.getSiblingDB(database);
const roles = [{ role: 'readWrite', db: database }];
if (target.getUser(username)) {
  target.updateUser(username, { pwd: password, roles });
  print(`ensure-app-user: "${username}" exists; password and role set from the environment.`);
} else {
  target.createUser({ user: username, pwd: password, roles });
  print(`ensure-app-user: created "${username}" with readWrite on "${database}".`);
}
