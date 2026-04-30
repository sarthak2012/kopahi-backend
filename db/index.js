/*
 * Storage layer index.
 *
 * Routes/controllers must import data-access functions ONLY from this folder.
 * They must NOT touch Mongoose models, ObjectIds, or driver-specific calls
 * directly. That isolation is what makes the future Postgres swap mechanical:
 * rewrite the files in this folder against pg/Prisma/Drizzle and the rest of
 * the codebase keeps working unchanged.
 *
 * See POSTGRES_MIGRATION.md at the repo root for the migration playbook.
 */

module.exports = {
  users: require("./users"),
  products: require("./products"),
  orders: require("./orders"),
  categories: require("./categories"),
  leads: require("./leads"),
};
