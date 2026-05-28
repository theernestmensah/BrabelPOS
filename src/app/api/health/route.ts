import { NextResponse } from "next/server";
import { getRepositoryMode } from "@/lib/server/sync-repository";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "BrAbelPOS",
    repositoryMode: getRepositoryMode(),
    timestamp: new Date().toISOString(),
  });
}
