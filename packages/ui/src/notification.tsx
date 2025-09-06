"use client";

import * as React from "react"
import { cn } from "./lib/utils"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { Notification as NotificationType } from "./notification-provider"

interface NotificationProps {
  notification: NotificationType
  onRemove: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
}

const iconColorMap = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
  warning: "text-yellow-600",
}

export function Notification({ notification, onRemove }: NotificationProps) {
  const Icon = iconMap[notification.type]

  return (
    <div
      className={cn(
        "relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-sm w-full mb-3 animate-in slide-in-from-right-2 duration-300",
        colorMap[notification.type]
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColorMap[notification.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.message && (
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
