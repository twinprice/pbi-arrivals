import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * PBI Live Arrivals Board
 * Times in America/New_York.
 * Poll every 3 minutes. Cache flight lookups for 3 minutes to save quota.
 */

const CONFIG = {
  TZ: "America/New_York",
  AUTO_REFRESH_SECONDS: 180,            // 3 minutes
  CACHE_SECONDS: 180,                   // cache live lookups for 3 minutes
  AVIATIONSTACK_KEY: "16ccb25a465d814f00f5a4b82d0c9455",
  USE_AVIATIONSTACK: true,
  AERODATABOX_KEY: "",
  AMTRAK_PROXY_URL: "",
};
// Correct base for GitHub Pages
const BASE = (import.meta && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";

// ======== DATA ========
// Optional "photo" lets you point to a headshot. If absent, we try players/<slug>.jpg.
// Optional "logo" lets you override the airline logo. If absent, we try logos/<IATA>.png
const RAW = [
  { id: "DL5738-1", type: "flight", display_name: "David Costales", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-2", type: "flight", display_name: "Denis Gilevskiy", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-4", type: "flight", display_name: "Lucie Stefanoni", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-5", type: "flight", display_name: "Ocean Ma", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },
  { id: "DL5738-6", type: "flight", display_name: "Molly Stoltz", origin_city: "Boston", airline_code: "DL", flight_number: "5738", eta_sched: "2025-10-03T11:02:00-04:00", pickup: "MH/Bill" },

  { id: "DL5302-1", type: "flight", display_name: "Shaurya Bawa", origin_city: "NYC - LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-2", type: "flight", display_name: "Nourin Khalifa", origin_city: "NYC - LaGuardia", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },
  { id: "DL5302-3", type: "flight", display_name: "Andreea Ghiorghisor", origin_city: "Ithaca", airline_code: "DL", flight_number: "5302", eta_sched: "2025-10-03T12:20:00-04:00", pickup: "TED" },

  { id: "AA1071-1", type: "flight", display_name: "Joachim Chuah", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-2", type: "flight", display_name: "Benedek Takacs", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-3", type: "flight", display_name: "Low Wa Sern", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-4", type: "flight", display_name: "Thanusaa Uthrian", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-5", type: "flight", display_name: "Hannah Chukwu", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-6", type: "flight", display_name: "Kara Lincou", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },
  { id: "AA1071-7", type: "flight", display_name: "Quincy Cline", origin_city: "Hartford", airline_code: "AA", flight_number: "1071", eta_sched: "2025-10-03T13:10:00-04:00", pickup: "MH/Carol" },

  { id: "AT79-1", type: "train", display_name: "Omar Hafez", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-2", type: "train", display_name: "Hollis Robertson", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-3", type: "train", display_name: "Avi Agarwal", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-4", type: "train", display_name: "Zane Patel", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-5", type: "train", display_name: "Emma Trauber", origin_city: "Trenton -NJ", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-6", type: "train", display_name: "Franka Vidovic", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-7", type: "train", display_name: "Sohaila Ismail", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-8", type: "train", display_name: "Savannah Ingledew", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },
  { id: "AT79-9", type: "train", display_name: "Anne Leakey", origin_city: "Philadelphia", train_number: "79", eta_sched: "2025-10-03T13:27:00-04:00", pickup: "Eliza" },

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
function fmtHM(dtStr, tz = CONFIG.TZ) {
  if (!dtStr) return "";
  try {
    const d = new Date(dtStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
  } catch {
    return "";
  }
}
function minsUntil(dtStr) {
  const t = new Date(dtStr).getTime();
  return Math.round((t - Date.now()) / 60000);
}
function diffMinutes(aISO, bISO) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.round((a - b) / 60000);
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
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function airlineLogoPath(iata) {
  const code = String(iata || "").toUpperCase();
  return `${BASE}logos/${code}`; // no extension here
}

function playerPhotoPath(name) {
  const s = slug(name);
  return `${BASE}players/${s}`; // no extension here
}

function saneEta(schedISO, estISO) {
  const sched = new Date(schedISO).getTime();
  const est = new Date(estISO).getTime();
  if (!Number.isFinite(est)) return null;
  const diff = Math.abs(est - sched);
  const within3h = diff <= 3 * 60 * 60 * 1000;
  const nearEvent = Math.abs(Date.now() - sched) <= 12 * 60 * 60 * 1000;
  return within3h && nearEvent ? estISO : null;
}
function delayMinutes(item) {
  const live = item.eta_live || item.eta_sched;
  return diffMinutes(live, item.eta_sched); // positive means late, negative early
}
function isDelayed(item) {
  const s = String(item.status || "").toLowerCase();
  if (s.includes("delayed") || s.includes("late")) return true;
  return delayMinutes(item) >= 10;
}
function punctualLabel(item) {
  const dm = delayMinutes(item);
  if (!item.eta_live || Math.abs(dm) > 180) {
    return { text: "On time", cls: "bg-green-100 text-green-800" };
  }
  if (dm >= 10) return { text: `Delayed ${dm}m`, cls: "bg-red-100 text-red-800" };
  if (dm <= -10) return { text: `Early ${Math.abs(dm)}m`, cls: "bg-green-100 text-green-800" };
  return { text: "On time", cls: "bg-green-100 text-green-800" };
}
function rowEmphasis(item) {
  if (isDelayed(item)) return "border-red-300 bg-red-50";
  const s = String(item.status || "").toLowerCase();
  if (s.includes("cancel")) return "border-red-400 bg-red-50";
  if (s.includes("landed") || s.includes("arrived")) return "border-green-100";
  return "border-gray-200";
}

// ======== CACHE (localStorage) ========
const cacheKey = "flightCacheV1";
function readCache() {
  try { return JSON.parse(localStorage.getItem(cacheKey) || "{}"); } catch { return {}; }
}
function writeCache(obj) {
  localStorage.setItem(cacheKey, JSON.stringify(obj));
}

// ======== API FETCHERS ========
async function fetchFlightStatusAviationstack(airlineIata, flightNumber, schedISO) {
  if (!CONFIG.AVIATIONSTACK_KEY) return null;

  // cache by airline, number, date
  const d = new Date(schedISO);
  const flightDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const key = `${airlineIata}${flightNumber}-${flightDate}`;

  const cache = readCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < CONFIG.CACHE_SECONDS * 1000) {
    return hit.payload;
  }

  const url =
    `https://api.aviationstack.com/v1/flights?` +
    `access_key=${CONFIG.AVIATIONSTACK_KEY}` +
    `&flight_iata=${airlineIata}${flightNumber}` +
    `&flight_date=${flightDate}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("aviationstack http error");
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;

    // pull extra fields
    const stat = item.flight_status;
    const dep = item.departure || {};
    const arr = item.arrival || {};
    const airline = item.airline || {};
    const flight = item.flight || {};
    const aircraft = item.aircraft || {};

    const etaEst =
      arr.estimated ||
      arr.estimated_runway ||
      arr.scheduled ||
      null;

    const payload = {
      status: stat,
      eta_est: etaEst,
      dep_scheduled: dep.scheduled || null,
      dep_estimated: dep.estimated || null,
      dep_actual: dep.actual || null,
      dep_delay_min: Number.isFinite(dep.delay) ? dep.delay : null,
      arr_terminal: arr.terminal || null,
      arr_gate: arr.gate || null,
      arr_baggage: arr.baggage || null,
      airline_name: airline.name || null,
      aircraft_reg: aircraft.registration || null,
      flight_iata: flight.iata || `${airlineIata}${flightNumber}`,
    };

    cache[key] = { ts: Date.now(), payload };
    writeCache(cache);
    return payload;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function fetchTrainStatus(trainNumber) {
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
  if (row.type === "flight") {
    return fetchFlightStatusAviationstack(row.airline_code, row.flight_number, row.eta_sched);
  }
  if (row.type === "train") {
    return fetchTrainStatus(row.train_number);
  }
  return null;
}
import { useState } from "react";

function LogoImg({ iata, className = "h-5 w-auto" }) {
  if (!iata) return null;
  const stem = airlineLogoPath(iata);
  const srcs = [`${stem}.svg`, `${stem}.png`, `${stem}.webp`];
  const [i, setI] = useState(0);
  if (i >= srcs.length) return null;
  return <img src={srcs[i]} alt="" className={className} onError={() => setI(i + 1)} />;
}

function PlayerImg({ name, className = "w-12 h-12 rounded-xl object-cover bg-gray-100 hidden sm:block" }) {
  const stem = playerPhotoPath(name);
  const srcs = [`${stem}.webp`, `${stem}.jpg`, `${stem}.jpeg`, `${stem}.png`];
  const [i, setI] = useState(0);
  if (i >= srcs.length) return null;
  return <img src={srcs[i]} alt="" className={className} onError={() => setI(i + 1)} />;
}

// ======== UI ========
function StatusPill({ text }) {
  const t = text || "Scheduled";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor(t)}`}>
      {t}
    </span>
  );
}

function RowCard({ item, onOpenExternal }) {
  const mins = minsUntil(item.eta_live || item.eta_sched);
  const showMinutes = Number.isFinite(mins) && Math.abs(mins) <= 600;
  const punctual = punctualLabel(item);

  const depTime = item.dep_estimated || item.dep_scheduled; // show estimated if present
  const etaLive = item.eta_live || item.eta_sched;
  const dm = delayMinutes(item); // positive late, negative early

  return (
    <div className={`rounded-2xl shadow p-4 flex items-center gap-4 border ${rowEmphasis(item)}`}>
      {/* player photo with extension fallbacks and correct base path */}
      <PlayerImg name={item.display_name} className="w-12 h-12 rounded-xl object-cover bg-gray-100 hidden sm:block" />

      {/* emoji icon only on small screens */}
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl sm:hidden">
        {item.type === "flight" ? "✈️" : "🚆"}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* airline logo with extension fallbacks and correct base path */}
          <LogoImg iata={item.airline_code} className="h-5 w-auto" />
          <div className="text-lg font-semibold">{item.display_name}</div>
          <StatusPill text={item.status} />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${punctual.cls}`}>{punctual.text}</span>
        </div>

        <div className="text-sm text-gray-600">
          {item.type === "flight" ? `${item.airline_code}${item.flight_number}` : `Train ${item.train_number}`} • From {item.origin_city}
        </div>

        <div className="text-sm mt-1">
          {depTime && (
            <span className="mr-3">
              Departs: <span className="font-medium">{fmtHM(depTime)}</span>
            </span>
          )}
          <span className="mr-3">
            ETA scheduled: <span className="font-medium">{fmtHM(item.eta_sched)}</span>
          </span>
          <span className="mr-3">
            Live: <span className="font-medium">{fmtHM(etaLive)}</span>
          </span>
          {showMinutes && (
            <span className={`${mins < 0 ? "text-gray-500" : mins <= 20 ? "text-red-600" : "text-gray-800"}`}>
              {mins < 0 ? `${Math.abs(mins)} min ago` : `in ${mins} min`}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {Number.isFinite(item.dep_delay_min) && <span>Dep delay: <span className="font-medium">{item.dep_delay_min}m</span></span>}
          {Number.isFinite(dm) && Math.abs(dm) <= 180 && <span>Arr delta: <span className="font-medium">{dm >= 0 ? `+${dm}m` : `${dm}m`}</span></span>}
          {(item.arr_terminal || item.arr_gate) && <span>Gate: <span className="font-medium">{[item.arr_terminal, item.arr_gate].filter(Boolean).join(" ")}</span></span>}
          {item.arr_baggage && <span>Baggage: <span className="font-medium">{item.arr_baggage}</span></span>}
          {item.aircraft_reg && <span>Reg: <span className="font-medium">{item.aircraft_reg}</span></span>}
        </div>

        {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
      </div>

      <div className="text-right">
        <div className="text-sm">Pickup: <span className="font-medium">{item.pickup}</span></div>
        {item.type === "train" && (
          <button onClick={() => onOpenExternal(item)} className="mt-2 text-xs underline text-blue-700">
            Open train status
          </button>
        )}
      </div>
    </div>
  );
}


export default function App() {
  const [rows, setRows] = useState(RAW.map(r => ({ ...r, status: r.status || "Scheduled" })));
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pickup, setPickup] = useState("ALL");
  const [onlyActive, setOnlyActive] = useState(false);
  const lastRefreshed = useRef(Date.now());

  const uniquePickups = useMemo(() => ["ALL", ...Array.from(new Set(RAW.map(r => r.pickup)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        `${r.display_name} ${r.origin_city} ${r.pickup} ${r.airline_code || ""}${r.flight_number || ""} ${r.train_number || ""}`
          .toLowerCase()
          .includes(q);
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

        // choose a sane ETA
        let eta = r.eta_sched;
        if (live.eta_est) {
          const ok = saneEta(r.eta_sched, live.eta_est);
          if (ok) eta = ok;
        }

        const statusNorm = normalizeStatus(live.status, r.type);
        const finalStatus =
          statusNorm === "Landed" && new Date(eta).getTime() > Date.now()
            ? "En route"
            : statusNorm;

        return {
          ...r,
          status: finalStatus || r.status,
          eta_live: eta,
          dep_scheduled: live.dep_scheduled || r.dep_scheduled,
          dep_estimated: live.dep_estimated || r.dep_estimated,
          dep_actual: live.dep_actual || r.dep_actual,
          dep_delay_min: live.dep_delay_min ?? r.dep_delay_min,
          arr_terminal: live.arr_terminal ?? r.arr_terminal,
          arr_gate: live.arr_gate ?? r.arr_gate,
          arr_baggage: live.arr_baggage ?? r.arr_baggage,
          airline_name: live.airline_name ?? r.airline_name,
          aircraft_reg: live.aircraft_reg ?? r.aircraft_reg,
          flight_iata: live.flight_iata ?? r.flight_iata,
        };
      })
    );
    setRows(updated);
    lastRefreshed.current = Date.now();
    setLoading(false);
  }

  useEffect(() => {
    const first = setTimeout(refresh, Math.random() * 2000); // small jitter
    const id = setInterval(refresh, CONFIG.AUTO_REFRESH_SECONDS * 1000 + Math.floor(Math.random() * 2000));
    return () => { clearTimeout(first); clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeStatus(status, type) {
    if (!status) return "Scheduled";
    const s = String(status).toLowerCase();
    if (/(landed|arrived)/.test(s)) return type === "flight" ? "Landed" : "Arrived";
    if (/(active|en route|enroute|in air)/.test(s)) return "En route";
    if (/(cancel)/.test(s)) return "Cancelled";
    if (/(delay|late)/.test(s)) return "Delayed";
    if (/(boarding|origin)/.test(s)) return "Boarding";
    return "Scheduled";
  }

  function onOpenExternal(item) {
    if (item.type !== "train") return;
    window.open("https://www.amtrak.com/track-your-train.html", "_blank");
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
            .sort((a, b) => new Date(a.eta_live || a.eta_sched) - new Date(b.eta_live || b.eta_sched))
            .map((row) => (
              <RowCard key={row.id} item={row} onOpenExternal={onOpenExternal} />
            ))}
        </div>

        <footer className="mt-8 text-xs text-gray-500">
          <p>Tip: add manual_status to any entry to override live lookups. Values: Scheduled, En route, Delayed, Landed, Arrived, Cancelled.</p>
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
