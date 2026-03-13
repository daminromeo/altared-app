'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

const CHART_COLORS = [
  '#8B9F82', // sage green
  '#C9A96E', // gold
  '#C4A0A0', // dusty rose
  '#A0B4C4', // dusty blue
  '#B8A9C9', // lavender
  '#D4B896', // warm tan
  '#9BB5A0', // mint
  '#C4AA7A', // warm gold
  '#D1A3A3', // blush
  '#A3B8A0', // moss
  '#C9B29B', // taupe
  '#B0C4B1', // eucalyptus
]

interface CategoryChartData {
  name: string
  value: number
}

interface BudgetChartProps {
  categories: CategoryChartData[]
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: CategoryChartData & { percent: number }
  }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-[#2D2D2D]">{data.name}</p>
      <p className="text-sm tabular-nums text-[#7A7A7A]">
        {formatCurrency(data.value)}
      </p>
      <p className="text-xs text-[#7A7A7A]">
        {((data.payload.percent ?? 0) * 100).toFixed(1)}% of total
      </p>
    </div>
  )
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string; payload: { value: number } }>
}) {
  if (!payload) return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="truncate text-xs text-[#2D2D2D]">
            {entry.value}
          </span>
          <span className="ml-auto shrink-0 text-xs tabular-nums text-[#7A7A7A]">
            {formatCurrency(entry.payload?.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BudgetChart({ categories }: BudgetChartProps) {
  const chartData = useMemo(() => {
    const total = categories.reduce((sum, c) => sum + c.value, 0)
    return categories
      .filter((c) => c.value > 0)
      .map((c) => ({
        ...c,
        percent: total > 0 ? c.value / total : 0,
      }))
  }, [categories])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[#2D2D2D]">
            Budget by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-[#7A7A7A]">
              Add budget items to see the breakdown chart.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-[#2D2D2D]">
          Budget by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="40%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={<CustomLegend />}
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
