"use client";
import { useEffect, useRef, useState } from "react";
import {
  Upload, FileText, Trash2, Search, RefreshCw,
  File, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useDocumentStore } from "@/store/document-store";
import { useAuthStore } from "@/store/auth-store";

const CATEGORIES = ["general", "aml", "kyc", "fraud", "regulatory", "audit", "transaction"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { documents, total, loading, uploading, fetchDocuments, uploadDocument, deleteDocument } = useDocumentStore();
  const { hydrate } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => { hydrate(); fetchDocuments(); }, []);

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleFile = async (file: File) => {
    await uploadDocument(file, category);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try { await deleteDocument(id); } finally { setDeleteId(null); }
  };

  const iconFor = (ext: string) => {
    const map: Record<string, string> = { pdf: "🔴", docx: "🔵", csv: "🟢" };
    return map[ext] ?? "📄";
  };

  return (
    <div className="flex flex-col min-h-full">
      <Navbar title="Documents" subtitle={`${total} document${total !== 1 ? "s" : ""} in knowledge base`} />

      <div className="flex-1 p-6 space-y-5">
        {/* Upload zone */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            Upload Document
          </h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragging
                ? "border-indigo-500 bg-indigo-600/10"
                : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-indigo-400 font-medium">Processing & ingesting into knowledge base…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-600/20 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Drop files here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, CSV · Max 50 MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-800">{c.toUpperCase()}</option>
              ))}
            </select>
            <Button onClick={() => fileRef.current?.click()} loading={uploading} variant="secondary">
              <File className="w-4 h-4" />
              Choose file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>
        </Card>

        {/* Document list */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white flex-1">Knowledge Base</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents…"
                className="bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-48"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchDocuments} loading={loading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-14 bg-slate-700/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {search ? "No documents match your search" : "No documents uploaded yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                    <th className="text-left py-2 pr-4 font-medium">File</th>
                    <th className="text-left py-2 pr-4 font-medium">Category</th>
                    <th className="text-left py-2 pr-4 font-medium">Size</th>
                    <th className="text-left py-2 pr-4 font-medium">Chunks</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Uploaded</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{iconFor(doc.file_type)}</span>
                          <div>
                            <p className="text-white font-medium truncate max-w-[180px]">{doc.filename}</p>
                            <p className="text-xs text-slate-500 uppercase">{doc.file_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">{doc.category}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">{formatBytes(doc.file_size)}</td>
                      <td className="py-3 pr-4">
                        <span className="text-indigo-400 font-mono text-xs">{doc.chunk_count}</span>
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={doc.status} /></td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleteId === doc.id}
                          onClick={() => handleDelete(doc.id)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
