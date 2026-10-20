import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

async function resolveRepoRoot(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), ".."),
    "/config/Agents_for_Impact_CH5",
  ];
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(path.join(dir, "scripts", "run_single_plan.py"));
      if (stat.isFile()) return dir;
    } catch {
      // continue
    }
  }
  return path.resolve(process.cwd(), "..");
}

export async function POST() {
  const startTime = Date.now();
  try {
    const repoRoot = await resolveRepoRoot();
    const venvPython = path.join(repoRoot, ".venv", "bin", "python");
    const scriptPath = path.join(repoRoot, "scripts", "run_single_plan.py");

    const { stdout, stderr } = await execFileAsync(
      venvPython,
      [scriptPath],
      {
        cwd: repoRoot,
        timeout: 45000,
        env: {
          ...process.env,
          PYTHONPATH: repoRoot,
        },
      }
    );

    const latestJsonPath = path.join(repoRoot, "runs", "latest.json");
    const raw = await fs.readFile(latestJsonPath, "utf-8");
    const latestRun = JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startTime,
      stdout,
      latestRun,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 }
    );
  }
}
