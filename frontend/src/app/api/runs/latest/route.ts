import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

async function resolveRepoRoot(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), ".."),
    "/config/Agents_for_Impact_CH5",
  ];
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(path.join(dir, "runs"));
      if (stat.isDirectory()) return dir;
    } catch {
      // continue
    }
  }
  return path.resolve(process.cwd(), "..");
}

export async function GET() {
  try {
    const repoRoot = await resolveRepoRoot();
    const filePath = path.join(repoRoot, "runs", "latest.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    );
  }
}
