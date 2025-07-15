// This script loads the Google Maps API asynchronously.
// Replace YOUR_API_KEY with your actual Google Maps API Key.
// Ensure this script is loaded before any component that uses `window.google.maps`.

function loadGoogleMapsScript() {
  const script = document.createElement("script")
  script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places` // Add 'places' library if needed
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

// Only load the script if it hasn't been loaded already
if (!window.google) {
  loadGoogleMapsScript()
}
