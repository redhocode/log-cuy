import sql from "mssql";
import dotenv from "dotenv";
import pino from "pino";
import pretty from "pino-pretty";
dotenv.config();
// Create a Pino logger instance
const logger = pino({ level: process.env.LOG_LEVEL || 'info' }, pretty());
const config = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "",
  port: 1433,
  database: process.env.DB_DATABASE ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
let poolPromise: Promise<sql.ConnectionPool> | undefined;

export const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        logger.info("Connected to MSSQL");
        return pool;
      })
      .catch((err) => {
        logger.error("Database connection failed: ", err);
        throw err;
      });
  }
  return poolPromise;
};
