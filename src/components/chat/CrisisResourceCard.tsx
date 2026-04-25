import { Heart, Phone } from "lucide-react";

interface Props {
  level: number;
  resources: string[];
}

export default function CrisisResourceCard({ level, resources }: Props) {
  if (level < 2 || !resources.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="h-4 w-4 text-rose-500" />
        <span className="text-sm font-medium text-rose-700">
          {level >= 4
            ? "You are not alone — support is available right now"
            : "If you'd like to talk to someone"}
        </span>
      </div>
      <ul className="space-y-1">
        {resources.slice(0, 3).map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-rose-600">
            <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
