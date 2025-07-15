"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext.tsx"
import { supabase } from "../../lib/supabase.ts"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import LoadingSpinner from "../../components/LoadingSpinner.tsx"

const DriverProfile: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [driverData, setDriverData] = useState<any>(null) // Replace 'any' with a proper DriverProfile type
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [ambulanceId, setAmbulanceId] = useState("")
  const [licensePlate, setLicensePlate] = useState("")

  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase.from("driver_profiles").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 means no rows found
          throw error
        }

        if (data) {
          setDriverData(data)
          setName(data.name || "")
          setPhone(data.phone || "")
          setAmbulanceId(data.ambulance_id || "")
          setLicensePlate(data.license_plate || "")
        }
      } catch (err: any) {
        console.error("Error fetching driver profile:", err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDriverProfile()
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!user) {
      setError("User not authenticated.")
      setLoading(false)
      return
    }

    const updates = {
      user_id: user.id,
      name,
      phone,
      ambulance_id: ambulanceId,
      license_plate: licensePlate,
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from("driver_profiles").upsert(updates, { onConflict: "user_id" }) // Upsert based on user_id

      if (error) throw error
      alert("Profile updated successfully!")
    } catch (err: any) {
      console.error("Error saving driver profile:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
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
      <h1 className="text-3xl font-bold mb-6">Driver Profile</h1>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ambulanceId">Ambulance ID</Label>
              <Input
                id="ambulanceId"
                type="text"
                value={ambulanceId}
                onChange={(e) => setAmbulanceId(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DriverProfile
