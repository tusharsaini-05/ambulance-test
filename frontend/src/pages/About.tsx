import type React from "react"

const About: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">About Ambulance Finder</h1>
      <p className="text-lg mb-4">
        Ambulance Finder is a modern web application designed to streamline the process of requesting and dispatching
        ambulances. Our goal is to provide a fast, reliable, and transparent service for emergency medical
        transportation.
      </p>
      <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
      <p className="text-base mb-4">
        To connect users in need with available ambulance services efficiently, reducing response times and improving
        emergency care outcomes. We leverage real-time tracking and communication to ensure both users and drivers have
        the information they need.
      </p>
      <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Real-time ambulance tracking</li>
        <li>Easy booking process for users</li>
        <li>Driver dashboard for accepting and managing bookings</li>
        <li>Secure user authentication</li>
        <li>Booking history for users</li>
        <li>Live status updates for bookings</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-3">Technology Stack</h2>
      <p className="text-base">
        This application is built using React for the frontend, powered by Vite for a fast development experience. The
        backend utilizes Node.js with Express and Socket.IO for real-time communication. Supabase is used for database
        management and authentication.
      </p>
    </div>
  )
}

export default About
