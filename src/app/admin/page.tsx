"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { AttendanceRecord } from "@/lib/types";

type Stats = { todayRecords: number; currentlyInLab: number; completedVisits: number; totalRecords: number };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ todayRecords: 0, currentlyInLab: 0, completedVisits: 0, totalRecords: 0 });
  const [filters, setFilters] = useState({ search: "", from: "", to: "" });
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        if (data.loggedIn) setLoggedIn(true);
      } finally {
        setCheckingSession(false);
      }
    }
    void checkSession();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    async function fetchRecords() {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/records?${params}`);
      if (response.status === 401) { setLoggedIn(false); return; }
      const data = await response.json();
      if (!response.ok) { setError(data.error); return; }
      setRecords(data.records); setStats(data.stats);
    }
    void fetchRecords();
  }, [loggedIn, filters]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const data = await response.json();
    if (!response.ok) { setError(data.error); return; }
    setLoggedIn(true); setCredentials({ email: "", password: "" });
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setLoggedIn(false); }

  function exportExcel() {
    const rows = records.map((record) => ({ "S.No": record.serialNumber, "Student Name": record.studentName, "Student ID": record.studentId, Date: record.date, Day: record.day, "Time In": record.timeIn, Purpose: record.purpose, "Time Out": record.timeOut ?? "--" }));
    const sheet = XLSX.utils.json_to_sheet(rows); sheet["!cols"] = [{ wch: 8 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 12 }];
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Attendance"); XLSX.writeFile(book, `lab-attendance-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (checkingSession) return <main className="login-shell"><div className="login-card"><p className="eyebrow">Checking session…</p></div></main>;

  if (!loggedIn) return <main className="login-shell"><div className="login-card"><Link href="/" className="back-link">← Student register</Link><div className="brand-mark">CL</div><p className="eyebrow">Restricted area</p><h1>Admin sign in</h1><p className="login-copy">Access the attendance register, live statistics, and Excel export.</p>{error && <div className="notice error">{error}</div>}<form onSubmit={login}><label>Email address<input type="email" required value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} placeholder="admin@example.com" /></label><label>Password<input type="password" required value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} placeholder="Enter your password" /></label><button className="primary-button">SIGN IN <span>↗</span></button></form></div></main>;

  return <main className="admin-shell"><header className="admin-header"><div><Link href="/" className="back-link">← Student register</Link><p className="eyebrow">Control center</p><h1>Attendance overview</h1></div><div className="header-actions"><button className="export-button" onClick={exportExcel}>↓ Export to Excel</button><button className="logout-button" onClick={logout}>Log out</button></div></header><section className="stats-grid"><Stat label="Today's students" value={stats.todayRecords} accent="blue" /><Stat label="Currently in lab" value={stats.currentlyInLab} accent="green" /><Stat label="Completed visits" value={stats.completedVisits} accent="orange" /><Stat label="Total records" value={stats.totalRecords} accent="ink" /></section><section className="records-section"><div className="records-toolbar"><div><p className="eyebrow">Live register</p><h2>Attendance records <span>{records.length}</span></h2></div><div className="filters"><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search name or ID" /><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><span>to</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></div></div>{error && <div className="notice error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>S.No</th><th>Student</th><th>ID / Roll No.</th><th>Date</th><th>Day</th><th>Time In</th><th>Purpose</th><th>Time Out</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record._id}><td>{record.serialNumber}</td><td><strong>{record.studentName}</strong></td><td>{record.studentId}</td><td>{record.date}</td><td>{record.day}</td><td>{record.timeIn}</td><td className="purpose-cell">{record.purpose}</td><td>{record.timeOut ?? "--"}</td><td><span className={`table-status ${record.timeOut ? "complete" : "active"}`}>{record.timeOut ? "Completed" : "In lab"}</span></td></tr>)}{records.length === 0 && <tr><td colSpan={9} className="empty-state">No attendance records match the current filters.</td></tr>}</tbody></table></div></section></main>;
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) { return <div className={`stat-card ${accent}`}><span className="stat-icon">{accent === "green" ? "↗" : accent === "orange" ? "✓" : accent === "blue" ? "◷" : "#"}</span><p>{label}</p><strong>{value.toLocaleString()}</strong></div>; }