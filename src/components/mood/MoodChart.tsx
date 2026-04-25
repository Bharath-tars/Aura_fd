import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface Props {
  weeklyAvgs: number[]
}

const WEEK_LABELS = ['4w ago', '3w ago', '2w ago', 'This week']

export default function MoodChart({ weeklyAvgs }: Props) {
  const data = weeklyAvgs.map((avg, i) => ({
    week: WEEK_LABELS[i] ?? `Week ${i + 1}`,
    mood: avg > 0 ? avg : null,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
          formatter={(v: number) => [v?.toFixed(1), 'Mood avg']}
        />
        <ReferenceLine y={5} stroke="#e2e8f0" strokeDasharray="4 4" />
        <Line
          type="monotone" dataKey="mood" stroke="#6366f1"
          strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }} connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
