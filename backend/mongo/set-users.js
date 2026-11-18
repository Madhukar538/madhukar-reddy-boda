// Sets root and the API's user from the environment: created if missing, password and roles
// updated if present. Run by entrypoint.sh on a private server with no access control, before
// MongoDB starts for real, so the passwords in Coolify are always the ones that work.
function upsert(database, user, pwd, roles) {
  const target = db.getSiblingDB(database);
  if (target.getUser(user)) {
    target.updateUser(user, { pwd, roles });
    print(`set-users: "${user}" (${database}) updated from the environment.`);
  } else {
    target.createUser({ user, pwd, roles });
    print(`set-users: "${user}" (${database}) created.`);
  }
}

const env = process.env;
for (const name of ['MONGO_INITDB_ROOT_USERNAME', 'MONGO_INITDB_ROOT_PASSWORD', 'MONGO_APP_USERNAME', 'MONGO_APP_PASSWORD']) {
  if (!env[name]) throw new Error(`${name} must be set.`);
}
const appDatabase = env.MONGO_APP_DATABASE || 'portfolio';
upsert('admin', env.MONGO_INITDB_ROOT_USERNAME, env.MONGO_INITDB_ROOT_PASSWORD, [{ role: 'root', db: 'admin' }]);
// The API's user: its own database, plus every other site's (site_<slug>, made when a site is added)
// through readWriteAnyDatabase, which covers application databases but not admin, config or local.
// Nothing else lives in this MongoDB, so new sites work without a manual grant, and the nightly
// backup (backup.sh, as this user) can dump them all.
upsert(appDatabase, env.MONGO_APP_USERNAME, env.MONGO_APP_PASSWORD, [
  { role: 'readWrite', db: appDatabase },
  { role: 'readWriteAnyDatabase', db: 'admin' },
]);
