export type AttendanceRecord = {
  _id: string;
  serialNumber: number;
  studentName: string;
  studentId: string;
  date: string;
  day: string;
  timeIn: string;
  purpose: string;
  timeOut: string | null;
  createdAt: string;
  updatedAt: string;
};