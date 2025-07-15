"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface Location {
  lat: number
  lng: number
}

const AMBULANCE_SPEED_KMH = 60 // Kilometers per hour
const UPDATE_INTERVAL_MS = 2000 // Update every 2 seconds

const AmbulanceSimulator: React.FC = () => {
  const [ambulanceId, setAmbulanceId] = useState<string>("")
  const [driverId, setDriverId] = useState<string>("")
  const [currentLocation, setCurrentLocation] = useState<Location>({ lat: 0, lng: 0 })
  const [targetLocation, setTargetLocation] = useState<Location | null>(null)
  const [bookingId, setBookingId] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

  useEffect(() => {
    if (isConnected && isSimulating && targetLocation) {
      intervalRef.current = setInterval(() => {
        setCurrentLocation((prevLoc) => {
          const distanceLat = targetLocation.lat - prevLoc.lat
          const distanceLng = targetLocation.lng - prevLoc.lng
          const totalDistanceKm = calculateDistance(prevLoc, targetLocation)

          if (totalDistanceKm < 0.01) {
            // Close enough to target
            clearInterval(intervalRef.current!)
            setIsSimulating(false)
            console.log("Ambulance arrived at target location.")
            return targetLocation
          }

          const timeToTravelHour = UPDATE_INTERVAL_MS / (1000 * 60 * 60) // Time in hours for one step
          const distancePerStepKm = AMBULANCE_SPEED_KMH * timeToTravelHour

          const ratio = distancePerStepKm / totalDistanceKm

          const newLat = prevLoc.lat + distanceLat * ratio
          const newLng = prevLoc.lng + distanceLng * ratio

          const newLocation = { lat: newLat, lng: newLng }

          if (socketRef.current) {
            socketRef.current.emit("ambulance:location", {
              ambulanceId,
              location: newLocation,
              bookingId,
            })
          }
          return newLocation
        })
      }, UPDATE_INTERVAL_MS)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isConnected, isSimulating, targetLocation, ambulanceId, bookingId]) // [^2][^3][^4]

  const calculateDistance = (loc1: Location, loc2: Location) => {
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

  const handleConnect = () => {
    if (!ambulanceId || !driverId) {
      alert("Please enter Ambulance ID and Driver ID.")
      return
    }
    if (socketRef.current && socketRef.current.connected) {
      console.log("Already connected.")
      return
    }

    const socket = io(SERVER_URL)
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Simulator connected to Socket.IO server")
      setIsConnected(true)
      socket.emit("ambulance:connect", { ambulanceId, driverId })
    })

    socket.on("disconnect", () => {
      console.log("Simulator disconnected from Socket.IO server")
      setIsConnected(false)
      setIsSimulating(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    })

    socket.on("ambulance:connected", (data) => {
      console.log("Ambulance connected confirmation:", data)
    })

    socket.on("booking:assigned", (data) => {
      console.log("Booking assigned to this ambulance:", data)
      setBookingId(data.bookingId)
      if (data.location) {
        setCurrentLocation(data.location)
      }
    })

    socket.on("booking:status:update", (data) => {
      console.log("Booking status update:", data)
      if (data.status === "en_route" && data.bookingId === bookingId) {
        // In a real scenario, you'd get the destination from the booking details
        // For simulation, let's assume a fixed target or get it from a mock API
        // For now, we'll just stop simulation if it's not 'en_route'
      }
    })
  }

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
  }

  const handleStartSimulation = () => {
    if (!isConnected) {
      alert("Please connect to the server first.")
      return
    }
    if (!bookingId) {
      alert("Please enter a Booking ID to simulate movement for.")
      return
    }
    if (currentLocation.lat === 0 && currentLocation.lng === 0) {
      alert("Please set an initial location (e.g., 34.0522, -118.2437).")
      return
    }
    if (!targetLocation || (targetLocation.lat === 0 && targetLocation.lng === 0)) {
      alert("Please set a target location (e.g., 34.06, -118.25).")
      return
    }
    setIsSimulating(true)
    console.log("Starting simulation...")
  }

  const handleStopSimulation = () => {
    setIsSimulating(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    console.log("Stopping simulation.")
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-8">
      <CardHeader>
        <CardTitle>Ambulance Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ambulanceId">Ambulance ID</Label>
            <Input
              id="ambulanceId"
              value={ambulanceId}
              onChange={(e) => setAmbulanceId(e.target.value)}
              placeholder="e.g., amb-001"
            />
          </div>
          <div>
            <Label htmlFor="driverId">Driver ID</Label>
            <Input
              id="driverId"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="e.g., driver-123"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentLat">Current Lat</Label>
            <Input
              id="currentLat"
              type="number"
              value={currentLocation.lat}
              onChange={(e) => setCurrentLocation({ ...currentLocation, lat: Number.parseFloat(e.target.value) })}
              placeholder="e.g., 34.0522"
            />
          </div>
          <div>
            <Label htmlFor="currentLng">Current Lng</Label>
            <Input
              id="currentLng"
              type="number"
              value={currentLocation.lng}
              onChange={(e) => setCurrentLocation({ ...currentLocation, lng: Number.parseFloat(e.target.value) })}
              placeholder="e.g., -118.2437"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetLat">Target Lat</Label>
            <Input
              id="targetLat"
              type="number"
              value={targetLocation?.lat || ""}
              onChange={(e) => setTargetLocation({ ...targetLocation, lat: Number.parseFloat(e.target.value) })}
              placeholder="e.g., 34.06"
            />
          </div>
          <div>
            <Label htmlFor="targetLng">Target Lng</Label>
            <Input
              id="targetLng"
              type="number"
              value={targetLocation?.lng || ""}
              onChange={(e) => setTargetLocation({ ...targetLocation, lng: Number.parseFloat(e.target.value) })}
              placeholder="e.g., -118.25"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bookingId">Booking ID (for tracking)</Label>
          <Input
            id="bookingId"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConnect} disabled={isConnected}>
            Connect
          </Button>
          <Button onClick={handleDisconnect} disabled={!isConnected} variant="outline">
            Disconnect
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartSimulation} disabled={!isConnected || isSimulating}>
            Start Simulation
          </Button>
          <Button onClick={handleStopSimulation} disabled={!isSimulating} variant="outline">
            Stop Simulation
          </Button>
        </div>
        <p>Connection Status: {isConnected ? "Connected" : "Disconnected"}</p>
        <p>Simulation Status: {isSimulating ? "Running" : "Stopped"}</p>
        <p>
          Current Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
        </p>
      </CardContent>
    </Card>
  )
}

export default AmbulanceSimulator
