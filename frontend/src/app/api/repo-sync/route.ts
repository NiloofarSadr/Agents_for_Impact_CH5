import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function resolveRepoRoot(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), ".."),
    "/config/Agents_for_Impact_CH5",
  ];
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(path.join(dir, "docs", "HANDOFF.md"));
      if (stat.isFile()) return dir;
    } catch {
      // continue
    }
  }
  return "/config/Agents_for_Impact_CH5";
}

export async function GET() {
  try {
    const repoRoot = await resolveRepoRoot();

    // 1. Read Git metadata
    let branch = "frontend";
    let lastCommit = {
      hash: "unknown",
      subject: "",
      date: "",
      author: "",
    };
    try {
      const { stdout: branchOut } = await execFileAsync(
        "git",
        ["-C", repoRoot, "rev-parse", "--abbrev-ref", "HEAD"],
        { timeout: 3000 }
      );
      branch = branchOut.trim();

      const { stdout: logOut } = await execFileAsync(
        "git",
        ["-C", repoRoot, "log", "-1", "--format=%h|%s|%ci|%an"],
        { timeout: 3000 }
      );
      const [hash, subject, date, author] = logOut.trim().split("|");
      lastCommit = { hash, subject, date, author };
    } catch {
      // Ignore git CLI errors in restricted environments
    }

    // 2. Read docs/HANDOFF.md, docs/findings.md, docs/scoring.md
    const readSafe = async (relPath: string) => {
      try {
        return await fs.readFile(path.join(repoRoot, relPath), "utf-8");
      } catch {
        return "";
      }
    };

    const [handoffMd, findingsMd, scoringMd, contractPy, latestRunRaw] =
      await Promise.all([
        readSafe("docs/HANDOFF.md"),
        readSafe("docs/findings.md"),
        readSafe("docs/scoring.md"),
        readSafe("agent/contract.py"),
        readSafe("runs/latest.json"),
      ]);

    let latestRun = null;
    try {
      if (latestRunRaw) latestRun = JSON.parse(latestRunRaw);
    } catch {
      // ignore JSON parse failure
    }

    // 3. Read all SQL files in sql/
    const sqlDir = path.join(repoRoot, "sql");
    const sqlFiles: Record<string, string> = {};
    try {
      const entries = await fs.readdir(sqlDir);
      await Promise.all(
        entries
          .filter((name) => name.endsWith(".sql"))
          .map(async (name) => {
            sqlFiles[name] = await fs.readFile(path.join(sqlDir, name), "utf-8");
          })
      );
    } catch {
      // ignore if sql directory missing
    }

    return NextResponse.json({
      ok: true,
      repoRoot,
      syncedAt: new Date().toISOString(),
      git: {
        branch,
        lastCommit,
        remoteUrl: "https://github.com/NiloofarSadr/Agents_for_Impact_CH5",
      },
      docs: {
        handoffMd,
        findingsMd,
        scoringMd,
      },
      contractPy,
      latestRun,
      sqlFiles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to read repo",
      },
      { status: 500 }
    );
  }
}
