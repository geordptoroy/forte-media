module.exports = {
  schema: "./dist/drizzle/schema.js",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
