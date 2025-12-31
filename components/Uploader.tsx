
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, FileSearch, CheckCircle2, Loader2, Sparkles, LineChart } from 'lucide-react';
import { FileData } from '../types';

interface UploaderProps {
  label: string;
  onFileSelect: (data: FileData | null) => void;
  selectedFile: FileData | null;
  isProcessing: boolean;
  compact?: boolean;
  glow?: boolean;
  variant?: 'primary' | 'comparison';
}

const Uploader: React.FC<UploaderProps> = ({ label, onFileSelect, selectedFile, isProcessing, compact, glow, variant = 'primary' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadingText = variant === 'primary' ? "Reading your labs..." : "Comparing records...";
  const subtext = variant === 'primary' ? "Turning medical numbers into clear insights." : "Finding patterns in your health story.";

  const compressImage = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 2048;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg' });
        };
        img.onerror = () => reject(new Error('Image load error'));
      };
      reader.onerror = () => reject(new Error('File read error'));
    });
  };

  const processFile = async (file: File) => {
    const MAX_RAW_SIZE = 35 * 1024 * 1024;

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        onFileSelect({
          base64: compressed.base64,
          mimeType: compressed.mimeType,
          name: file.name
        });
      } else if (file.type === 'application/pdf') {
        if (file.size > MAX_RAW_SIZE) {
          alert("This PDF is too large. Please try a smaller scan.");
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          onFileSelect({
            base64,
            mimeType: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please upload a PDF or an Image.");
      }
    } catch (error) {
      console.error("File processing failed:", error);
      alert("Failed to process the file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isProcessing) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (compact) {
    return (
      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border border-dashed transition-all cursor-pointer bg-white/30 backdrop-blur-md ${selectedFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#1A237E]/20 hover:border-[#1A237E]/50'}`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
        <FileText className={`w-5 h-5 ${selectedFile ? 'text-emerald-500' : 'text-[#1A237E]/40'}`} />
        <span className="text-sm font-bold text-[#1A237E] truncate max-w-[150px]">
          {selectedFile ? selectedFile.name : label}
        </span>
        {selectedFile && (
          <button onClick={handleRemove} className="ml-auto p-1 hover:bg-emerald-100 rounded-full text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      layout
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      className={`
        glass p-10 md:p-12 h-full min-h-[300px] max-h-[400px] rounded-[40px] border-2 border-dashed transition-all duration-500 cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center
        ${selectedFile ? 'border-emerald-400 bg-emerald-50/30 shadow-emerald-100/20 shadow-xl' : isDragging ? 'border-blue-500 bg-blue-50/40 scale-[1.02] shadow-[0_0_50px_rgba(59,130,246,0.2)]' : 'border-[#1A237E]/10 hover:border-[#1A237E]/30 hover:bg-white/50'}
        ${glow && !selectedFile ? 'border-[#1A237E]/40 shadow-[0_0_40px_rgba(26,35,126,0.2)] ring-4 ring-indigo-50/50' : ''}
        ${isProcessing ? 'opacity-80 cursor-wait' : ''}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
      
      <div className="flex flex-col items-center text-center gap-6 relative z-10">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#1A237E] rounded-full blur-2xl"
                />
                <div className="w-16 h-16 bg-[#1A237E] rounded-full flex items-center justify-center relative shadow-xl">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black text-[#1A237E] tracking-tight leading-none">{loadingText}</p>
                <p className="text-gray-500 text-sm font-semibold max-w-sm mx-auto">{subtext}</p>
              </div>
            </motion.div>
          ) : selectedFile ? (
            <motion.div 
              key="selected"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-[28px] flex items-center justify-center relative shadow-xl border border-emerald-200">
                <FileText className="w-8 h-8 text-emerald-600" />
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemove}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg border-2 border-white"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="space-y-1">
                <p className="font-black text-[#1A237E] text-lg tracking-tight max-w-[200px] truncate">{selectedFile.name}</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" /> Ready to View
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div 
                animate={isDragging || glow ? { y: [0, -6, 0], scale: 1.05 } : {}}
                transition={{ repeat: isDragging || glow ? Infinity : 0, duration: 1.5 }}
                className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-blue-500 text-white shadow-blue-200 shadow-2xl' : glow ? 'bg-[#1A237E] text-white shadow-[#1A237E]/40 shadow-2xl border-4 border-white/20' : 'bg-white text-[#1A237E] shadow-xl border border-[#1A237E]/5'}`}
              >
                {isDragging ? <Sparkles className="w-8 h-8" /> : glow ? <LineChart className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </motion.div>
              <div className="space-y-2 px-4">
                <p className="font-black text-[#1A237E] text-xl tracking-tight leading-none">
                  {isDragging ? "Drop to View" : label}
                </p>
                <p className="text-gray-500 text-sm font-medium max-w-[200px] mx-auto leading-relaxed">
                  {isDragging ? "Release to see your results" : glow ? "Add a past record to see your progress" : "Drag and drop report here"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {glow && !selectedFile && !isProcessing && (
        <motion.div 
          animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-[#1A237E] pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default Uploader;
