"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext.tsx"
import { useBooking } from "../../contexts/BookingContext.tsx"
import { useSocket } from "../../hooks/useSocket.tsx"
import BookingCard from "../../components/BookingCard.tsx"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"
import GoogleMap from "../../components/GoogleMap.tsx"
import { Switch } from "../../components/ui/switch"
import { Label } from "../../components/ui/label"
import { Card, CardContent } from "../../components/ui/card"

const DriverDashboard: React.FC = () => {
  const { user } = useAuth()
  const { pendingBookings, acceptBooking, loading, error } = useBooking()
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

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const defaultMapCenter = { lat: 34.0522, lng: -118.2437 } // Default to Los Angeles

  // Effect for real-time location tracking
  useEffect(() => {
    if (isAvailable && user?.id && isSocketConnected) {
      // Start sending location updates
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
            },
            (err) => {
              console.error("Error getting geolocation:", err)
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
          )
        } else {
          console.warn("Geolocation is not supported by this browser.")
          // Fallback for simulation if geolocation is not available
          setDriverLocation({
            lat: 34.0522 + (Math.random() - 0.5) * 0.01,
            lng: -118.2437 + (Math.random() - 0.5) * 0.01,
          })
          emit("driver:location", { driverId: user.id, location: driverLocation })
        }
      }, 5000) // Update every 5 seconds
    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
        locationIntervalRef.current = null
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [isAvailable, user?.id, isSocketConnected, emit, driverLocation]) // [^2][^3][^4]

  // Handle booking acceptance
  const handleAcceptBooking = async (bookingId: string) => {
    if (user?.id) {
      await acceptBooking(bookingId, user.id)
      // Optionally, emit a socket event to notify other drivers or admin
      emit("booking:status", { bookingId, status: "accepted", driverId: user.id })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>

      <div className="flex items-center space-x-2 mb-6">
        <Switch id="availability-mode" checked={isAvailable} onCheckedChange={setIsAvailable} />
        <Label htmlFor="availability-mode">{isAvailable ? "Online (Accepting Bookings)" : "Offline"}</Label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pending Booking Requests</h2>
          {pendingBookings.length === 0 ? (
            <p className="text-gray-600">No new pending bookings at the moment.</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={handleAcceptBooking}
                  showActions={true}
                  isDriverView={true}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Current Location</h2>
          <Card>
            <CardContent className="p-0">
              <GoogleMap
                center={driverLocation || defaultMapCenter}
                zoom={driverLocation ? 15 : 10}
                markers={
                  driverLocation
                    ? [
                        {
                          lat: driverLocation.lat,
                          lng: driverLocation.lng,
                          title: "Your Location",
                          icon: "/ambulance-icon.svg",
                        },
                      ]
                    : []
                }
              />
            </CardContent>
          </Card>
          <p className="text-sm text-gray-500 mt-2">
            {driverLocation
              ? `Lat: ${driverLocation.lat.toFixed(4)}, Lng: ${driverLocation.lng.toFixed(4)}`
              : "Getting location..."}
          </p>
          {!isSocketConnected && (
            <p className="text-red-500 text-sm mt-2">Socket.IO Disconnected. Real-time updates may not work.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard
