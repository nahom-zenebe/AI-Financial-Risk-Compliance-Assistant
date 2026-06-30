"use client";
import { useEffect, useRef, useState } from "react";
import {
  Send, Bot, User, Trash2, ChevronDown, ChevronUp,
  FileText, Sparkles, MessageSquare, AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useChatStore, Message, Citation } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { clsx } from "clsx";

const SUGGESTED = [
  "Does this transaction violate AML policy?",
  "What are the KYC requirements?",
  "Explain the compliance regulations in uploaded documents.",
  "What are the red flags for money laundering?",
];

function CitationList({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;
  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
        <FileText className="w-3.5 h-3.5" />
        {citations.length} source{citations.length !== 1 ? "s" : ""} cited
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-indigo-400">{c.document_name}</span>
                <div className="flex gap-2 text-[10px] text-slate-500">
                  {c.page_number != null && <span>p.{c.page_number}</span>}
                  <span>relevance: {(c.relevance_score * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3">{c.chunk_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={clsx("flex gap-3 group", isUser && "flex-row-reverse")}>
      <div className={clsx(
        "w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
        isUser ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={clsx("max-w-[75%] space-y-1", isUser && "items-end")}>
        <div className={clsx(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm"
        )}>
          {msg.content}
          {!isUser && msg.citations && <CitationList citations={msg.citations} />}
        </div>
        <div className={clsx("flex items-center gap-2 px-1", isUser && "justify-end")}>
          <span className="text-[10px] text-slate-600">
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && msg.confidence != null && (
            <span className="text-[10px] text-slate-600">
              confidence: {(msg.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, loading, sendMessage, clearMessages } = useChatStore();
  const { hydrate } = useAuthStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { hydrate(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    await sendMessage(q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar title="AI Compliance Chat" subtitle="Ask questions about your uploaded documents" />

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-2">AI Compliance Assistant</h2>
              <p className="text-sm text-slate-400 max-w-md">
                Ask questions about your compliance documents. Upload PDFs, DOCX, or CSV files first
                to enable document-grounded answers with citations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-slate-400 hover:text-white hover:border-indigo-500/40 hover:bg-slate-800 text-left transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} msg={msg} />)
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 pb-6 pt-2 border-t border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about compliance, regulations, AML policy…"
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-32"
              style={{ height: "auto" }}
            />
          </div>
          <Button onClick={handleSend} loading={loading} disabled={!input.trim()} size="md">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Press Enter to send · Shift+Enter for newline · Answers grounded in uploaded documents
        </p>
      </div>
    </div>
  );
}
