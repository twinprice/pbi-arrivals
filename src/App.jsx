import React, { useEffect, useMemo, useRef, useState } from "react";

// PBI Live Arrivals Board – single file React app
// Hosting: drop this into any Vite/Next/CRA project or a standalone React runner.
// Styling: TailwindCSS assumed. If you do not use Tailwind, replace the classNames with your CSS.
// Timezone: shows all times in America/New_York.
// Refresh: auto refresh every 60 seconds; manual refresh button included.
// Notes:
// 1) Flights: works out of the box with Aviationstack if you add an API key.
//    You can also switch to AeroDataBox by editing fetchFlightStatus.
// 2) Trains: provide a proxy URL in CONFIG.AMTRAK_PROXY_URL. If none is set, the UI links to the public status page for manual checks.
// 3) You can seed "manual_status" to override any live lookup on the fly.

// ======== CONFIG ========
const CONFIG = {
  TZ: "America/New_York",
  AUTO_REFRESH_SECONDS: 60,
  AVIATIONSTACK_KEY: "PUT_YOUR_KEY_HERE", // https://aviationstack.com/
  USE_AVIATIONSTACK: true, // set to false if you wire up AeroDataBox instead
  AERODATABOX_KEY: "", // if you prefer: https://rapidapi.com/aedbx-aedbx/api/aerodatabox
  AMTRAK_PROXY_URL: "", // optional. Your Apps Script or small proxy that returns train status JSON
};

// ======== DATA ========
// Minimal schema:
// id, type: "flight" | "train", display_name, origin_city, eta_sched (local ET string), pickup, notes,
// flight: airline_code (IATA), flight_number
// train: train_number
const RAW = [
  { id: "DL5738-1", type: "flight", display_name: "David Costales", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-2", type: "flight", display_name: "Denis Gilevskiy", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-3", type: "flight", display_name: "Jacob Zi Hao Lin", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill", notes: "First name: Jacob Zi Hao, Last name: Lin" },
  { id: "DL5738-4", type: "flight", display_name: "Lucie Stefanoni", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-5", type: "flight", display_name: "Ocean Ma", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-6", type: "flight", display_name: "Molly Stoltz", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5302-1", type: "flight", display_name: "Shaurya Bawa", origin_city: "NYC – LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-2", type: "flight", display_name: "Nourin H. K. Khalifa", origin_city: "NYC – LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-3", type: "flight", display_name: "Andreea-Denisa Ghiorghisor", origin_city: "Ithaca", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "AA1071-1", type: "flight", display_name: "Joachim Chuah Han Wen", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-2", type: "flight", display_name: "Benedek Takacs", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-3", type: "flight", display_name: "Low Wa Sern", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-4", type: "flight", display_name: "Thanusaa Uthrian", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-5", type: "flight", display_name: "Hannah Chinyere Chukwu", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-6", type: "flight", display_name: "Kara Lincou", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-7", type: "flight", display_name: "Quincy Cline", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AT79-1", type: "train", display_name: "Omar Hafez", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-2", type: "train", display_name: "Hollis Robertson", origin_city: "Trenton, NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-3", type: "train", display_name: "Avi Agarwal", origin_city: "Trenton, NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-4", type: "train", display_name: "Zane Sameer Patel", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-5", type: "train", display_name: "Emma Reshma Trauber", origin_city: "Trenton, NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-6", type: "train", display_name: "Franka Vidović", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-7", type: "train", display_name: "Sohaila O. H. G. Ismail", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-8", type: "train", display_name: "Savannah Ingledew", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-9", type: "train", display_name: "Anne Siobhan Leakey", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT195-1", type: "train", display_name: "Rustin Wiser", origin_city: "Philadelphia", train_number: "195", eta_sched: "2025-10-03T16:58:00-04:00", pickup: "MH" },
];

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
async function fetchFlightStatusAviationstack(airlineIata, flightNumber) {
  if (!CONFIG.AVIATIONSTACK_KEY) return null;
  const url = `https://api.aviationstack.com/v1/flights?access_key=${CONFIG.AVIATIONSTACK_KEY}&flight_iata=${airlineIata}${flightNumber}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("aviationstack http error");
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;
    const stat = item.flight_status; // scheduled, active, landed, cancelled, incident, diverted
    const arr = item.arrival || {};
    const est = arr.estimated || arr.scheduled || null;
    return { status: stat, eta_est: est };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function fetchFlightStatusAeroDataBox(airlineIata, flightNumber, dateISO) {
  if (!CONFIG.AERODATABOX_KEY) return null;
  // Example endpoint. You must supply RapidAPI headers with key.
  const date = dateISO?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${airlineIata}${flightNumber}/${date}`;
  try {
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": CONFIG.AERODATABOX_KEY,
        "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
      },
    });
    if (!res.ok) throw new Error("aerodatabox http error");
    const data = await res.json();
    const item = Array.isArray(data) ? data[0] : null;
    if (!item) return null;
    const stat = item.status || item.movement?.status || "";
    const est = item.arrival?.scheduledTimeLocal || item.arrival?.scheduledTimeUtc || null;
    return { status: String(stat), eta_est: est };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function fetchTrainStatus(trainNumber) {
  // Expect your proxy to return { status: string, eta_est: isoString } for RVR station.
  // Example Apps Script proxy is included at bottom of this file.
  if (!CONFIG.AMTRAK_PROXY_URL) return null;
  try {
    const res = await fetch(`${CONFIG.AMTRAK_PROXY_URL}?train=${encodeURIComponent(trainNumber)}`);
    if (!res.ok) throw new Error("amtrak proxy http error");
    const data = await res.json();
    return { status: data.status, eta_est: data.eta_est };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function fetchStatusForRow(row) {
  if (row.manual_status) return { status: row.manual_status, eta_est: row.eta_sched };
  if (row.type === "flight") {
    if (CONFIG.USE_AVIATIONSTACK) {
      return fetchFlightStatusAviationstack(row.airline_code, row.flight_number);
    }
    return fetchFlightStatusAeroDataBox(row.airline_code, row.flight_number, row.eta_sched);
  }
  if (row.type === "train") return fetchTrainStatus(row.train_number);
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

function useTicker(periodSec) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), periodSec * 1000);
    return () => clearInterval(id);
  }, [periodSec]);
}

