import type React from "react"
import { Outlet } from "react-router-dom"
import Header from "./Header.tsx"
import Footer from "./Footer.tsx"

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
