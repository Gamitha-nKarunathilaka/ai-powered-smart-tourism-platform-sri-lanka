export default function Accommodation({ stops }) {
  console.log("Accommodation එකට එන ඩේටා:", stops);

  // The hook already flattens hotels into a single array
  // (accommodationsData: [{ hotel_name, image_url, price, review_score,
  // url, destination_city }, ...]) — no need to re-parse a nested
  // { result: { hotels: [...] } } shape here.
  const allHotels = (Array.isArray(stops) ? stops : []).map((hotel, index) => ({
    id: hotel.url || `${hotel.hotel_name}-${index}`,
    name: hotel.hotel_name,
    place: hotel.destination_city || hotel.destination || "Sri Lanka",
    price: hotel.price,
    score: hotel.review_score,
    url: hotel.url,

    // පින්තූරය ලබා ගැනීම සහ එහි Quality එක (square60 -> max500) වැඩි කිරීම
    image: hotel.image_url
      ? hotel.image_url.replace("square60", "max500")
      : "https://images.unsplash.com/photo-1551882547-ff40c0dfe097?w=500&q=80",
  }));

  return (
    <section className="p-5 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {allHotels.length > 0 ? (
        allHotels.map((hotel) => (
          <div
            key={hotel.id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col"
          >
            {/* 🏨 ලකුණු වෙනුවට දැන් ලස්සන, පැහැදිලි පින්තූරයක් පෙන්වයි */}
            <div className="h-36 rounded-xl bg-white/10 mb-4 overflow-hidden relative">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-1" title={hotel.name}>
              {hotel.name}
            </h3>
            <p className="text-white/50 text-xs mb-3">{hotel.place}</p>

            <div className="mt-auto">
              {hotel.score ? (
                <span className="inline-block bg-[#f4c542]/15 border border-[#f4c542]/30 text-[#f4c542] text-xs font-bold px-2 py-1 rounded-md mb-3">
                  ⭐ {hotel.score} / 10
                </span>
              ) : null}

              <p className="font-semibold text-sm">{hotel.price}</p>
            </div>

            {hotel.url && hotel.url !== "#" ? (
              <a
                href={hotel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full block text-center rounded-xl bg-[#03284f] text-[#00f2fe] border border-[#00f2fe]/30 font-bold py-2.5 text-xs hover:bg-[#00f2fe] hover:text-slate-950 transition-all duration-300 shadow-md"
              >
                View on Booking.com
              </a>
            ) : (
              <button className="mt-4 w-full rounded-lg border border-white/15 py-3 text-xs font-bold hover:bg-white/10 transition-colors cursor-not-allowed opacity-50">
                Not Available
              </button>
            )}
          </div>
        ))
      ) : (
        // හෝටල් කිසිවක් නැති විට පෙන්වන පණිවිඩය
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/50">
          <span className="text-4xl mb-3">🔍</span>
          <p>No accommodations found for this trip yet.</p>
        </div>
      )}
    </section>
  );
}