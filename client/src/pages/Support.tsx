import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Track a shipment",
  "Get a shipping rate",
  "How do I ship?",
  "Contact support",
] as const;

const GENERIC_ERROR =
  "Something went wrong. Please try again or contact support from the app menu.";

export default function Support() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessages = async (nextMessages: ChatMessage[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/support/chat", {
        messages: nextMessages,
      });
      const data = (await res.json()) as { message?: string };
      const text =
        typeof data?.message === "string"
          ? data.message
          : GENERIC_ERROR;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text },
      ]);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    sendMessages(nextMessages);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (loading) return;
    const userMessage: ChatMessage = { role: "user", content: prompt };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    sendMessages(nextMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-background safe-top"
      data-testid="screen-support"
    >
      <header className="sticky top-0 z-50 shrink-0 bg-white border-b border-border safe-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setLocation("/home")}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="ml-2 flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">
              Support Assistant
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Ask about tracking, rates, shipping help, or support.
            </p>
          </div>
        </div>
      </header>

      {/* Quick prompt chips */}
      <div className="shrink-0 px-4 pt-3 pb-2 max-w-md mx-auto w-full">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => handleQuickPrompt(prompt)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                "bg-muted text-foreground hover:bg-muted/80",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 max-w-md mx-auto w-full"
      >
        <div className="py-3 pb-6 space-y-4">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Send a message or tap a prompt above to get started.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="shrink-0 px-4 py-2 max-w-md mx-auto w-full">
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2 flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="shrink-0"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input area - above bottom nav (pb-20 for fixed nav height) */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3 pb-20 max-w-md mx-auto w-full">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            className="min-h-[40px] max-h-24 resize-none py-2.5"
            aria-label="Message"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 h-10 w-10 rounded-full"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
