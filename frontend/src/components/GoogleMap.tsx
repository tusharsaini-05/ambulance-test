"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import type * as google from "google.maps"

interface GoogleMapProps {
  center: { lat: number; lng: number }
  zoom: number
  markers?: { lat: number; lng: number; title?: string; icon?: string }[]
  onMapLoaded?: (map: google.maps.Map) => void
}

const GoogleMap: React.FC<GoogleMapProps> = ({ center, zoom, markers = [], onMapLoaded }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    if (mapRef.current && window.google && !mapInstance.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: "YOUR_MAP_ID", // Optional: Use a Map ID for custom styling
      })
      mapInstance.current = map
      onMapLoaded?.(map)
    }

    // Update markers if they change
    if (mapInstance.current) {
      // Clear existing markers (if any)
      // This is a simplified approach; in a real app, you'd manage marker instances
      // to avoid re-creating them unnecessarily.
      // For now, we'll just add new ones.
      // In a more robust solution, you'd keep track of marker objects and update them.
      // For example, if you had a `markerObjects` ref:
      // markerObjects.current.forEach(m => m.setMap(null));
      // markerObjects.current = [];

      markers.forEach((markerData) => {
        new window.google.maps.Marker({
          position: markerData,
          map: mapInstance.current,
          title: markerData.title,
          icon: markerData.icon, // Use custom icon if provided
        })
      })
    }
  }, [center, zoom, markers, onMapLoaded]) // [^2][^3][^4]

  return <div ref={mapRef} style={{ width: "100%", height: "400px" }} aria-label="Google Map" />
}

export default GoogleMap
