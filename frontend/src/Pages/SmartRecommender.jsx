import React, { useState, useEffect, useRef } from 'react';

// ─── Month data ───────────────────────────────────────────────────────────────
const MONTHS = [
  { value: '1',  name: 'ජනවාරි (January)' },
  { value: '2',  name: 'පෙබරවාරි (February)' },
  { value: '3',  name: 'මාර්තු (March)' },
  { value: '4',  name: 'අප්‍රේල් (April)' },
  { value: '5',  name: 'මැයි (May)' },
  { value: '6',  name: 'ජුනි (June)' },
  { value: '7',  name: 'ජූලි (July)' },
  { value: '8',  name: 'අගෝස්තු (August)' },
  { value: '9',  name: 'සැප්තැම්බර් (September)' },
  { value: '10', name: 'ඔක්තෝබර් (October)' },
  { value: '11', name: 'නොවැම්බර් (November)' },
  { value: '12', name: 'දෙසැම්බර් (December)' },
];

// ─── Reusable class strings ───────────────────────────────────────────────────
const inputCls =
  'w-full h-11 px-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl ' +
  'text-[#E8EDF5] text-sm outline-none transition-colors duration-200 ' +
  'focus:border-[#3ECFAB] focus:bg-[#3ECFAB]/5 cursor-pointer appearance-none ' +
  '[color-scheme:dark]';

const labelCls =
  'block mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3A4F72]';

