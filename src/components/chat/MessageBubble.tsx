import { ChatMessage } from "../../types";
import CrisisResourceCard from "./CrisisResourceCard";
import StreamingText from "./StreamingText";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
  crisisLevel?: number;
  crisisResources?: string[];
}

export default function MessageBubble({
  message,
  isStreaming = false,
  streamingContent,
  crisisLevel = 0,
  crisisResources = [],
}: Props) {
  const isUser = message.role === "user";
  const content = isStreaming && streamingContent !== undefined ? streamingContent : message.content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
          A
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "ml-12" : "mr-12"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-bl-sm"
          }`}
        >
          <StreamingText text={content} isStreaming={isStreaming} />
        </div>

        {!isUser && (crisisLevel >= 2) && (
          <CrisisResourceCard level={crisisLevel} resources={crisisResources} />
        )}

        <div className={`mt-1 text-xs text-slate-400 ${isUser ? "text-right" : "text-left"}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold ml-2 mt-1 shrink-0">
          You
        </div>
      )}
    </div>
  );
}
