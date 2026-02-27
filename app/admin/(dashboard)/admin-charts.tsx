"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import type { DailyCount } from "@/lib/admin-metrics"

interface AdminChartsProps {
  checkInsByDay: DailyCount[]
  signupsByDay: DailyCount[]
}

export function AdminCharts({ checkInsByDay, signupsByDay }: AdminChartsProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Check-ins per day (last 14 days)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={checkInsByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v ? String(v).slice(5) : "")}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v) => v}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Check-ins"
                stroke="rgb(39 39 42)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Signups per day (last 14 days)
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signupsByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v ? String(v).slice(5) : "")}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v) => v}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Signups"
                stroke="rgb(39 39 42)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
