"use client";
import { create } from "zustand";
import api from "@/lib/axios";

export interface Citation {
  document_name: string;
  chunk_text: string;
  page_number?: number;
  relevance_score: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  sendMessage: (question: string, documentId?: number) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  sendMessage: async (question, documentId) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], loading: true }));

    try {
      const res = await api.post("/chat/", {
        question,
        document_id: documentId ?? null,
        top_k: 5,
      });
      const data = res.data;
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        confidence: data.confidence_score,
        timestamp: new Date(),
      };
      set((s) => ({ messages: [...s.messages, aiMsg] }));
    } catch (err: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: err.response?.data?.detail ?? "Failed to get a response. Please try again.",
        timestamp: new Date(),
      };
      set((s) => ({ messages: [...s.messages, errMsg] }));
    } finally {
      set({ loading: false });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
