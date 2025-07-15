"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useBooking } from "../../contexts/BookingContext.tsx"
import { useAuth } from "../../contexts/AuthContext.tsx"
import { useSocket } from "../../hooks/useSocket.tsx"
import GoogleMap from "../../components/GoogleMap.tsx"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { MapPin, Car, CheckCircle, XCircle, Clock } from "lucide-react"

const DriverTrackBooking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { getBookingById, updateBookingStatus, loading: bookingLoading, error: bookingError } = useBooking()
  const { user } = useAuth()
  const {
    emit,
    on,
    off,
    isConnected: isSocketConnected,
  } = useSocket({
    userId: user?.id,
    userType: "driver",
    autoConnect: true,
  })

  const booking = bookingId ? getBookingById(bookingId) : undefined
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const defaultMapCenter = { lat: 34.0522, lng: -118.2437 } // Default to Los Angeles

  useEffect(() => {
    if (!bookingId || !user?.id) return

    // Emit tracking event to server
    emit("booking:track", { bookingId, userId: user.id })

    // Listen for driver location updates
    const handleDriverLocationUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        setDriverLocation(data.location)
      }
    }

    // Listen for ETA updates
    const handleEtaUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        setEta(data.eta)
        setDistance(data.distance)
      }
    }

    on("driver:location:update", handleDriverLocationUpdate)
    on("ambulance:eta:update", handleEtaUpdate)

    // Start sending driver location updates if this driver is assigned to the booking
    if (booking?.driver_id === user.id && isSocketConnected) {
      locationIntervalRef.current = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              setDriverLocation(newLocation)
              emit("driver:location", { driverId: user.id, location: newLocation })

              // Also emit ETA if pickup location is available
              if (booking?.pickup_lat && booking?.pickup_lng) {
                // In a real app, you'd use a routing API to calculate ETA
                // For simulation, a simple distance-based ETA
                const dist = calculateDistance(newLocation, { lat: booking.pickup_lat, lng: booking.pickup_lng })
                const simulatedEtaMinutes = (dist / 40) * 60 // Assuming 40 km/h average speed
                emit("ambulance:eta", {
                  ambulanceId: user.id, // Assuming driverId is ambulanceId for simplicity
                  bookingId,
                  eta: `${Math.round(simulatedEtaMinutes)} min`,
                  distance: `${dist.toFixed(2)} km`,
                })
              }
            },
            (err) => {
              console.error("Error getting geolocation:", err)
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
          )
        } else {
          console.warn("Geolocation is not supported by this browser.")
          // Fallback for simulation if geolocation is not available
          const simulatedLoc = {
            lat: 34.0522 + (Math.random() - 0.5) * 0.01,
            lng: -118.2437 + (Math.random() - 0.5) * 0.01,
          }
          setDriverLocation(simulatedLoc)
          emit("driver:location", { driverId: user.id, location: simulatedLoc })
        }
      }, 5000) // Update every 5 seconds
    }

    return () => {
      emit("booking:untrack", { bookingId })
      off("driver:location:update", handleDriverLocationUpdate)
      off("ambulance:eta:update", handleEtaUpdate)
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [
    bookingId,
    user?.id,
    booking?.driver_id,
    booking?.pickup_lat,
    booking?.pickup_lng,
    emit,
    on,
    off,
    isSocketConnected,
  ]) // [^2][^3][^4]

  const calculateDistance = (loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }) => {
    const R = 6371 // Radius of Earth in kilometers
    const dLat = deg2rad(loc2.lat - loc1.lat)
    const dLng = deg2rad(loc2.lng - loc1.lng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  const handleUpdateStatus = async (status: string) => {
    if (bookingId && user?.id) {
      await updateBookingStatus(bookingId, status as any, user.id)
      emit("booking:status", { bookingId, status, ambulanceId: user.id })
    }
  }

  if (bookingLoading) {
    return <LoadingSpinner />
  }

  if (bookingError) {
    return <div className="text-red-500 text-center mt-8">Error: {bookingError}</div>
  }

  if (!booking) {
    return <div className="text-center mt-8">Booking not found.</div>
  }

  const mapMarkers = []
  if (booking.pickup_lat && booking.pickup_lng) {
    mapMarkers.push({ lat: booking.pickup_lat, lng: booking.pickup_lng, title: "Pickup", icon: "/marker-pickup.svg" })
  }
  if (booking.dest_lat && booking.dest_lng) {
    mapMarkers.push({
      lat: booking.dest_lat,
      lng: booking.dest_lng,
      title: "Destination",
      icon: "/marker-destination.svg",
    })
  }
  if (driverLocation) {
    mapMarkers.push({
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      title: "Driver Location",
      icon: "/ambulance-icon.svg",
    })
  }

  const currentMapCenter =
    driverLocation ||
    (booking.pickup_lat && booking.pickup_lng ? { lat: booking.pickup_lat, lng: booking.pickup_lng } : defaultMapCenter)

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Live Tracking for Booking: {booking.id.substring(0, 8)}...</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-[500px] w-full">
            <GoogleMap
              center={currentMapCenter}
              zoom={mapLoaded ? 14 : 10}
              markers={mapMarkers}
              onMapLoaded={() => setMapLoaded(true)}
            />
            {!isSocketConnected && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-sm px-3 py-1 rounded-md shadow-md">
                Offline: Real-time updates unavailable.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="text-primary" />
            <p>
              <strong>Pickup:</strong> {booking.pickup_location}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="text-primary" />
            <p>
              <strong>Destination:</strong> {booking.destination}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Car className="text-primary" />
            <p>
              <strong>Status:</strong> <span className="font-semibold">{booking.status.replace(/_/g, " ")}</span>
            </p>
          </div>
          {booking.driver_id && (
            <div className="flex items-center space-x-2">
              <Car className="text-primary" />
              <p>
                <strong>Assigned Driver:</strong> {booking.driver_id.substring(0, 8)}...
              </p>
            </div>
          )}
          {driverLocation && (
            <div className="flex items-center space-x-2">
              <MapPin className="text-primary" />
              <p>
                <strong>Driver Location:</strong> {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
          {eta && (
            <div className="flex items-center space-x-2">
              <Clock className="text-primary" />
              <p>
                <strong>ETA:</strong> {eta} ({distance})
              </p>
            </div>
          )}

          <div className="pt-4 space-y-2">
            {booking.status === "accepted" && (
              <Button onClick={() => handleUpdateStatus("en_route")} className="w-full">
                <Car className="mr-2 h-4 w-4" /> Mark En Route
              </Button>
            )}
            {booking.status === "en_route" && (
              <Button onClick={() => handleUpdateStatus("arrived")} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Arrived
              </Button>
            )}
            {booking.status === "arrived" && (
              <Button onClick={() => handleUpdateStatus("completed")} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Completed
              </Button>
            )}
            {(booking.status === "accepted" || booking.status === "en_route" || booking.status === "arrived") && (
              <Button onClick={() => handleUpdateStatus("cancelled")} variant="destructive" className="w-full">
                <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DriverTrackBooking
