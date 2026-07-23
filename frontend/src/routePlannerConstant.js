// roadPlannerConstants.js  (place at src/ root — sibling to constant.js)
/*
  Project root .env file:
  VITE_ORS_API_KEY=your_full_openrouteservice_key

  Restart Vite after editing .env:
  npm run dev
*/

export const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

export const DESTINATIONS = [
  { id: 1, name: "Colombo", lat: 6.9271, lng: 79.8612, type: "City", emoji: "🏙️" },
  { id: 2, name: "Sigiriya", lat: 7.957, lng: 80.7603, type: "Heritage", emoji: "🪨" },
  { id: 3, name: "Kandy", lat: 7.2906, lng: 80.6337, type: "Culture", emoji: "🛕" },
  { id: 4, name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891, type: "Mountain", emoji: "🍃" },
  { id: 5, name: "Ella", lat: 6.8667, lng: 81.0466, type: "Hiking", emoji: "🌄" },
  { id: 6, name: "Mirissa", lat: 5.9483, lng: 80.455, type: "Beach", emoji: "🐋" },
  { id: 7, name: "Galle", lat: 6.0269, lng: 80.217, type: "Fort", emoji: "🏰" },
];