import { useState } from "react";
import SectionLabel from "./SectionLabel";
import { INTERESTS, DAY_COLORS } from "../../constant";

export default function TripPlannerSidebar({
  planner,
  tripStops,
  activeStop,
  onViewStop,
  onViewFullItinerary,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    query, setQuery,
    startLocation, setStartLocation,
    endLocation, setEndLocation,
    travelDate, setTravelDate,
    days, setDays,
    travelers, setTravelers,
    transportType, setTransportType,
    includeWeather, setIncludeWeather,
    travelStyle, setTravelStyle,
    activeInterests, toggleInterest,
    loading, error, agentSummary,
    handleGenerateTrip,
  } = planner;

  return (
    <>
      {/* 
        Background, Border සහ Box Shadow ඉවත් කර ඇත.
        අයිකන් එක වඩාත් පැහැදිලිව පෙනීමට 'drop-shadow-md' යොදා ඇත.
      */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-[85px] left-4 z-[999] w-12 h-12 flex items-center justify-center transition-transform active:scale-95 drop-shadow-md"
      >
        {isOpen ? (
          // Menu එක Open වූ විට පෙන්වන 'Close' (X) ලකුණ (සුදු පාටින්)
          <div className="w-5 h-5 flex flex-col items-center justify-center relative">
            <div className="w-6 h-[2px] bg-white absolute rotate-45 transition-all duration-300 rounded-full" />
            <div className="w-6 h-[2px] bg-white absolute -rotate-45 transition-all duration-300 rounded-full" />
          </div>
        ) : (
          // Menu එක Close වී ඇති විට පෙන්වන ඉරි 3 (සුදු පාටින්)
          <div className="flex flex-col items-start justify-center gap-[5px] w-6">
            <div className="w-full h-[2px] bg-white rounded-full transition-all duration-300" />
            <div className="w-[70%] h-[2px] bg-white rounded-full transition-all duration-300" />
            <div className="w-full h-[2px] bg-white rounded-full transition-all duration-300" />
          </div>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[900] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full z-[950] 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-[310px] shrink-0 bg-[#071a33] border-r border-white/10 lg:rounded-tr-xl overflow-y-auto
        `}
      >
        <div className="p-5 relative">
          
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white text-xl"
          >
            ✕
          </button>

          <h2 className="font-serif text-sm font-bold mb-7 text-white">
            CREATE YOUR JOURNEY
          </h2>

          <SectionLabel step="STEP 1:" title="TRIP DETAILS" />

          <div className="space-y-4 mb-6">
            <label className="block">
              <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">What are you looking for?</span>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
                placeholder="Example: I want surfing places in Sri Lanka"
                className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none resize-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Start Location</span>
                <input
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Start"
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">End Location</span>
                <input
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  placeholder="End"
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Travel Date</span>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none [color-scheme:dark]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Total Days</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="Days"
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Travelers</span>
                <input
                  type="number"
                  min="1"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  placeholder="Travelers"
                  className="w-full rounded-lg bg-white/[0.07] border border-white/10 px-3 py-3 text-xs text-white outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1 mb-1 block">Transport Type</span>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value)}
                className="w-full rounded-lg bg-[#102444] border border-white/10 px-3 py-3 text-xs text-white outline-none"
              >
                <option value="car">Car</option>
                <option value="driving-car">Driving Car</option>
                <option value="foot-walking">Walking</option>
                <option value="cycling-regular">Cycling</option>
              </select>
            </label>

            <label className="flex items-center justify-between rounded-lg bg-white/[0.05] border border-white/10 px-3 py-3 text-xs text-white/75 cursor-pointer">
              <span>Use weather optimization</span>
              <input
                type="checkbox"
                checked={includeWeather}
                onChange={(e) => setIncludeWeather(e.target.checked)}
              />
            </label>
          </div>

          <SectionLabel step="STEP 2:" title="YOUR INTERESTS" />

          <div className="grid grid-cols-2 gap-2 mb-7">
            {INTERESTS.map((item) => {
              const active = activeInterests.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`h-[72px] rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    active
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-100"
                      : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[10px] leading-tight font-bold text-white/80">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <SectionLabel step="STEP 3:" title="TRAVEL STYLE" />

          <div className="grid grid-cols-2 gap-2 mb-5">
            {["Solo", "Couple", "Family", "Friends"].map((style) => (
              <button
                key={style}
                onClick={() => setTravelStyle(style)}
                className={`rounded-full py-2 text-xs border transition-all ${
                  travelStyle === style
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                    : "border-white/15 text-white/60 hover:bg-white/[0.05]"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              handleGenerateTrip();
              setIsOpen(false);
            }}
            disabled={loading}
            className="bg-cyan-400/80 text-white w-full border border-cyan-400 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-center items-center hover:bg-cyan-500 transition-colors gap-2 mb-4 cursor-pointer"
          >
            {loading ? "GENERATING..." : "Generate AI Itinerary"}
          </button>

          {error && (
            <p className="text-red-300 text-xs mb-3 leading-relaxed">{error}</p>
          )}

          {agentSummary && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 mb-4">
              <p className="text-cyan-100 text-xs leading-relaxed">
                {agentSummary}
              </p>
            </div>
          )}

          <div className="rounded-xl bg-white/[0.035] border border-white/10 p-2">
            {tripStops.slice(0, 8).map((stop, i) => (
              <button
                key={`${stop.title}-${i}`}
                onClick={() => {
                  onViewStop(i);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-3 rounded-lg border-b border-white/[0.06] last:border-none text-left ${
                  activeStop === i ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: DAY_COLORS[stop.day] || "#38bdf8" }}
                />
                <span className="flex-1 text-xs text-white/70 truncate">
                  {stop.label}
                </span>
                <span>{stop.emoji}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onViewFullItinerary();
              setIsOpen(false);
            }}
            className="w-full mt-3 h-10 rounded-lg border bg-[#03284f] border-white/10 text-xs hover:bg-white/10 transition-colors"
          >
            View Full Itinerary →
          </button>
        </div>
      </aside>
    </>
  );
}