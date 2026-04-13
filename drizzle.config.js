const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  schema: isProduction ? "./dist/drizzle/schema.js" : "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
