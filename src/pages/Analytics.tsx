import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart2, Brain, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsApi } from "../api/analytics";
import StreakBadge from "../components/dashboard/StreakBadge";

const MOOD_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399", "#60a5fa", "#818cf8"];

function moodColor(score: number): string {
  const idx = Math.min(Math.floor(score) - 1, 6);
  return MOOD_COLORS[Math.max(idx, 0)];
}

interface FactorBar { factor: string; delta: number }
interface EmotionBar { emotion: string; count: number }
interface WeekPoint  { week: string; avg: number }

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsApi.dashboard(),
    staleTime: 2 * 60_000,
  });

  const { data: weekly } = useQuery({
    queryKey: ["analytics-weekly"],
    queryFn: () => analyticsApi.weekly(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const moodTrend: WeekPoint[] = (data?.weekly_avgs ?? []).map(
    (avg: number, i: number) => ({ week: `W${i + 1}`, avg: +avg.toFixed(1) })
  );

  const topFactors: FactorBar[] = (data?.positive_levers ?? [])
    .slice(0, 8)
    .map((l: { factor: string; delta: number }) => ({
      factor: l.factor.replace(/_/g, " "),
      delta: +l.delta.toFixed(2),
    }));

  const emotionFreq: EmotionBar[] = Object.entries(data?.emotion_freq ?? {})
    .map(([emotion, count]) => ({ emotion, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const avgScore: number = data?.avg_score ?? 0;
  const trend: string = data?.trend ?? "stable";
  const totalEntries: number = data?.total_entries ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Patterns and insights drawn from your wellness history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 p-4"
        >
          <p className="text-xs text-slate-500 mb-1">Avg mood</p>
          <p className="text-3xl font-bold" style={{ color: moodColor(avgScore) }}>
            {avgScore.toFixed(1)}
            <span className="text-base text-slate-400 font-normal">/10</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-100 p-4"
        >
          <p className="text-xs text-slate-500 mb-1">Trend</p>
          <p className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-1">
            <TrendingUp
              className={`h-5 w-5 ${
                trend === "improving"
                  ? "text-emerald-500"
                  : trend === "declining"
                  ? "text-rose-500 rotate-180"
                  : "text-slate-400"
              }`}
            />
            {trend}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-4"
        >
          <p className="text-xs text-slate-500 mb-1">Mood logs</p>
          <p className="text-3xl font-bold text-slate-800">{totalEntries}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 p-4"
        >
          <p className="text-xs text-slate-500 mb-1">Top lever</p>
          <p className="text-base font-semibold text-slate-800 truncate">
            {topFactors[0]?.factor ?? "—"}
          </p>
          {topFactors[0] && (
            <p className="text-xs text-emerald-600 mt-0.5">
              +{topFactors[0].delta} mood pts
            </p>
          )}
        </motion.div>
      </div>

      {/* Streak */}
      <StreakBadge />

      {/* Mood trend chart */}
      {moodTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Mood over time</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodTrend} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number) => [`${v}/10`, "Avg mood"]}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor impact */}
        {topFactors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                What lifts your mood
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topFactors}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="factor"
                  width={90}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [`+${v} pts`, "Mood lift"]}
                />
                <Bar dataKey="delta" radius={[0, 6, 6, 0]}>
                  {topFactors.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#10b981" : "#6ee7b7"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Emotion frequency */}
        {emotionFreq.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Emotions this period
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={emotionFreq}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="emotion"
                  width={80}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => [v, "times"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {emotionFreq.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(${240 + i * 18}, 70%, ${65 + i * 2}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* AI Weekly report */}
      {weekly?.summary && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✦</span>
            <h2 className="text-sm font-semibold text-indigo-700">
              AI Weekly Synthesis
            </h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{weekly.summary}</p>
          {weekly.insights?.length > 0 && (
            <div className="mt-4 space-y-3">
              {weekly.insights.map(
                (ins: { title: string; body: string }, i: number) => (
                  <div key={i} className="bg-white/70 rounded-xl p-3">
                    <p className="text-xs font-semibold text-indigo-600 mb-0.5">
                      {ins.title}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ins.body}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {!data && !isLoading && (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            Log a few mood entries to unlock your analytics.
          </p>
        </div>
      )}
    </div>
  );
}
