'use client'

import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'
import {format} from 'date-fns'
import {DailyStats} from '@/features/analytics/types'

interface TransactionChartProps {
    data: DailyStats[]
}

export function TransactionChart({data}: TransactionChartProps) {
    // Check if all data has zero values (no actual transactions)
    const hasAnyData = data.some(item => item.total_txs > 0 || item.successful_txs > 0 || item.failed_txs > 0)

    // If no data, show a message instead of an empty chart
    if (!hasAnyData) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                    <p className="text-lg font-medium">No Transaction Data</p>
                    <p className="text-sm">No transactions recorded for the selected period</p>
                </div>
            </div>
        )
    }

    const chartData = data.map((item, index) => {
        try {
            // Parse the date - it should be in YYYY-MM-DD format
            let formattedDate = 'Invalid Date'
            let fullDate = item.date

            if (item.date) {
                // Parse as YYYY-MM-DD format
                const dateObj = new Date(item.date + 'T00:00:00') // Add time to ensure proper parsing

                if (!isNaN(dateObj.getTime())) {
                    formattedDate = format(dateObj, 'MMM dd')
                    fullDate = dateObj.toISOString()
                } else {
                    // Fallback if parsing fails
                    const fallbackDate = new Date()
                    fallbackDate.setDate(fallbackDate.getDate() - (data.length - index - 1))
                    formattedDate = format(fallbackDate, 'MMM dd')
                    fullDate = fallbackDate.toISOString()
                }
            } else {
                // No date provided, use fallback
                const fallbackDate = new Date()
                fallbackDate.setDate(fallbackDate.getDate() - (data.length - index - 1))
                formattedDate = format(fallbackDate, 'MMM dd')
                fullDate = fallbackDate.toISOString()
            }

            return {
                ...item,
                date: formattedDate,
                fullDate: fullDate
            }
        } catch (error) {
            console.error('Error formatting date:', item.date, error)
            // Use fallback date
            const fallbackDate = new Date()
            fallbackDate.setDate(fallbackDate.getDate() - (data.length - index - 1))
            return {
                ...item,
                date: format(fallbackDate, 'MMM dd'),
                fullDate: fallbackDate.toISOString()
            }
        }
    }).reverse() // Reverse to show oldest first

    const CustomTooltip = ({active, payload, label}: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload

            // Safely format the date
            let formattedDate = 'Invalid Date'
            try {
                if (data.fullDate && data.fullDate !== 'Invalid Date') {
                    const dateObj = new Date(data.fullDate)
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = format(dateObj, 'MMM dd, yyyy')
                    }
                }
            } catch (error) {
                console.error('Error formatting tooltip date:', data.fullDate, error)
            }

            return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                    <p className="font-medium">{formattedDate}</p>
                    <p className="text-sm text-green-600">
                        Successful: {data.successful_txs?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-red-600">
                        Failed: {data.failed_txs?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-blue-600">
                        Total: {data.total_txs?.toLocaleString() || 0}
                    </p>
                </div>
            )
        }
        return null
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
            </div>
        )
    }

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="successfulGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted"/>
                    <XAxis
                        dataKey="date"
                        className="text-xs fill-muted-foreground"
                        tick={{fontSize: 12}}
                    />
                    <YAxis
                        className="text-xs fill-muted-foreground"
                        tick={{fontSize: 12}}
                    />
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area
                        type="monotone"
                        dataKey="successful_txs"
                        stackId="1"
                        stroke="#10b981"
                        fill="url(#successfulGradient)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="failed_txs"
                        stackId="1"
                        stroke="#ef4444"
                        fill="url(#failedGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}