// ─── keyframes injected once ──────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes orbFloat1 {
    0%,100% { transform:translate(0,0) scale(1); }
    33%      { transform:translate(30px,40px) scale(1.05); }
    66%      { transform:translate(-20px,20px) scale(0.97); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform:translate(0,0) scale(1); }
    40%      { transform:translate(-40px,-30px) scale(1.08); }
    70%      { transform:translate(20px,-10px) scale(0.95); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform:translate(-50%,-50%) scale(1); }
    50%      { transform:translate(-50%,-50%) scale(1.15); }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-white/[0.06] rounded-[20px] gap-3 text-[#2E3E5C]">
      <span className="text-5xl leading-none select-none">🗺️</span>
      <p className="text-sm">Select a destination and find your perfect stay</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="w-9 h-9 rounded-full border-[2.5px] border-[#3ECFAB]/15 border-t-[#3ECFAB] animate-spin" />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5 text-[13px] text-red-400">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3A4F72]">
      {children}
      <span className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

function ExactMatch({ data }) {
  return (
    <div className="flex flex-col gap-5" style={{ animation: 'fadeUp 0.35s ease both' }}>

      {/* Result banner */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-7">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
          <h2 className="font-['DM_Serif_Display',serif] text-[34px] font-normal text-[#F0F4FA] leading-tight">
            {data.Location_Name}
          </h2>
          <div className="flex items-center gap-1.5 bg-[#3ECFAB]/10 border border-[#3ECFAB]/20 rounded-full px-3.5 py-1.5 text-[13px] text-[#3ECFAB] font-medium">
            ☁ {data.Weather}&nbsp;·&nbsp;{data.Temp}°C
          </div>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'AI Score', value: `${Math.round(data.Hybrid_Score * 100)}`, sup: '%'       },
            { label: 'Rating',   value: `${data.Seasonal_Rating}`,                sup: '/5'      },
            { label: 'Options',  value: `${data.Hotels?.length ?? 0}`,            sup: ' hotels' },
          ].map(({ label, value, sup }) => (
            <div key={label} className="bg-white/[0.035] border border-white/[0.06] rounded-xl px-4 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#3A4F72] mb-1.5">{label}</p>
              <p className="text-[26px] font-light text-[#F0F4FA] leading-none">
                {value}
                <sup className="text-[13px] text-[#3A4F72] font-normal align-super">{sup}</sup>
              </p>
            </div>
          ))}
        </div>
      </div>

      <SectionHeading>Available accommodations</SectionHeading>

      {/* Hotels grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}
      >
        {data.Hotels && data.Hotels.length > 0 ? (
          data.Hotels.map((hotel, idx) => (
            <div
              key={idx}
              className="bg-white/[0.025] border border-white/[0.06] rounded-[16px] p-5 flex flex-col gap-3.5
                         transition-colors duration-200
                         hover:border-[#3ECFAB]/30 hover:bg-[#3ECFAB]/[0.04]"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-medium text-[#CDD6E8] leading-snug">{hotel.hotel_name}</p>
                  <p className="text-[11px] text-[#3A4F72] mt-0.5">{data.Location_Name} area</p>
                </div>
                <span className="flex-shrink-0 bg-[#3ECFAB]/10 border border-[#3ECFAB]/20 text-[#3ECFAB] text-[12px] font-semibold px-2.5 py-1 rounded-lg">
                  ★ {hotel.review_score}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3.5 border-t border-white/[0.05]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#3A4F72]">Total price</p>
                  <p className="text-[13px] font-medium text-[#E8EDF5] mt-0.5">{hotel.price}</p>
                </div>
                <a
                  href={hotel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 border border-white/10 rounded-lg text-[#8CA0C0] text-[12px] font-medium
                             no-underline transition-all duration-200
                             hover:border-[#3ECFAB] hover:text-[#3ECFAB] hover:bg-[#3ECFAB]/[0.05]"
                >
                  Book →
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-sm text-[#3A4F72]">
            No accommodations found for these dates.
          </div>
        )}
      </div>
    </div>
  );
}

function Alternatives({ message, data }) {
  return (
    <div className="flex flex-col gap-5">
      <div
        className="flex items-start gap-2.5 bg-yellow-400/[0.07] border border-yellow-400/15 rounded-xl px-4 py-3.5 text-[13px] text-yellow-300 leading-relaxed"
        style={{ animation: 'fadeUp 0.3s ease both' }}
      >
        <span>⚠</span>
        <span>{message}</span>
      </div>

      <SectionHeading>Suggested alternatives</SectionHeading>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}
      >
        {data.map((place, i) => (
          <div
            key={i}
            className="bg-white/[0.025] border border-white/[0.06] rounded-[16px] p-5
                       transition-colors duration-200 hover:border-white/[0.12]"
          >
            <p className="text-[16px] font-medium text-[#CDD6E8]">{place.Location_Name}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#3A4F72] mt-0.5">{place.Location_Type}</p>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/[0.05] text-[12px]">
              <span className="text-[#6B7FA3]">
                AI Score:{' '}
                <strong className="text-[#E8EDF5] font-medium">{Math.round(place.Hybrid_Score * 100)}%</strong>
              </span>
              <span className="text-[#3ECFAB] font-semibold">★ {place.Seasonal_Rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SmartRecommender() {
  const [locationsList, setLocationsList] = useState([]);
  const [location, setLocation]           = useState('');
  const [month, setMonth]                 = useState('1');
  const [checkin, setCheckin]             = useState('2026-06-15');
  const [checkout, setCheckout]           = useState('2026-06-16');
  const [results, setResults]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const resultsRef = useRef(null);

  // Fetch locations on mount
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('http://127.0.0.1:5000/api/locations');
        const data = await res.json();
        if (res.ok && data.locations) {
          setLocationsList(data.locations);
          if (data.locations.length > 0) setLocation(data.locations[0]);
        }
      } catch { /* silently ignore */ }
    })();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res  = await fetch('http://127.0.0.1:5000/api/recommend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ location, month: parseInt(month), checkin, checkout }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.status === 'Recommended') {
          setResults({ type: 'exact_match', data: data.target_data });
        } else {
          setResults({ type: 'alternatives', message: data.message, data: data.alternatives });
        }
        setTimeout(() => {
          if (resultsRef.current) {
            const top = resultsRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 150);
      } else {
        setError(data.error || 'ස්ථානය සොයාගැනීමට නොහැක.');
      }
    } catch {
      setError('Backend එකට සම්බන්ධ වීමට නොහැක. (Cannot connect to backend)');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (loading)                         return <LoadingState />;
    if (error)                           return <ErrorBox message={error} />;
    if (!results)                        return <EmptyState />;
    if (results.type === 'exact_match')  return <ExactMatch data={results.data} />;
    if (results.type === 'alternatives') return <Alternatives message={results.message} data={results.data} />;
    return null;
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap"
      />

      {/* Keyframes — only custom ones Tailwind can't handle */}
      <style>{KEYFRAMES}</style>

      <div className="relative min-h-screen bg-[#0A0F1E] font-['DM_Sans',sans-serif] text-[#E8EDF5] overflow-x-hidden flex flex-col items-center px-6 pt-20 pb-20">

        {/* ══════════════════════════════════════
            BACKGROUND GLOW ORBS
        ══════════════════════════════════════ */}

        {/* Orb 1 — top-left teal */}
        <div
          aria-hidden="true"
          className="fixed -top-44 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(62,207,171,0.18) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'orbFloat1 12s ease-in-out 0s infinite',
          }}
        />

        {/* Orb 2 — bottom-right indigo/purple */}
        <div
          aria-hidden="true"
          className="fixed bottom-0 -right-28 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(99,120,255,0.16) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'orbFloat2 15s ease-in-out 0s infinite',
          }}
        />

        {/* Orb 3 — center subtle teal */}
        <div
          aria-hidden="true"
          className="fixed top-[42%] left-[48%] w-[360px] h-[360px] rounded-full pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(62,207,171,0.08) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'orbFloat3 18s ease-in-out 0s infinite',
          }}
        />

        {/* ══════════════════════════════════════
            PAGE CONTENT
        ══════════════════════════════════════ */}
        <div className="relative z-10 w-full max-w-[1160px]">

          {/* Header */}
          <header className="mb-14">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#3ECFAB] mb-3">
              <span className="inline-block w-6 h-px bg-[#3ECFAB]" />
              AI Travel Guide
            </div>
            <h1 className="font-['DM_Serif_Display',serif] text-[clamp(40px,6vw,68px)] font-normal leading-[1.05] text-[#F0F4FA] mb-3.5">
              Explore{' '}
              <em className="italic text-[#3ECFAB]">Sri Lanka</em>
            </h1>
            <p className="text-[15px] text-[#6B7FA3] font-light max-w-[420px] leading-relaxed">
              Intelligent destination matching and accommodation discovery for every season.
            </p>
          </header>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-7 items-start">

            {/* ── Form card ── */}
            <form
              onSubmit={handleSearch}
              className="bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-7 backdrop-blur-md lg:sticky lg:top-6 flex flex-col gap-5"
            >
              {/* Destination */}
              <div>
                <label className={labelCls}>Destination</label>
                <div className="relative">
                  <select
                    className={inputCls}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    {locationsList.length > 0 ? (
                      locationsList.map((loc, i) => (
                        <option key={i} value={loc} className="bg-[#0F1830]">{loc}</option>
                      ))
                    ) : (
                      <option value="" className="bg-[#0F1830]">Loading locations…</option>
                    )}
                  </select>
                  {/* Chevron */}
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#3A4F72]" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Check-in</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Check-out</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                  />
                </div>
              </div>

              {/* Month */}
              <div>
                <label className={labelCls}>Travel month</label>
                <div className="relative">
                  <select
                    className={inputCls}
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#0F1830]">{m.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#3A4F72]" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !location}
                className="mt-1 w-full h-12 bg-[#3ECFAB] hover:bg-[#2BB898] active:scale-[0.98]
                           disabled:opacity-45 disabled:cursor-not-allowed
                           text-[#061018] text-[13px] font-semibold uppercase tracking-[0.06em]
                           rounded-xl flex items-center justify-center gap-2
                           transition-all duration-200 cursor-pointer border-0"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-[#061018] animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  'Find best match'
                )}
              </button>
            </form>

            {/* ── Results panel ── */}
            <div ref={resultsRef} className="flex flex-col gap-5 min-h-[400px]">
              {renderResults()}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}