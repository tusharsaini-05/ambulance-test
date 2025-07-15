"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { format } from "date-fns"

interface BookingCardProps {
  booking: {
    id: string
    pickup_location: string
    destination: string
    status: string
    created_at: string
    driver_id?: string | null
  }
  onAccept?: (bookingId: string) => void
  onUpdateStatus?: (bookingId: string, status: string) => void
  showActions?: boolean
  isDriverView?: boolean
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onAccept,
  onUpdateStatus,
  showActions = false,
  isDriverView = false,
}) => {
  const formattedDate = format(new Date(booking.created_at), "MMM dd, yyyy HH:mm")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500"
      case "accepted":
      case "en_route":
      case "arrived":
        return "text-blue-500"
      case "completed":
        return "text-green-500"
      case "cancelled":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Booking ID: {booking.id.substring(0, 8)}...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          <strong>Pickup:</strong> {booking.pickup_location}
        </p>
        <p>
          <strong>Destination:</strong> {booking.destination}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={getStatusColor(booking.status)}>{booking.status.replace(/_/g, " ")}</span>
        </p>
        {booking.driver_id && (
          <p>
            <strong>Driver ID:</strong> {booking.driver_id.substring(0, 8)}...
          </p>
        )}
        <p>
          <strong>Booked On:</strong> {formattedDate}
        </p>

        {showActions && isDriverView && booking.status === "pending" && (
          <Button onClick={() => onAccept?.(booking.id)} className="w-full mt-4">
            Accept Booking
          </Button>
        )}

        {showActions && isDriverView && booking.status === "accepted" && (
          <Button onClick={() => onUpdateStatus?.(booking.id, "en_route")} className="w-full mt-4">
            Mark En Route
          </Button>
        )}

        {showActions && isDriverView && booking.status === "en_route" && (
          <Button onClick={() => onUpdateStatus?.(booking.id, "arrived")} className="w-full mt-4">
            Mark Arrived
          </Button>
        )}

        {showActions && isDriverView && booking.status === "arrived" && (
          <Button onClick={() => onUpdateStatus?.(booking.id, "completed")} className="w-full mt-4">
            Mark Completed
          </Button>
        )}

        {showActions &&
          isDriverView &&
          (booking.status === "accepted" || booking.status === "en_route" || booking.status === "arrived") && (
            <Button
              onClick={() => onUpdateStatus?.(booking.id, "cancelled")}
              variant="destructive"
              className="w-full mt-2"
            >
              Cancel Booking
            </Button>
          )}
      </CardContent>
    </Card>
  )
}

export default BookingCard