function RowCard({ item, onOpenExternal }) {
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
          {item.type === "flight" ? `${item.airline_code}${item.flight_number}` : `Train ${item.train_number}`} • From {item.origin_city}
        </div>
        <div className="text-sm mt-1">
          ETA scheduled: <span className="font-medium">{fmtTime(item.eta_sched)}</span>
          {item.eta_live && <span className="ml-2">Live: <span className="font-medium">{fmtTime(item.eta_live)}</span></span>}
          {Number.isFinite(mins) && (
            <span className={`ml-2 ${mins < 0 ? "text-gray-500" : mins <= 20 ? "text-red-600" : "text-gray-800"}`}>
              {mins < 0 ? `${Math.abs(mins)} min ago` : `in ${mins} min`}
            </span>
          )}
        </div>
        {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
      </div>
      <div className="text-right">
        <div className="text-sm">Pickup: <span className="font-medium">{item.pickup}</span></div>
        {item.type === "train" && (
          <button
            onClick={() => onOpenExternal(item)}
            className="mt-2 text-xs underline text-blue-700"
          >
            Open train status
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(RAW);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pickup, setPickup] = useState("ALL");
  const [onlyActive, setOnlyActive] = useState(false);
  const lastRefreshed = useRef(Date.now());

  useTicker(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ = !q || `${r.display_name} ${r.origin_city} ${r.pickup} ${r.airline_code || ""}${r.flight_number || ""} ${r.train_number || ""}`.toLowerCase().includes(q);
      const matchesPickup = pickup === "ALL" || r.pickup.toLowerCase().includes(pickup.toLowerCase());
      const isActive = !onlyActive || !r.status || /active|en route|landed|arrived|delayed|late|boarding/i.test(r.status);
      return matchesQ && matchesPickup && isActive;
    });
  }, [rows, query, pickup, onlyActive]);

  async function refresh() {
    setLoading(true);
    const updated = await Promise.all(
      rows.map(async (r) => {
        const live = await fetchStatusForRow(r);
        if (!live) return r;
        return { ...r, status: normalizeStatus(live.status, r.type), eta_live: live.eta_est || r.eta_live };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeStatus(status, type) {
    if (!status) return "Scheduled";
    const s = String(status).toLowerCase();
    if (/(landed|arrived)/.test(s)) return type === "flight" ? "Landed" : "Arrived";
    if (/(active|en route|enroute|in air|en‑route)/.test(s)) return type === "flight" ? "En route" : "En route";
    if (/(cancel)/.test(s)) return "Cancelled";
    if (/(delay|late)/.test(s)) return "Delayed";
    if (/(boarding|origin)/.test(s)) return "Boarding";
    return "Scheduled";
  }

  function onOpenExternal(item) {
    if (item.type !== "train") return;
    const url = `https://www.amtrak.com/track-your-train.html`;
    window.open(url, "_blank");
  }

  const uniquePickups = useMemo(() => ["ALL", ...Array.from(new Set(RAW.map((r) => r.pickup)))], []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">PBI Live Arrivals Board</h1>
            <p className="text-sm text-gray-600">Richmond, VA • Times shown in {CONFIG.TZ}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="px-3 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-50" disabled={loading}>
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <span className="text-xs text-gray-500">Updated {timeAgo(lastRefreshed.current)}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            placeholder="Search name, flight, train, city, pickup"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-2 w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none"
          />
          <select value={pickup} onChange={(e) => setPickup(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300">
            {uniquePickups.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            Only active
          </label>
        </div>

        <div className="space-y-3">
          {filtered
            .slice()
            .sort((a, b) => new Date(a.eta_live || a.eta_sched).getTime() - new Date(b.eta_live || b.eta_sched).getTime())
            .map((row) => (
              <RowCard key={row.id} item={row} onOpenExternal={onOpenExternal} />
            ))}
        </div>

        <footer className="mt-8 text-xs text-gray-500">
          <p>Tip: add manual_status to any entry to override live lookups. Valid values include Scheduled, En route, Delayed, Landed, Arrived, Cancelled.</p>
        </footer>
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

/* ================= OPTIONAL: Google Apps Script proxy for Amtrak =================
Deploy as a web app and paste the URL into CONFIG.AMTRAK_PROXY_URL

function doGet(e) {
  const train = (e.parameter.train || "").trim();
  if (!train) return ContentService.createTextOutput(JSON.stringify({ error: "missing train" })).setMimeType(ContentService.MimeType.JSON);

  // TODO: Replace with a real data source. This stub marks Train 79 as On time arriving at 13:27 ET, Train 195 as 10 min late arriving 17:08 ET.
  const result = { status: "Scheduled", eta_est: null };
  if (train === "79") {
    result.status = "En route";
    result.eta_est = new Date("2025-10-03T13:27:00-04:00").toISOString();
  } else if (train === "195") {
    result.status = "Delayed";
    result.eta_est = new Date("2025-10-03T17:08:00-04:00").toISOString();
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

=============================================================================== */
