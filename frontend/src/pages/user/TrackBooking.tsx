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
import { MapPin, Car, Clock, Phone } from "lucide-react"
import { supabase } from "../../lib/supabase.ts"

const UserTrackBooking: React.FC = () => {
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
    userType: "user",
    autoConnect: true,
  })

  const booking = bookingId ? getBookingById(bookingId) : undefined
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [driverDetails, setDriverDetails] = useState<any>(null) // Driver profile details
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const defaultMapCenter = { lat: 34.0522, lng: -118.2437 } // Default to Los Angeles

  // Ref to store the Supabase subscription instance
  const supabaseSubscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!bookingId || !user?.id) return

    // 1. Socket.IO for real-time driver location and ETA
    emit("booking:track", { bookingId, userId: user.id })

    const handleDriverLocationUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        setDriverLocation(data.location)
      }
    }

    const handleEtaUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        setEta(data.eta)
        setDistance(data.distance)
      }
    }

    const handleBookingStatusUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        // Force re-fetch booking details to update status in UI
        // This is handled by BookingContext's real-time subscription,
        // but we can also trigger a re-fetch here if needed for immediate UI update.
        console.log(`Booking ${bookingId} status updated to ${data.status}`)
      }
    }

    on("driver:location:update", handleDriverLocationUpdate)
    on("ambulance:eta:update", handleEtaUpdate)
    on("booking:status:update", handleBookingStatusUpdate)

    // 2. Supabase for driver details (one-time fetch or subscription if details change frequently)
    const fetchDriverDetails = async (driverId: string) => {
      try {
        const { data, error } = await supabase
          .from("driver_profiles")
          .select("name, phone, ambulance_id, license_plate")
          .eq("user_id", driverId)
          .single()

        if (error) throw error
        setDriverDetails(data)
      } catch (err) {
        console.error("Error fetching driver details:", err)
        setDriverDetails(null)
      }
    }

    if (booking?.driver_id && !driverDetails) {
      fetchDriverDetails(booking.driver_id)
    }

    // Cleanup function for both Socket.IO and Supabase
    return () => {
      emit("booking:untrack", { bookingId })
      off("driver:location:update", handleDriverLocationUpdate)
      off("ambulance:eta:update", handleEtaUpdate)
      off("booking:status:update", handleBookingStatusUpdate)
    }
  }, [bookingId, user?.id, booking?.driver_id, emit, on, off]) // [^2][^3][^4]

  const handleCancelBooking = async () => {
    if (bookingId) {
      await updateBookingStatus(bookingId, "cancelled")
      emit("booking:status", { bookingId, status: "cancelled", userId: user?.id })
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

          {booking.driver_id && driverDetails && (
            <>
              <div className="flex items-center space-x-2">
                <Car className="text-primary" />
                <p>
                  <strong>Driver:</strong> {driverDetails.name || "N/A"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="text-primary" />
                <p>
                  <strong>Driver Phone:</strong> {driverDetails.phone || "N/A"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="text-primary" />
                <p>
                  <strong>Ambulance ID:</strong> {driverDetails.ambulance_id || "N/A"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="text-primary" />
                <p>
                  <strong>License Plate:</strong> {driverDetails.license_plate || "N/A"}
                </p>
              </div>
            </>
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

          {(booking.status === "pending" ||
            booking.status === "accepted" ||
            booking.status === "en_route" ||
            booking.status === "arrived") && (
            <div className="pt-4">
              <Button onClick={handleCancelBooking} variant="destructive" className="w-full">
                Cancel Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserTrackBooking
