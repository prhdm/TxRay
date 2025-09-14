'use client'

import {
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/ui'

interface KPICardProps {
    title: string
    value: string
    description: string
    icon: React.ReactNode
    trend?: string
    trendUp?: boolean
    tooltip?: string
    className?: string
}

export function KPICard({title, value, description, icon, trend, trendUp, tooltip, className = ''}: KPICardProps) {
    return (
        <Card className={`h-full flex flex-col ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-muted-foreground">{icon}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tooltip || description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
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


