import React, { useEffect, useMemo, useRef, useState } from "react";

// PBI Live Arrivals Board – single file React app
// Hosting: drop this into any Vite/Next/CRA project or a standalone React runner.
// Styling: TailwindCSS assumed. If you do not use Tailwind, replace the classNames with your CSS.
// Timezone: shows all times in America/New_York.
// Refresh: auto refresh every 60 seconds; manual refresh button included.

// ======== CONFIG ========
const CONFIG = {
  TZ: "America/New_York",
  AUTO_REFRESH_SECONDS: 60,
  AVIATIONSTACK_KEY: "16ccb25a465d814f00f5a4b82d0c9455",
  USE_AVIATIONSTACK: true,
  AERODATABOX_KEY: "",
  AMTRAK_PROXY_URL: "",
};

// ======== DATA ========
const RAW = [
  { id: "DL5738-1", type: "flight", display_name: "David Costales", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-2", type: "flight", display_name: "Denis Gilevskiy", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-3", type: "flight", display_name: "Jacob Zi Hao Lin", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill", notes: "First name: Jacob Zi Hao, Last name: Lin" },
  { id: "DL5738-4", type: "flight", display_name: "Lucie Stefanoni", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-5", type: "flight", display_name: "Ocean Ma", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-6", type: "flight", display_name: "Molly Stoltz", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5302-1", type: "flight", display_name: "Shaurya Bawa", origin_city: "NYC - LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-2", type: "flight", display_name: "Nourin Hesham Kamaleldin Khalifa", origin_city: "NYC - LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-3", type: "flight", display_name: "Ghiorghisor Andreea-Denisa", origin_city: "Ithaca", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "AA1071-1", type: "flight", display_name: "Joachim Chuah Han Wen", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-2", type: "flight", display_name: "Benedek Takacs", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-3", type: "flight", display_name: "Low Wa Sern", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-4", type: "flight", display_name: "Thanusaa Uthrian", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-5", type: "flight", display_name: "Hannah Chinyere Chukwu", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-6", type: "flight", display_name: "Kara Lincou", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-7", type: "flight", display_name: "Quincy Cline", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },

  { id: "AT79-1", type: "train", display_name: "Omar Hafez", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-2", type: "train", display_name: "Hollis Robertson", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-3", type: "train", display_name: "Avi Agarwal", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-4", type: "train", display_name: "Zane Sameer Patel", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-5", type: "train", display_name: "Emma Reshma Trauber", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-6", type: "train", display_name: "Franka Vidović", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-7", type: "train", display_name: "Sohaila Omar Hosam Gamaleldin Ismail", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-8", type: "train", display_name: "Savannah Ingledew", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-9", type: "train", display_name: "Anne Siobhan Leakey", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },

  { id: "AT195-1", type: "train", display_name: "Rustin Wiser", origin_city: "Philadelphia", train_number: "195", eta_sched: "2025-10-03T16:58:00-04:00", pickup: "MH" }
]

// ======== UTIL ========
function fmtTime(dtStr, tz = CONFIG.TZ) {
  try {
    const d = new Date(dtStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  } catch {
    return "";
  }
}

function minsUntil(dtStr) {
  const now = Date.now();
  const t = new Date(dtStr).getTime();
  const diffMin = Math.round((t - now) / 60000);
  return diffMin;
}

function badgeColor(status) {
  if (!status) return "bg-gray-200 text-gray-700";
  const s = status.toLowerCase();
  if (s.includes("arrived") || s.includes("landed")) return "bg-green-100 text-green-800";
  if (s.includes("boarding") || s.includes("en route") || s.includes("active")) return "bg-blue-100 text-blue-800";
  if (s.includes("delayed") || s.includes("late")) return "bg-yellow-100 text-yellow-800";
  if (s.includes("cancel")) return "bg-red-100 text-red-800";
  return "bg-gray-200 text-gray-700";
}

// ======== API FETCHERS ========
async function fetchFlightStatusAviationstack(airlineIata, flightNumber, schedISO) {
  if (!CONFIG.AVIATIONSTACK_KEY) return null;

  const d = new Date(schedISO);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const flightDate = `${yyyy}-${mm}-${dd}`;

  const url = `https://api.aviationstack.com/v1/flights?access_key=${CONFIG.AVIATIONSTACK_KEY}&flight_iata=${airlineIata}${flightNumber}&flight_date=${flightDate}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("aviationstack http error");
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;
    const stat = item.flight_status;
    const arr = item.arrival || {};
    const est = arr.estimated || arr.estimated_runway || arr.scheduled || null;
    return { status: stat, eta_est: est };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function fetchStatusForRow(row) {
  if (row.type === "flight") {
    return fetchFlightStatusAviationstack(row.airline_code, row.flight_number, row.eta_sched);
  }
  return null;
}

// ======== UI ========
function StatusPill({ text }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor(text)}`}>
      {text || "Unknown"}
    </span>
  );
}

function RowCard({ item }) {
  const mins = minsUntil(item.eta_live || item.eta_sched);
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
        {item.type === "flight" ? "✈️" : "🚆"}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-lg font-semibold">{item.display_name}</div>
          <StatusPill text={item.status} />
        </div>
        <div className="text-sm text-gray-600">
          {item.airline_code}{item.flight_number} • From {item.origin_city}
        </div>
        <div className="text-sm mt-1">
          ETA scheduled: <span className="font-medium">{fmtTime(item.eta_sched)}</span>
          {item.eta_live && <span className="ml-2">Live: <span className="font-medium">{fmtTime(item.eta_live)}</span></span>}
          {Number.isFinite(mins) && (
            <span className={`ml-2 ${mins < 0 ? "text-gray-500" : mins <= 20 ? "text-red-600" : "text-gray-800"}`}>
              {Math.abs(mins) > 600 ? '' : mins < 0 ? `${Math.abs(mins)} min ago` : `in ${mins} min`}
            </span>
          )}
        </div>
        {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
      </div>
      <div className="text-right">
        <div className="text-sm">Pickup: <span className="font-medium">{item.pickup}</span></div>
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(RAW);
  const [loading, setLoading] = useState(false);
  const lastRefreshed = useRef(Date.now());

  async function refresh() {
    setLoading(true);
    const updated = await Promise.all(
      rows.map(async (r) => {
        const live = await fetchStatusForRow(r);
        if (!live) return r;

        let eta = live.eta_est || r.eta_sched;
        const estTime = new Date(eta).getTime();
        const schedTime = new Date(r.eta_sched).getTime();
        if (!Number.isFinite(estTime) || Math.abs(estTime - schedTime) > 24 * 60 * 60 * 1000) {
          eta = r.eta_sched;
        }

        const statusNorm = normalizeStatus(live?.status, r.type);
        const finalStatus = statusNorm === 'Landed' && new Date(eta).getTime() > Date.now() ? 'En route' : statusNorm;

        return { ...r, status: finalStatus, eta_live: eta };
      })
    );
    setRows(updated);
    lastRefreshed.current = Date.now();
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, CONFIG.AUTO_REFRESH_SECONDS * 1000);
    return () => clearInterval(id);
  }, []);

  function normalizeStatus(status, type) {
    if (!status) return "Scheduled";
    const s = String(status).toLowerCase();
    if (/(landed|arrived)/.test(s)) return type === "flight" ? "Landed" : "Arrived";
    if (/(active|en route|in air)/.test(s)) return "En route";
    if (/(cancel)/.test(s)) return "Cancelled";
    if (/(delay|late)/.test(s)) return "Delayed";
    if (/(boarding)/.test(s)) return "Boarding";
    return "Scheduled";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img
              src="https://ussq-img-live.s3.amazonaws.com/uploads%2F42b7d345-c792-404a-af51-25bba6ccc775_file.png"
              alt="PBI Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold">PBI Live Arrivals Board</h1>
              <p className="text-sm text-gray-600">Richmond, VA • Times shown in {CONFIG.TZ}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="px-3 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-50" disabled={loading}>
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <span className="text-xs text-gray-500">Updated {timeAgo(lastRefreshed.current)}</span>
          </div>
        </header>

        <div className="space-y-3">
          {rows
            .slice()
            .sort((a, b) => new Date(a.eta_live || a.eta_sched).getTime() - new Date(b.eta_live || b.eta_sched).getTime())
            .map((row) => (
              <RowCard key={row.id} item={row} />
            ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return "";
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}