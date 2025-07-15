import { io, type Socket } from "socket.io-client"

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket?.id)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason)
    })

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message)
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
