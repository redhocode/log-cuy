import { NextResponse } from "next/server";
import { getPoolLogin } from "@/lib/config"; // Pastikan ini sesuai dengan cara Anda mengimpor koneksi
import sql from "mssql";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log("Received data:", { username, password });

    const pool = await getPoolLogin();
    console.log("Connected to database");

    const result = await pool
      .request()
      .input("UserName", sql.VarChar, username)
      .query("SELECT * FROM [MenuCP].[dbo].[taUser] WHERE UserName = @UserName");

    const user = result.recordset[0];
    console.log("User data from database:", user);

    if (!user) {
      console.log("No user found");
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    console.log("Comparing passwords:", {
      dbPassword: user.Password,
      inputPassword: password,
    });

    if (user.Password !== password) {
      console.log("Password mismatch");
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Login successful", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error querying database:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
