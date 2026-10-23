import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import { documentService } from '../services/api';

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  
  // Q&A / Search State
  const [query, setQuery] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await documentService.listDocuments();
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', 'Computer Networks');

      const res = await documentService.uploadDocument(formData);
      setUploadSuccess(`Successfully extracted & vectorized "${res.data.filename}" into ${res.data.chunk_count} chunks!`);
      await fetchDocuments();
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Remove this document from the vector database?")) return;
    try {
      await documentService.deleteDocument(docId);
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRAGQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setQaLoading(true);
    setQaResult(null);
    try {
      const res = await documentService.queryRAG({
        query: query.trim(),
        subject: 'Computer Networks'
      });
      setQaResult(res.data);
    } catch (err) {
      console.error("RAG query failed:", err);
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-xs font-semibold text-brand-primary mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Knowledge & RAG Vector Store</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Study Materials & Vector Knowledge
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your PDF lecture notes, previous question papers, or text summaries. SYNTRA automatically extracts text, builds vector embeddings, and performs semantic search.
        </p>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="glass-panel p-8 rounded-3xl border border-dashed border-white/20 hover:border-brand-primary/50 transition-all text-center relative overflow-hidden group">
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mx-auto group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              {uploading ? 'Processing & Vectorizing Document...' : 'Upload PDF or Notes'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports .pdf, .txt, .md • PyMuPDF text extraction & ChromaDB vector embeddings
            </p>
          </div>
        </div>
      </div>

      {/* RAG Search & Ask Question Interface */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span>Ask Questions from Your Study Materials (RAG)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Ask any question to retrieve relevant chunks and exact citations from your uploaded PDFs.
          </p>
        </div>

        <form onSubmit={handleRAGQuery} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Explain distance vector routing according to my notes..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="submit"
            disabled={qaLoading}
            className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{qaLoading ? 'Searching...' : 'Search Notes'}</span>
          </button>
        </form>

        {/* RAG Answer & Citations Box */}
        {qaResult && (
          <div className="p-6 rounded-2xl bg-dark-900/90 border border-brand-primary/30 space-y-4 animate-fade-in">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                RAG Agent Output
              </span>
              <p className="text-xs text-slate-200 mt-2 font-light leading-relaxed whitespace-pre-line">
                {qaResult.answer}
              </p>
            </div>

            {/* Retrieved Chunks Preview */}
            {qaResult.sources && qaResult.sources.length > 0 && (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Retrieved Relevant Sources:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qaResult.sources.map((src, i) => (
                    <div key={i} className="p-3 rounded-xl bg-dark-800/80 border border-white/5 text-xs">
                      <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                        <span className="truncate">{src.document_name}</span>
                        <span className="text-[10px] text-brand-accent font-mono">p.{src.page_number} (Score: {src.score})</span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-light italic line-clamp-3">
                        "{src.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-secondary" />
            <span>Uploaded Knowledge Base ({documents.length})</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">ChromaDB Persistent Index</span>
        </div>

        <div className="divide-y divide-white/5">
          {documents.map((doc) => (
            <div key={doc.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{doc.filename}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span className="font-mono text-brand-accent">{doc.chunk_count} vector chunks</span>
                    <span>•</span>
                    <span>{Math.round(doc.file_size_bytes / 1024)} KB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  INDEXED
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  title="Remove from vector store"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
