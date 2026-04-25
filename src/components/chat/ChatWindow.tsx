import { useEffect, useRef } from "react";
import { ChatMessage } from "../../types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  crisisLevel: number;
  crisisResources: string[];
}

export default function ChatWindow({
  messages,
  isStreaming,
  streamingContent,
  crisisLevel,
  crisisResources,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {!hasMessages && (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
            <span className="text-3xl">✦</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Hi, I'm Aura
          </h3>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            I'm here to listen and help you understand your patterns. Share
            what's on your mind — I'll remember what matters.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {[
              "How am I doing this week?",
              "Help me understand my mood patterns",
              "I need someone to talk to",
              "Create a wellness plan for me",
            ].map((prompt) => (
              <span
                key={prompt}
                className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 cursor-default"
              >
                {prompt}
              </span>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isLastAssistant =
          !isStreaming && i === messages.length - 1 && msg.role === "assistant";
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            crisisLevel={isLastAssistant ? crisisLevel : 0}
            crisisResources={isLastAssistant ? crisisResources : []}
          />
        );
      })}

      {isStreaming && (
        <MessageBubble
          message={{
            id: "streaming",
            session_id: "",
            role: "assistant",
            content: streamingContent,
            crisis_level: 0,
            created_at: new Date().toISOString(),
          }}
          isStreaming={true}
          streamingContent={streamingContent}
          crisisLevel={crisisLevel}
          crisisResources={crisisResources}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
