'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { DailyStats } from '../contexts/AnalyticsContext'

interface TransactionChartProps {
  data: DailyStats[]
}

export function TransactionChart({ data }: TransactionChartProps) {
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    fullDate: item.date
  })).reverse() // Reverse to show oldest first

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-medium">{format(parseISO(data.fullDate), 'MMM dd, yyyy')}</p>
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
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            className="text-xs fill-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
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


