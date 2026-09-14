import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPakistanNow } from "@/lib/time";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid attendance record." }, { status: 400 });

  try {
    const db = await getDb();
    const record = await db.collection("attendance").findOne({ _id: new ObjectId(id) });
    if (!record) return NextResponse.json({ error: "Attendance record not found." }, { status: 404 });
    if (record.timeOut) return NextResponse.json({ error: "Time Out has already been marked for this visit." }, { status: 409 });

    const current = getPakistanNow();
    await db.collection("attendance").updateOne(
      { _id: new ObjectId(id), timeOut: null },
      { $set: { timeOut: current.time, timeOutAt: current.now, updatedAt: current.now } },
    );
    return NextResponse.json({ message: "Time Out marked successfully.", timeOut: current.time });
  } catch (error) {
    console.error("Time-out error", error);
    return NextResponse.json({ error: "Attendance service is unavailable. Please try again." }, { status: 503 });
  }
}