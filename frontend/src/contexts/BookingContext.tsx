"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./AuthContext.tsx"

interface Booking {
  id: string
  user_id: string
  pickup_location: string
  destination: string
  status: "pending" | "accepted" | "en_route" | "arrived" | "completed" | "cancelled"
  driver_id: string | null
  created_at: string
  pickup_lat: number
  pickup_lng: number
  dest_lat: number
  dest_lng: number
}

interface BookingContextType {
  bookings: Booking[]
  pendingBookings: Booking[]
  createBooking: (
    pickup: string,
    destination: string,
    pickupCoords: { lat: number; lng: number },
    destCoords: { lat: number; lng: number },
  ) => Promise<Booking | null>
  updateBookingStatus: (bookingId: string, status: Booking["status"], driverId?: string) => Promise<void>
  acceptBooking: (bookingId: string, driverId: string) => Promise<void>
  getBookingById: (bookingId: string) => Booking | undefined
  loading: boolean
  error: string | null
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!user) {
      setBookings([])
      setPendingBookings([])
      setLoading(false)
      return
    }

    try {
      if (user.user_metadata.role === "user") {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setBookings(data || [])
      } else if (user.user_metadata.role === "driver") {
        // Fetch bookings assigned to this driver
        const { data: driverBookings, error: driverBookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false })

        if (driverBookingsError) throw driverBookingsError
        setBookings(driverBookings || [])

        // Fetch pending bookings for drivers to accept
        const { data: pending, error: pendingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "pending")
          .is("driver_id", null) // Only show unassigned pending bookings
          .order("created_at", { ascending: false })

        if (pendingError) throw pendingError
        setPendingBookings(pending || [])
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBookings()

    // Realtime subscription for bookings
    const bookingChannel = supabase
      .channel("public:bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, (payload) => {
        console.log("Change received!", payload)
        fetchBookings() // Re-fetch bookings on any change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bookingChannel)
    }
  }, [fetchBookings])

  const createBooking = async (
    pickup: string,
    destination: string,
    pickupCoords: { lat: number; lng: number },
    destCoords: { lat: number; lng: number },
  ) => {
    if (!user) {
      setError("User not authenticated.")
      return null
    }
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          pickup_location: pickup,
          destination: destination,
          status: "pending", // Bookings start as pending, unassigned
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          dest_lat: destCoords.lat,
          dest_lng: destCoords.lng,
        })
        .select()
        .single()

      if (error) throw error
      return data as Booking
    } catch (err: any) {
      console.error("Error creating booking:", err.message)
      setError(err.message)
      return null
    }
  }

  const updateBookingStatus = async (bookingId: string, status: Booking["status"], driverId?: string) => {
    try {
      const updateData: { status: Booking["status"]; driver_id?: string | null } = { status }
      if (driverId !== undefined) {
        updateData.driver_id = driverId
      }

      const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

      if (error) throw error
      fetchBookings() // Re-fetch to update state
    } catch (err: any) {
      console.error("Error updating booking status:", err.message)
      setError(err.message)
    }
  }

  const acceptBooking = async (bookingId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "accepted", driver_id: driverId })
        .eq("id", bookingId)
        .eq("status", "pending") // Only accept pending bookings

      if (error) throw error
      fetchBookings() // Re-fetch to update state
    } catch (err: any) {
      console.error("Error accepting booking:", err.message)
      setError(err.message)
    }
  }

  const getBookingById = (bookingId: string) => {
    return bookings.find((b) => b.id === bookingId) || pendingBookings.find((b) => b.id === bookingId)
  }

  return (
    <BookingContext.Provider
      value={{
        bookings,
        pendingBookings,
        createBooking,
        updateBookingStatus,
        acceptBooking,
        getBookingById,
        loading,
        error,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}
