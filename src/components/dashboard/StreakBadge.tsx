import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { useEffect, useRef } from "react";
import { streakApi } from "../../api/analytics";

export default function StreakBadge() {
  const { data } = useQuery({
    queryKey: ["streak"],
    queryFn: () => streakApi.get(),
    staleTime: 60_000,
  });

  const streak = data?.current_streak ?? 0;
  const longest = data?.longest_streak ?? 0;

  const milestones = [7, 14, 21, 30, 60, 90];
  const nextMilestone = milestones.find((m) => m > streak) ?? streak + 10;
  const pct = Math.min((streak / nextMilestone) * 100, 100);

  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackRef.current?.style.setProperty("--streak-pct", `${pct}%`);
  }, [pct]);

  const intensity =
    streak >= 30
      ? "text-orange-500"
      : streak >= 14
      ? "text-amber-500"
      : streak >= 7
      ? "text-yellow-500"
      : "text-slate-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          streak > 0 ? "bg-amber-50" : "bg-slate-50"
        }`}
      >
        <Flame className={`h-6 w-6 ${intensity}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-800">{streak}</span>
          <span className="text-sm text-slate-500">
            day{streak !== 1 ? "s" : ""} streak
          </span>
        </div>

        <div className="mt-1.5">
          <div
            ref={trackRef}
            className="streak-track h-1.5 rounded-full bg-slate-100 overflow-hidden"
          >
            <div className="streak-fill h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {streak < nextMilestone
              ? `${nextMilestone - streak} days to ${nextMilestone}-day milestone`
              : "Milestone reached!"}
          </p>
        </div>
      </div>

      {longest > 0 && (
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Best</div>
          <div className="text-sm font-semibold text-slate-600">{longest}d</div>
        </div>
      )}
    </div>
  );
}
