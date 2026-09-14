import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getPakistanNow } from "@/lib/time";

const attendanceSchema = z.object({
  studentName: z.string().trim().min(2, "Please enter your full name.").max(80),
  studentId: z.string().trim().min(2, "Please enter your Student ID.").max(30),
  purpose: z.string().trim().min(2, "Please enter the purpose of your visit.").max(160),
});

export async function POST(request: Request) {
  let studentId = "";
  try {
    const parsed = attendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid student data." }, { status: 400 });
    }

    const db = await getDb();
    studentId = parsed.data.studentId.toUpperCase();
    const active = await db.collection("attendance").findOne({ studentId, timeOut: null });
    if (active) {
      return NextResponse.json({
        error: "You have already marked Time In. Please mark Time Out for your active visit.",
        record: {
          id: active._id.toString(),
          studentName: active.studentName,
          studentId: active.studentId,
          date: active.date,
          day: active.day,
          timeIn: active.timeIn,
          purpose: active.purpose,
        },
      }, { status: 409 });
    }

    const current = getPakistanNow();
    const now = current.now;
    const result = await db.collection("attendance").insertOne({
      ...parsed.data,
      studentId,
      date: current.date,
      isoDate: current.isoDate,
      day: current.day,
      timeIn: current.time,
      timeOut: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      message: "Time In marked successfully.",
      record: { id: result.insertedId.toString(), ...parsed.data, studentId, date: current.readableDate, day: current.day, timeIn: current.time },
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      try {
        const db = await getDb();
        const active = studentId ? await db.collection("attendance").findOne({ studentId, timeOut: null }) : null;
        return NextResponse.json({
          error: "You have already marked Time In. Please mark Time Out for your active visit.",
          record: active
            ? {
                id: active._id.toString(),
                studentName: active.studentName,
                studentId: active.studentId,
                date: active.date,
                day: active.day,
                timeIn: active.timeIn,
                purpose: active.purpose,
              }
            : undefined,
        }, { status: 409 });
      } catch {
        return NextResponse.json({ error: "You have already marked Time In. Please mark Time Out for your active visit." }, { status: 409 });
      }
    }
    console.error("Time-in error", error);
    return NextResponse.json({ error: "Attendance service is unavailable. Please try again." }, { status: 503 });
  }
}