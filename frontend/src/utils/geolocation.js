// utils/geolocation.js
export function speakDirection(instruction) {
  if (!instruction || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(instruction);
  message.lang = "en-US";
  message.rate = 0.95;
  message.pitch = 1;
  window.speechSynthesis.speak(message);
}

export function getCurrentDeviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location services."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          id: "current-location",
          name: "Current Location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          type: "Live GPS Location",
          emoji: "📍",
        });
      },
      (locationError) => {
        if (locationError.code === 1) reject(new Error("Location permission was denied."));
        else if (locationError.code === 2) reject(new Error("Current location is unavailable."));
        else reject(new Error("Location request timed out."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}