"use client";

import * as React from "react"

export type NotificationType = "success" | "error" | "info" | "warning"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  timestamp: number
}

type NotificationProviderProps = {
  children: React.ReactNode
}

type NotificationProviderState = {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const initialState: NotificationProviderState = {
  notifications: [],
  addNotification: () => null,
  removeNotification: () => null,
  clearNotifications: () => null,
}

const NotificationProviderContext = React.createContext<NotificationProviderState>(initialState)

export function NotificationProvider({
  children,
  ...props
}: NotificationProviderProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Use a ref to store the latest removeNotification function
  const removeNotificationRef = React.useRef(removeNotification)
  React.useEffect(() => {
    removeNotificationRef.current = removeNotification
  })

  const addNotification = React.useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration ?? 5000, // Default 5 seconds
      }

      setNotifications((prev) => {
        // Prevent duplicate notifications of the same type within a short time
        const recentNotification = prev.find(n =>
          n.type === newNotification.type &&
          n.title === newNotification.title &&
          Date.now() - n.timestamp < 1000 // 1 second window
        )

        if (recentNotification) {
          return prev // Don't add duplicate
        }

        return [...prev, newNotification]
      })

      // Auto remove after duration
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotificationRef.current(id)
        }, newNotification.duration)
      }
    },
    [] // No dependencies to prevent infinite loops
  )

  const clearNotifications = React.useCallback(() => {
    setNotifications([])
  }, [])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  }

  return (
    <NotificationProviderContext.Provider {...props} value={value}>
      {children}
    </NotificationProviderContext.Provider>
  )
}

export const useNotification = () => {
  const context = React.useContext(NotificationProviderContext)

  if (context === undefined)
    throw new Error("useNotification must be used within a NotificationProvider")

  return context
}
