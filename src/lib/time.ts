const timeZone = "Asia/Karachi";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const readableDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function getPakistanNow() {
  const now = new Date();
  return {
    date: dateFormatter.format(now),
    readableDate: readableDateFormatter.format(now),
    day: dayFormatter.format(now),
    time: timeFormatter.format(now),
    isoDate: new Intl.DateTimeFormat("en-CA", { timeZone }).format(now),
    now,
  };
}

export function formatTime(value?: Date | string | null) {
  if (!value) return "--";
  return timeFormatter.format(new Date(value));
}