"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext.tsx"
import { useBooking } from "../../contexts/BookingContext.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"

const UserDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const { bookings, loading: bookingLoading, error: bookingError } = useBooking()

  const activeBookings = bookings.filter(
    (booking) => booking.status !== "completed" && booking.status !== "cancelled" && booking.status !== "pending", // Pending bookings are not "active" for user dashboard until accepted
  )
  const pendingBookings = bookings.filter((booking) => booking.status === "pending")

  if (authLoading || bookingLoading) {
    return <LoadingSpinner />
  }

  if (bookingError) {
    return <div className="text-red-500 text-center mt-8">Error: {bookingError}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Book an Ambulance</CardTitle>
            <CardDescription>Request an ambulance for your current or specified location.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/user/book">
              <Button className="w-full">Book Now</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
            <CardDescription>View and track your ongoing ambulance requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeBookings.length > 0 ? (
              <ul className="space-y-2">
                {activeBookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between items-center">
                    <span>
                      Booking {booking.id.substring(0, 8)}... - {booking.status.replace(/_/g, " ")}
                    </span>
                    <Link to={`/user/track/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No active bookings.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Bookings</CardTitle>
            <CardDescription>Bookings awaiting driver acceptance.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <ul className="space-y-2">
                {pendingBookings.map((booking) => (
                  <li key={booking.id} className="flex justify-between items-center">
                    <span>
                      Booking {booking.id.substring(0, 8)}... - {booking.status.replace(/_/g, " ")}
                    </span>
                    <Link to={`/user/track/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View Status
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No pending bookings.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>Review your past ambulance requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/user/history">
              <Button variant="outline" className="w-full bg-transparent">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserDashboard
