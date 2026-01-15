/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// ./src/app/api/kunci/route.ts - DIPERBAIKI
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/config";

interface DatabaseRecord {
  name: string;
  LockDate: Date | null;
}

interface KunciResponse {
  name: string;
  LockDate: string | null;
}

interface UpdateRequest {
  name: string;
  LockDate?: string | null;
}

// ============================================
// PUT /api/kunci - VERSI DIPERBAIKI
// ============================================
export async function PUT(request: Request) {
  console.log("\n" + "=".repeat(50));
  console.log("[API Kunci] PUT REQUEST RECEIVED");
  console.log("=".repeat(50));

  try {
    // Log semua headers untuk debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("[Headers]:", JSON.stringify(headers, null, 2));

    // Check if request has body
    const contentLength =
      headers["content-length"] || headers["Content-Length"];
    console.log("[Content-Length]:", contentLength);

    // Read body text
    let bodyText = "";
    try {
      bodyText = await request.text();
      console.log("[Raw Body Text]:", bodyText);
      console.log("[Body Length]:", bodyText.length);
    } catch (readError) {
      console.error("[Error reading body]:", readError);
    }

    // Check Content-Type
    const contentType = headers["content-type"] || headers["Content-Type"];
    console.log("[Content-Type]:", contentType);

    // Jika tidak ada body sama sekali
    if (!bodyText.trim()) {
      console.error("[ERROR]: Request body is empty or missing");

      return NextResponse.json(
        {
          success: false,
          error: "Request body is required",
          instructions:
            "Send JSON with: { 'name': 'string', 'LockDate': 'string|null' }",
          example: {
            name: "Produksi",
            LockDate: "2025-01-01",
          },
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Error-Type": "Missing-Body",
          },
        }
      );
    }

    // Jika ada body tapi tidak ada Content-Type
    if (
      !contentType ||
      !contentType.toLowerCase().includes("application/json")
    ) {
      console.warn("[WARNING]: Content-Type missing or not JSON");

      // Coba parse sebagai JSON meskipun Content-Type tidak JSON
      try {
        console.log("[Attempting to parse as JSON anyway...]");
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: "Content-Type must be application/json for JSON data",
            receivedContentType: contentType || "Not provided",
            hint: "Add header: Content-Type: application/json",
          },
          { status: 400 }
        );
      }
    }

    // Parse JSON
    let body: UpdateRequest;
    try {
      body = JSON.parse(bodyText);
      console.log("[Parsed Body]:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("[JSON Parse Error]:", parseError);

      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON format in request body",
          details:
            parseError instanceof Error ? parseError.message : "Unknown error",
          receivedBody:
            bodyText.substring(0, 200) + (bodyText.length > 200 ? "..." : ""),
          hint: "Ensure body is valid JSON with double quotes",
        },
        { status: 400 }
      );
    }

    const { name, LockDate } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'name' is required and must be a non-empty string",
          receivedName: name,
        },
        { status: 400 }
      );
    }

    // Parse date
    let lockDateValue: Date | null = null;

    if (LockDate !== undefined && LockDate !== null) {
      if (typeof LockDate === "string" && LockDate.trim() !== "") {
        const parsedDate = new Date(LockDate);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid date format. Use YYYY-MM-DD",
              receivedDate: LockDate,
              example: "2025-01-01",
            },
            { status: 400 }
          );
        }
        lockDateValue = parsedDate;
        console.log("[Parsed Date]:", lockDateValue.toISOString());
      }
    }

    console.log(`[Processing]: Updating ${name} to date: ${lockDateValue}`);

    // Database operation
    try {
      const pool = await getPool();
      console.log("[Database]: Connected successfully");

      const result = await pool
        .request()
        .input("name", sql.NVarChar(255), name)
        .input("lockDate", sql.Date, lockDateValue).query(`
          UPDATE [cp].[dbo].[taLockForm]
          SET LockDate = @lockDate
          WHERE Form_alias = @name
        `);

      console.log(
        "[Database]: Update executed, rows affected:",
        result.rowsAffected[0]
      );

      if (result.rowsAffected[0] === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Form with name "${name}" not found in database`,
            suggestion:
              "Check if the name exists using GET /api/kunci?name=Produksi",
          },
          { status: 404 }
        );
      }

      // Success response
      const responseData = {
        success: true,
        message: "Data updated successfully",
        data: {
          name,
          LockDate: lockDateValue
            ? lockDateValue.toISOString().split("T")[0]
            : null,
        },
        timestamp: new Date().toISOString(),
        rowsAffected: result.rowsAffected[0],
      };

      console.log("[SUCCESS]:", responseData);
      console.log("=".repeat(50) + "\n");

      return NextResponse.json(responseData, {
        headers: {
          "X-Operation": "Update-Successful",
          "X-Rows-Affected": result.rowsAffected[0].toString(),
        },
      });
    } catch (dbError) {
      console.error("[Database Error]:", dbError);

      return NextResponse.json(
        {
          success: false,
          error: "Database operation failed",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
          operation: "UPDATE taLockForm",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("\n[UNEXPECTED ERROR]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/kunci (tidak berubah)
// ============================================
export async function GET(request: Request) {
  try {
    console.log("[API Kunci] GET request");

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const lockDate = searchParams.get("LockDate");

    const pool = await getPool();

    let query = `SELECT Form_alias AS name, LockDate FROM [cp].[dbo].[taLockForm]`;
    const dbRequest = pool.request();

    if (name) {
      query += ` WHERE Form_alias = @name`;
      dbRequest.input("name", sql.NVarChar(255), name);

      if (lockDate) {
        const date = new Date(lockDate);
        if (!isNaN(date.getTime())) {
          query += ` AND CONVERT(date, LockDate) = @lockDate`;
          dbRequest.input("lockDate", sql.Date, date);
        }
      }
    }

    query += ` ORDER BY Form_alias`;

    const result = await dbRequest.query<DatabaseRecord>(query);

    const data: KunciResponse[] = result.recordset.map((row) => ({
      name: row.name,
      LockDate: row.LockDate ? row.LockDate.toISOString().split("T")[0] : null,
    }));

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("[API Kunci] GET Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS /api/kunci
// ============================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
