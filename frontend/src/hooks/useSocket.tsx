"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

interface SocketHookOptions {
  userId?: string
  userType?: "user" | "driver" | "ambulance"
  ambulanceId?: string
  driverId?: string
  autoConnect?: boolean
}

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

export const useSocket = (options?: SocketHookOptions) => {
  const { userId, userType, ambulanceId, driverId, autoConnect = true } = options || {}
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Socket already connected.")
      return
    }

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
      setIsConnected(true)
      setError(null)

      if (userType === "user" && userId) {
        socket.emit("user:connect", { userId, userType })
      } else if (userType === "driver" && userId) {
        socket.emit("user:connect", { userId, userType })
      } else if (userType === "ambulance" && ambulanceId && driverId) {
        socket.emit("ambulance:connect", { ambulanceId, driverId })
      }
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
      setError(`Disconnected: ${reason}`)
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setError(`Connection error: ${err.message}`)
    })

    socket.on("connection:confirmed", (data) => {
      console.log("Connection confirmed by server:", data)
    })

    socket.on("ambulance:connected", (data) => {
      console.log("Ambulance connected confirmation:", data)
    })

    socket.on("pong", () => {
      // console.log('Received pong from server');
    })

    // Ping server periodically to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping")
      }
    }, 25000) // Ping every 25 seconds

    return () => {
      clearInterval(pingInterval)
    }
  }, [userId, userType, ambulanceId, driverId]) // [^2][^3][^4]

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Socket not connected, cannot emit event: ${event}`)
    }
  }, [])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  return { socket: socketRef.current, isConnected, error, emit, on, off, connect, disconnect }
}
