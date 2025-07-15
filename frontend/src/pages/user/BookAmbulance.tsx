"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useBooking } from "../../contexts/BookingContext.tsx"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"

const BookAmbulance: React.FC = () => {
  const [pickupLocation, setPickupLocation] = useState("")
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createBooking } = useBooking()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // For simplicity, using dummy coordinates. In a real app, you'd use a geocoding service.
    const dummyPickupCoords = {
      lat: 34.0522 + (Math.random() - 0.5) * 0.01,
      lng: -118.2437 + (Math.random() - 0.5) * 0.01,
    }
    const dummyDestCoords = {
      lat: 34.0622 + (Math.random() - 0.5) * 0.01,
      lng: -118.2537 + (Math.random() - 0.5) * 0.01,
    }

    try {
      const newBooking = await createBooking(pickupLocation, destination, dummyPickupCoords, dummyDestCoords)
      if (newBooking) {
        navigate(`/user/track/${newBooking.id}`)
      } else {
        setError("Failed to create booking. Please try again.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Book an Ambulance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <Input
                id="pickupLocation"
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g., 123 Main St, City"
                required
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g., Hospital Name, City"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner /> : "Request Ambulance"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default BookAmbulance
