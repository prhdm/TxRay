'use client'

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/ui'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function KPICard({ title, value, description, icon, trend, trendUp }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center mt-1">
            <Badge
              variant={trendUp !== false ? "default" : "destructive"}
              className="text-xs"
            >
              {trend}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


