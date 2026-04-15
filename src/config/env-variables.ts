import "dotenv/config.js";

if (!process.env.DATABASE_URL) throw new Error("database url is undefined.");

const port = process.env.PORT === undefined ? 8000 : Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

if (!process.env.ARCJET_KEY) throw new Error("Arcjet KEY is missing.");
if (!process.env.ARCJET_ENV) throw new Error("Arcjet env is missing.");
if (!process.env.ARCJET_MODE) throw new Error("Arcjet mode is missing.");

const CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: port,
  HOST: process.env.HOST || "0.0.0.0",
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
  ARCJET_MODE: process.env.ARCJET_MODE,
};

export default CONFIG;
