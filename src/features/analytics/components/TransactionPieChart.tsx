'use client'

import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts'
import {Transaction} from '@/features/analytics/types'

interface TransactionPieChartProps {
    transactions: Transaction[]
}

const COLORS = [
    '#B9FF66', '#191A23', '#0088FE', '#00C49F', 
    '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'
]

export function TransactionPieChart({transactions}: TransactionPieChartProps) {
    // Analyze transaction methods/types
    const methodStats = transactions.reduce((acc, tx) => {
        const method = tx.method || (tx.to ? 'Transfer' : 'Contract Deploy')
        acc[method] = (acc[method] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const chartData = Object.entries(methodStats)
        .map(([name, value]) => ({name, value}))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 8) // Top 8 methods

    // Function to get color for specific methods
    const getMethodColor = (methodName: string, index: number) => {
        if (methodName.toLowerCase() === 'mint') return '#B9FF66'
        if (methodName.toLowerCase() === 'upgradetokento') return '#191A23'
        return COLORS[index % COLORS.length]
    }

    const CustomTooltip = ({active, payload}: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {data.value} transactions ({((data.value / transactions.length) * 100).toFixed(1)}%)
                    </p>
                </div>
            )
        }
        return null
    }

    if (transactions.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No transaction data available
            </div>
        )
    }

    return (
        <div className="w-full h-[400px] flex flex-col items-center justify-center focus:outline-none focus:ring-0 focus:border-0 outline-none ring-0 border-0">
            <ResponsiveContainer width="100%" height="100%" className="focus:outline-none outline-none">
                <PieChart style={{ outline: 'none' }}>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getMethodColor(entry.name, index)}/>
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {chartData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: getMethodColor(item.name, index)}}
                        />
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-auto">
               {item.value as number}
            </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

