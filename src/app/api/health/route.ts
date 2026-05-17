import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "dhivihr-web",
    time: new Date().toISOString(),
  });
}
