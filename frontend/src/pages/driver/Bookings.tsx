"use client"

import type React from "react"
import { useBooking } from "../../contexts/BookingContext.tsx"
import { useAuth } from "../../contexts/AuthContext.tsx"
import BookingCard from "../../components/BookingCard.tsx"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"

const DriverBookings: React.FC = () => {
  const { bookings, updateBookingStatus, loading, error } = useBooking()
  const { user } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>
  }

  const driverBookings = bookings.filter(
    (booking) => booking.driver_id === user?.id && booking.status !== "completed" && booking.status !== "cancelled",
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Active Bookings</h1>
      {driverBookings.length === 0 ? (
        <p className="text-center text-gray-600">You currently have no active bookings.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {driverBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onUpdateStatus={updateBookingStatus}
              showActions={true}
              isDriverView={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DriverBookings
