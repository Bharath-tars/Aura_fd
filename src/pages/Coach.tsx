import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  chatApi,
  createSession,
  deleteSession,
  getMessages,
  getSessions,
} from "../api/chat";
import ChatInput from "../components/chat/ChatInput";
import ChatWindow from "../components/chat/ChatWindow";
import { useAuthStore } from "../store/authStore";
import { ChatMessage, ChatSession } from "../types";

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Coach() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token)!;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [crisisLevel, setCrisisLevel] = useState(0);
  const [crisisResources, setCrisisResources] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Sessions list
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: () => getSessions(token),
  });

  // Messages for current session
  const { data: fetchedMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", sessionId],
    queryFn: () => getMessages(token, sessionId!),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!isStreaming) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, isStreaming]);

  // Reset crisis state when session changes
  useEffect(() => {
    setCrisisLevel(0);
    setCrisisResources([]);
    setStreamingContent("");
    setIsStreaming(false);
  }, [sessionId]);

  const createSessionMutation = useMutation({
    mutationFn: () => createSession(token, "New conversation"),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      navigate(`/coach/${session.id}`);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => deleteSession(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      navigate("/coach");
    },
  });

  const handleSend = async (message: string) => {
    if (!sessionId || isStreaming) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const tempUserMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: message,
      crisis_level: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent("");
    setCrisisLevel(0);
    setCrisisResources([]);

    let accumulated = "";
    let finalCrisisLevel = 0;
    let finalResources: string[] = [];

    try {
      for await (const event of chatApi.streamMessage(
        token,
        sessionId,
        message,
        controller.signal
      )) {
        if (controller.signal.aborted) break;

        if (event.type === "token") {
          accumulated += event.content;
          setStreamingContent(accumulated);
        } else if (event.type === "crisis") {
          finalCrisisLevel = event.level ?? 0;
          finalResources = event.resources ?? [];
          setCrisisLevel(finalCrisisLevel);
          setCrisisResources(finalResources);
        } else if (event.type === "done") {
          // Refresh messages from server to get persisted IDs
          await queryClient.invalidateQueries({
            queryKey: ["chat-messages", sessionId],
          });
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          content: "Something went wrong. Please try again.",
          crisis_level: 0,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const activeSession = sessions.find((s) => s.id === sessionId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-56 shrink-0 border-r border-slate-100 bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => createSessionMutation.mutate()}
            disabled={createSessionMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
                  session.id === sessionId
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => navigate(`/coach/${session.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <span className="block text-sm truncate">
                    {session.title || "Conversation"}
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    {formatSessionTime(session.updated_at)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSessionMutation.mutate(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {sessions.length === 0 && (
            <p className="text-xs text-slate-400 text-center mt-6 px-3">
              No conversations yet. Start a new chat above.
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {sessionId ? (
          <>
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {activeSession?.title || "Aura"}
                </h2>
                <p className="text-xs text-slate-400">
                  {isStreaming ? (
                    <span className="text-indigo-500 animate-pulse">Aura is thinking…</span>
                  ) : (
                    "Your personal wellness companion"
                  )}
                </p>
              </div>
            </div>

            <ChatWindow
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              crisisLevel={crisisLevel}
              crisisResources={crisisResources}
            />

            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-6">
              <span className="text-4xl">✦</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Talk to Aura
            </h2>
            <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
              Aura is your AI wellness companion — trained in CBT and
              mindfulness, grounded in your own data. Start a new conversation
              to begin.
            </p>
            <button
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Start a conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
