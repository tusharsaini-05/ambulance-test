"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { useAuth } from "../contexts/AuthContext.tsx"

const Home: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
      <h1 className="text-5xl font-extrabold text-center mb-6 leading-tight">Your Fastest Way to Emergency Care</h1>
      <p className="text-xl text-center mb-8 max-w-2xl">
        Connect with available ambulances in real-time. Fast, reliable, and transparent emergency medical
        transportation.
      </p>
      <div className="flex space-x-4">
        {!user && (
          <>
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
              >
                Login
              </Button>
            </Link>
          </>
        )}
        {user && user.user_metadata.role === "user" && (
          <Link to="/user/book">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Book an Ambulance Now
            </Button>
          </Link>
        )}
        {user && user.user_metadata.role === "driver" && (
          <Link to="/driver/dashboard">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Go to Driver Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default Home
