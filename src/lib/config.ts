/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/config.ts
import sql from "mssql";
import dotenv from "dotenv";
import pino from "pino";
import pretty from "pino-pretty";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const logger = pino({ level: process.env.LOG_LEVEL || "info" }, pretty());

// Interface untuk konfigurasi database
interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  port: number;
  database: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    connectTimeout: number;
    requestTimeout: number;
    pool: {
      max: number;
      min: number;
      idleTimeoutMillis: number;
    };
  };
}

// Konfigurasi untuk setiap database
const config: DatabaseConfig = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "",
  port: 1433,
  database: process.env.DB_DATABASE ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

const loginConfig: DatabaseConfig = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "",
  port: 1433,
  database: process.env.DB_DATABASE2 ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

const absensiConfig: DatabaseConfig = {
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  server: process.env.DB_SERVER ?? "",
  port: 1433,
  database: process.env.DB_DATABASE3 ?? "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
};

// PERBAIKAN: Gunakan tipe dari mssql untuk hasil query
export type QueryResult = sql.IResult<any>;

// PERBAIKAN: Gunakan variable terpisah untuk setiap pool dengan TypeScript
let poolPromiseDefault: Promise<sql.ConnectionPool> | undefined;
let poolPromiseLogin: Promise<sql.ConnectionPool> | undefined;
let poolPromiseAbsensi: Promise<sql.ConnectionPool> | undefined;

// Interface untuk parameter query
interface QueryParams {
  [key: string]: any;
}

// Helper function untuk create pool dengan error handling
const createPool = async (
  config: DatabaseConfig,
  poolName: string
): Promise<sql.ConnectionPool> => {
  try {
    const pool = new sql.ConnectionPool(config);
    const connectedPool = await pool.connect();

    // Setup error handler untuk pool
    connectedPool.on("error", (err: sql.ConnectionError) => {
      // PERBAIKAN: Gunakan string template untuk menggabungkan pesan dan error
      logger.error(`❌ [${poolName}] Database pool error: ${err.message}`);
      // Reset pool ketika error
      if (poolName === "default") poolPromiseDefault = undefined;
      if (poolName === "login") poolPromiseLogin = undefined;
      if (poolName === "absensi") poolPromiseAbsensi = undefined;
    });

    logger.info(`✅ [${poolName}] Connected to MSSQL: ${config.database}`);
    return connectedPool;
  } catch (err) {
    // PERBAIKAN: Gunakan string template untuk error juga
    const error = err as Error;
    logger.error(
      `❌ [${poolName}] Database connection failed: ${error.message}`
    );
    throw err;
  }
};

// Pool untuk database default
export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromiseDefault) {
    poolPromiseDefault = createPool(config, "default");
  }

  try {
    const pool = await poolPromiseDefault;
    // Test connection
    await pool.request().query("SELECT 1 as test");
    return pool;
  } catch (error) {
    // Jika test gagal, buat koneksi baru
    logger.warn(`🔄 [default] Reconnecting to database...`);
    poolPromiseDefault = createPool(config, "default");
    return poolPromiseDefault;
  }
};

// Pool untuk database login
export const getPoolLogin = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromiseLogin) {
    poolPromiseLogin = createPool(loginConfig, "login");
  }

  try {
    const pool = await poolPromiseLogin;
    // Test connection
    await pool.request().query("SELECT 1 as test");
    return pool;
  } catch (error) {
    logger.warn(`🔄 [login] Reconnecting to database...`);
    poolPromiseLogin = createPool(loginConfig, "login");
    return poolPromiseLogin;
  }
};

// Pool untuk database absensi
export const getPoolAbsensi = async (): Promise<sql.ConnectionPool> => {
  if (!poolPromiseAbsensi) {
    poolPromiseAbsensi = createPool(absensiConfig, "absensi");
  }

  try {
    const pool = await poolPromiseAbsensi;
    // Test connection
    await pool.request().query("SELECT 1 as test");
    return pool;
  } catch (error) {
    logger.warn(`🔄 [absensi] Reconnecting to database...`);
    poolPromiseAbsensi = createPool(absensiConfig, "absensi");
    return poolPromiseAbsensi;
  }
};

// Type untuk pool type
type PoolType = "default" | "login" | "absensi";

// PERBAIKAN: Helper function untuk execute query dengan retry mechanism
export const executeQuery = async (
  query: string,
  params: QueryParams = {},
  poolType: PoolType = "default"
): Promise<QueryResult> => {
  let pool: sql.ConnectionPool;

  switch (poolType) {
    case "login":
      pool = await getPoolLogin();
      break;
    case "absensi":
      pool = await getPoolAbsensi();
      break;
    default:
      pool = await getPool();
  }

  try {
    const request = pool.request();

    // Add parameters jika ada
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });

    const result = await request.query(query);
    return result;
  } catch (error) {
    const dbError = error as sql.ConnectionError;
    // PERBAIKAN: Gunakan string template untuk error
    logger.error(`❌ [${poolType}] Query execution failed: ${dbError.message}`);

    // Jika error connection, coba sekali lagi dengan fresh connection
    if (
      dbError.code === "ECONNCLOSED" ||
      dbError.message?.includes("Connection is closed")
    ) {
      logger.warn(`🔄 [${poolType}] Retrying query with fresh connection...`);

      // Reset pool yang bermasalah
      switch (poolType) {
        case "login":
          poolPromiseLogin = undefined;
          pool = await getPoolLogin();
          break;
        case "absensi":
          poolPromiseAbsensi = undefined;
          pool = await getPoolAbsensi();
          break;
        default:
          poolPromiseDefault = undefined;
          pool = await getPool();
      }

      const retryRequest = pool.request();
      Object.keys(params).forEach((key) => {
        retryRequest.input(key, params[key]);
      });

      return await retryRequest.query(query);
    }

    throw error;
  }
};

// Fungsi untuk close semua connections
export const closeAllPools = async (): Promise<void> => {
  try {
    const closePromises: Promise<void>[] = [];

    if (poolPromiseDefault) {
      closePromises.push(
        poolPromiseDefault
          .then((pool) => {
            pool.close();
            poolPromiseDefault = undefined;
            logger.info("🔒 [default] Database connection closed");
          })
          .catch((error) => {
            // PERBAIKAN: Gunakan string template
            const err = error as Error;
            logger.error(`Error closing default pool: ${err.message}`);
          })
      );
    }

    if (poolPromiseLogin) {
      closePromises.push(
        poolPromiseLogin
          .then((pool) => {
            pool.close();
            poolPromiseLogin = undefined;
            logger.info("🔒 [login] Database connection closed");
          })
          .catch((error) => {
            const err = error as Error;
            logger.error(`Error closing login pool: ${err.message}`);
          })
      );
    }

    if (poolPromiseAbsensi) {
      closePromises.push(
        poolPromiseAbsensi
          .then((pool) => {
            pool.close();
            poolPromiseAbsensi = undefined;
            logger.info("🔒 [absensi] Database connection closed");
          })
          .catch((error) => {
            const err = error as Error;
            logger.error(`Error closing absensi pool: ${err.message}`);
          })
      );
    }

    await Promise.allSettled(closePromises);
  } catch (error) {
    const err = error as Error;
    logger.error(`Error closing database connections: ${err.message}`);
  }
};

// Export untuk backward compatibility (jika ada code yang masih menggunakan getPool2)
export const getPool2 = getPoolAbsensi;
