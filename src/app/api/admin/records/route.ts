import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPakistanNow } from "@/lib/time";

export async function GET(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const query: Record<string, unknown> = {};

    if (search) query.$or = [{ studentName: { $regex: search, $options: "i" } }, { studentId: { $regex: search.toUpperCase(), $options: "i" } }];
    if (from || to) {
      query.isoDate = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    }

    const db = await getDb();
    const [records, totalRecords, todayRecords, currentlyInLab] = await Promise.all([
      db.collection("attendance").find(query).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection("attendance").countDocuments(),
      db.collection("attendance").countDocuments({ isoDate: getPakistanNow().isoDate }),
      db.collection("attendance").countDocuments({ timeOut: null }),
    ]);

    const completedVisits = todayRecords - await db.collection("attendance").countDocuments({ isoDate: getPakistanNow().isoDate, timeOut: null });
    return NextResponse.json({
      records: records.map((record, index) => ({
        _id: record._id.toString(),
        serialNumber: index + 1,
        studentName: record.studentName,
        studentId: record.studentId,
        date: record.date,
        day: record.day,
        timeIn: record.timeIn,
        purpose: record.purpose,
        timeOut: record.timeOut ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
      stats: { todayRecords, currentlyInLab, completedVisits, totalRecords },
    });
  } catch (error) {
    console.error("Admin records error", error);
    return NextResponse.json({ error: "Could not load attendance records." }, { status: 503 });
  }
}