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
  success: "bg-[#B9FF66] border-[#191A23] text-[#000000]",
  error: "bg-[#FF6B6B] border-[#191A23] text-[#000000]",
  info: "bg-[#74C0FC] border-[#191A23] text-[#000000]",
  warning: "bg-[#FFD93D] border-[#191A23] text-[#000000]",
}

const iconColorMap = {
  success: "text-[#000000]",
  error: "text-[#000000]",
  info: "text-[#000000]",
  warning: "text-[#000000]",
}

export function Notification({ notification, onRemove }: NotificationProps) {
  const Icon = iconMap[notification.type]

  return (
    <div
      className={cn(
        "relative flex items-start space-x-3 p-4 sm:p-6 rounded-3xl sm:rounded-[45px] border shadow-[0px_5px_0px_#191A23] w-full animate-in slide-in-from-top-2 duration-300",
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
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-[#191A23] hover:bg-opacity-10 transition-colors"
      >
        <X className="h-4 w-4 text-[#000000]" />
      </button>
    </div>
  )
}
