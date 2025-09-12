"use client";

import * as React from "react"
import { useNotification } from "./notification-provider"
import { Notification } from "./notification"

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-3 max-w-md w-full px-4">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  )
}
