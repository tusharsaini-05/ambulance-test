"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext.tsx"
import Layout from "./components/Layout.tsx"
import Home from "./pages/Home.tsx"
import About from "./pages/About.tsx"
import Login from "./pages/auth/Login.tsx"
import Register from "./pages/auth/Register.tsx"
import UserDashboard from "./pages/user/Dashboard.tsx"
import BookAmbulance from "./pages/user/BookAmbulance.tsx"
import UserBookingHistory from "./pages/user/BookingHistory.tsx"
import UserTrackBooking from "./pages/user/TrackBooking.tsx"
import DriverDashboard from "./pages/driver/Dashboard.tsx"
import DriverBookings from "./pages/driver/Bookings.tsx"
import DriverProfile from "./pages/driver/Profile.tsx"
import DriverTrackBooking from "./pages/driver/TrackBooking.tsx"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading application...</div> // Or a proper loading spinner
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* User Routes */}
          <Route
            path="user/dashboard"
            element={user && user.user_metadata.role === "user" ? <UserDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="user/book"
            element={user && user.user_metadata.role === "user" ? <BookAmbulance /> : <Navigate to="/login" />}
          />
          <Route
            path="user/history"
            element={user && user.user_metadata.role === "user" ? <UserBookingHistory /> : <Navigate to="/login" />}
          />
          <Route
            path="user/track/:bookingId"
            element={user && user.user_metadata.role === "user" ? <UserTrackBooking /> : <Navigate to="/login" />}
          />

          {/* Driver Routes */}
          <Route
            path="driver/dashboard"
            element={user && user.user_metadata.role === "driver" ? <DriverDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="driver/bookings"
            element={user && user.user_metadata.role === "driver" ? <DriverBookings /> : <Navigate to="/login" />}
          />
          <Route
            path="driver/profile"
            element={user && user.user_metadata.role === "driver" ? <DriverProfile /> : <Navigate to="/login" />}
          />
          <Route
            path="driver/track/:bookingId"
            element={user && user.user_metadata.role === "driver" ? <DriverTrackBooking /> : <Navigate to="/login" />}
          />

          {/* Redirect authenticated users from login/register */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate to={user.user_metadata.role === "user" ? "/user/dashboard" : "/driver/dashboard"} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
