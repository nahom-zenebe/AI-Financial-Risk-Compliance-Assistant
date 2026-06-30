"use client";
import { create } from "zustand";
import api from "@/lib/axios";

export interface Document {
  id: number;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  category: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface DocumentState {
  documents: Document[];
  total: number;
  loading: boolean;
  uploading: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, category: string) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  total: 0,
  loading: false,
  uploading: false,

  fetchDocuments: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/documents/");
      set({ documents: res.data.documents, total: res.data.total });
    } finally {
      set({ loading: false });
    }
  },

  uploadDocument: async (file, category) => {
    set({ uploading: true });
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      await api.post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await get().fetchDocuments();
    } finally {
      set({ uploading: false });
    }
  },

  deleteDocument: async (id) => {
    await api.delete(`/documents/${id}`);
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      total: s.total - 1,
    }));
  },
}));
