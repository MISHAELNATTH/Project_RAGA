import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadPdf } from '../lib/api';

export default function UploadArea({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [question, setQuestion] = useState('');

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      await handleUpload(file);
    }
  }, []);

  const onFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setFileName(file.name);
    try {
      await uploadPdf(file);
      onUploadComplete(file.name, question);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload PDF. Ensure backend is running.");
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (fileName && question) {
      onUploadComplete(fileName, question);
    } else if (question) {
      // Just pass question if they want to ask without waiting for drop
      onUploadComplete(null, question);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Establish Context</h2>
        <p className="text-slate-500 text-lg">Upload a document to begin the synthesis process.</p>
      </div>

      {/* Dropzone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "w-full p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50/50 mb-8",
          isDragging ? "border-primary-500 bg-primary-50" : "border-slate-300 hover:border-slate-400",
          isUploading && "opacity-70 pointer-events-none"
        )}
      >
        <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mb-6">
          {isUploading ? <Loader2 className="animate-spin" size={28} /> : <ArrowUp size={28} />}
        </div>
        
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {isUploading ? 'Ingesting Document...' : 'Drop PDF document here'}
        </h3>
        
        <p className="text-slate-500 mb-6">
          {isUploading ? fileName : 'or click to browse local files'}
        </p>

        {!isUploading && (
          <label className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors">
            Browse Files
            <input type="file" className="hidden" accept=".pdf" onChange={onFileSelect} />
          </label>
        )}
      </div>

      {/* Initial Prompt */}
      <div className="w-full relative shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Provide an initial prompt or question regarding the document..."
          className="w-full py-4 pl-5 pr-14 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
        />
        <button 
          onClick={handleSubmit}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
        >
          <ArrowUp size={16} />
        </button>
      </div>
      
      <p className="text-xs text-slate-400 mt-6 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        All documents are processed securely and not used for model training.
      </p>
    </div>
  );
}
