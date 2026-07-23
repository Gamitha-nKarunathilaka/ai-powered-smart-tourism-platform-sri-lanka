"""
Shared geocoding cache used by route_service.py and seasonality_service.py.

Two layers, checked in order:
1. KNOWN_CITY_COORDS — hardcoded coordinates for common Sri Lanka cities/
   towns. Zero I/O, zero network calls, instant.
2. Persistent JSON file cache — survives server restarts (unlike
   functools.lru_cache, which resets to empty every time the process
   starts). Anything geocoded once via the external API gets written
   here and reused forever after, across restarts.

recomender_service.py doesn't need this cache the same way, since its
places come from a fixed, known set of 76 locations — those should be
precomputed once (offline, in the notebook) and stored directly in the
model .pkl, which is faster still (no cache lookup, no file I/O at all).
This module is for the more open-ended inputs: user-typed start/end
locations (route_service.py) and per-place seasonality lookups.
"""

import json
import os
import threading

_CACHE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "geocode_cache.json")
)
_lock = threading.Lock()
_cache = None

# Common Sri Lanka cities/towns likely to be typed as start/end locations
# or destination cities. Extend this list freely — every entry here is
# one less network round trip, permanently.
KNOWN_CITY_COORDS = {
    "colombo": (6.9271, 79.8612),
    "galle": (6.0535, 80.2210),
    "kandy": (7.2906, 80.6337),
    "negombo": (7.2083, 79.8358),
    "jaffna": (9.6615, 80.0255),
    "trincomalee": (8.5874, 81.2152),
    "batticaloa": (7.7170, 81.7000),
    "matara": (5.9549, 80.5550),
    "anuradhapura": (8.3114, 80.4037),
    "polonnaruwa": (7.9403, 81.0188),
    "nuwara eliya": (6.9497, 80.7891),
    "ella": (6.8667, 81.0466),
    "sigiriya": (7.9570, 80.7603),
    "mirissa": (5.9483, 80.4550),
    "bentota": (6.4260, 79.9957),
    "hikkaduwa": (6.1407, 80.1012),
    "unawatuna": (6.0212, 80.2503),
    "arugam bay": (6.8404, 81.8368),
    "kalutara": (6.5831, 79.9593),
    "ratnapura": (6.6828, 80.3992),
    "badulla": (6.9934, 81.0550),
    "kurunegala": (7.4863, 80.3623),
    "puttalam": (8.0362, 79.8283),
    "hambantota": (6.1246, 81.1185),
    "dambulla": (7.8675, 80.6517),
    "habarana": (8.0362, 80.7492),
    "ampara": (7.2975, 81.6747),
    "chilaw": (7.5758, 79.7953),
    "kalpitiya": (8.2333, 79.7667),
    "weligama": (5.9739, 80.4297),
    "tangalle": (6.0244, 80.7947),
}


def _load_cache():
    global _cache
    if _cache is not None:
        return _cache

    if os.path.exists(_CACHE_PATH):
        try:
            with open(_CACHE_PATH, "r", encoding="utf-8") as f:
                _cache = json.load(f)
        except Exception:
            _cache = {}
    else:
        _cache = {}

    return _cache


def _save_cache():
    os.makedirs(os.path.dirname(_CACHE_PATH), exist_ok=True)
    with _lock:
        with open(_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(_cache, f, ensure_ascii=False, indent=2)


def get_cached_coords(query):
    """
    Returns (lat, lng) tuple if known, else None. Checks the hardcoded
    city list first (instant), then the persistent JSON cache.
    """
    key = str(query or "").strip().lower()
    if not key:
        return None

    if key in KNOWN_CITY_COORDS:
        return KNOWN_CITY_COORDS[key]

    cache = _load_cache()
    if key in cache:
        value = cache[key]
        return tuple(value) if value is not None else None

    return None


def set_cached_coords(query, lat, lng):
    """
    Persist a geocoding result (or a confirmed miss, as None) to the JSON
    cache file so future server runs don't need to hit the API again for
    the same query.
    """
    key = str(query or "").strip().lower()
    if not key:
        return

    cache = _load_cache()
    cache[key] = [lat, lng] if (lat is not None and lng is not None) else None
    _save_cache()