import type React from "react"

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
      <p>&copy; {new Date().getFullYear()} Ambulance Finder. All rights reserved.</p>
    </footer>
  )
}

export default Footer
