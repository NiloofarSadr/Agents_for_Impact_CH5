import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import fs from "fs/promises";
import path from "path";

const FINAL_4_TRACTS = [
  "13121010125",
  "13121006900",
  "13121011307",
  "13121009405",
];

const INSPECTED_TRACTS = [...FINAL_4_TRACTS, "13121011431"];

async function resolveSqlDir(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), "..", "sql"),
    "/config/Agents_for_Impact_CH5/sql",
  ];
  for (const dir of candidates) {
    try {
      const stat = await fs.stat(path.join(dir, "rank_tracts_plan_c.sql"));
      if (stat.isFile()) return dir;
    } catch {
      // continue
    }
  }
  return "/config/Agents_for_Impact_CH5/sql";
}

export async function GET() {
  const startTime = Date.now();
  try {
    const sqlDir = await resolveSqlDir();
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT || "qwiklabs-gcp-04-26e02fd45203";
    const bq = new BigQuery({
      projectId,
      location: "US",
    });

    const [
      rankPlanCSql,
      scoutBurdenSql,
      scoutAccessSql,
      scoutAirSql,
      scoutDiseaseSql,
      auditDemographicsSql,
    ] = await Promise.all([
      fs.readFile(path.join(sqlDir, "rank_tracts_plan_c.sql"), "utf-8"),
      fs.readFile(path.join(sqlDir, "scout_burden.sql"), "utf-8"),
      fs.readFile(path.join(sqlDir, "scout_access.sql"), "utf-8"),
      fs.readFile(path.join(sqlDir, "scout_context_air.sql"), "utf-8"),
      fs.readFile(path.join(sqlDir, "scout_context_disease.sql"), "utf-8"),
      fs.readFile(path.join(sqlDir, "audit_demographics_v2.sql"), "utf-8"),
    ]);

    const [
      [planCRows],
      [burdenRows],
      [accessRows],
      [airRows],
      [diseaseRows],
      [auditRows],
    ] = await Promise.all([
      bq.query({ query: rankPlanCSql, location: "US" }),
      bq.query({
        query: scoutBurdenSql,
        params: { tract_ids: INSPECTED_TRACTS },
        location: "US",
      }),
      bq.query({
        query: scoutAccessSql,
        params: { tract_ids: INSPECTED_TRACTS },
        location: "US",
      }),
      bq.query({ query: scoutAirSql, location: "US" }),
      bq.query({ query: scoutDiseaseSql, location: "US" }),
      bq.query({
        query: auditDemographicsSql,
        params: { tract_ids: FINAL_4_TRACTS },
        location: "US",
      }),
    ]);

    // Compute Four-Fifths Equity Ratios from live audit_demographics_v2.sql output
    const countyRow = auditRows.find(
      (r: Record<string, unknown>) => r.grp === "county_uninsured"
    );
    const planRow = auditRows.find(
      (r: Record<string, unknown>) => r.grp === "plan"
    );

    const equityRatios =
      countyRow && planRow
        ? {
            black: Number((planRow.pct_black / countyRow.pct_black).toFixed(2)),
            hispanic: Number(
              (planRow.pct_hispanic / countyRow.pct_hispanic).toFixed(2)
            ),
            white: Number((planRow.pct_white / countyRow.pct_white).toFixed(2)),
            asian: Number((planRow.pct_asian / countyRow.pct_asian).toFixed(2)),
          }
        : null;

    return NextResponse.json({
      ok: true,
      projectId,
      dataset: "a4i_health",
      queriedAt: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      final4Tracts: FINAL_4_TRACTS,
      planCTop30: planCRows,
      scoutBurden: burdenRows,
      scoutAccess: accessRows,
      scoutAir: airRows[0] || null,
      scoutDiseaseLatest: diseaseRows[0] || null,
      scoutDiseaseHistory: diseaseRows,
      auditDemographics: auditRows,
      equityRatios,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "BigQuery execution failed",
      },
      { status: 500 }
    );
  }
}
