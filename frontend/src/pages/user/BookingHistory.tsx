import type React from "react"
import { useBooking } from "../../contexts/BookingContext.tsx"
import BookingCard from "../../components/BookingCard.tsx"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"

const UserBookingHistory: React.FC = () => {
  const { bookings, loading, error } = useBooking()

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Booking History</h1>
      {bookings.length === 0 ? (
        <p className="text-center text-gray-600">You have no past bookings.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserBookingHistory
