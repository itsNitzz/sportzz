import "dotenv/config.js";

if (!process.env.DATABASE_URL) throw new Error("database url is undefined.");

const port = process.env.PORT === undefined ? 8000 : Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: port,
  HOST: process.env.HOST || "0.0.0.0",
};

export default CONFIG;
