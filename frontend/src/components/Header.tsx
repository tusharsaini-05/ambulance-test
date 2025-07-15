"use client"

import type React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.tsx"
import { Button } from "./ui/button" // Assuming shadcn/ui button

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  return (
    <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        Ambulance Finder
      </Link>
      <nav className="flex items-center space-x-4">
        {user ? (
          <>
            {user.user_metadata.role === "user" && (
              <>
                <Link to="/user/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <Link to="/user/book" className="hover:underline">
                  Book Ambulance
                </Link>
                <Link to="/user/history" className="hover:underline">
                  History
                </Link>
              </>
            )}
            {user.user_metadata.role === "driver" && (
              <>
                <Link to="/driver/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <Link to="/driver/bookings" className="hover:underline">
                  My Bookings
                </Link>
                <Link to="/driver/profile" className="hover:underline">
                  Profile
                </Link>
              </>
            )}
            <Button onClick={handleSignOut} variant="secondary" size="sm">
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
            <Link to="/about" className="hover:underline">
              About
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default Header
