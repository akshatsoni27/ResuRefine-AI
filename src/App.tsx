import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Download, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Target,
  Clock,
  Layout,
  Star,
  Copy,
  Check
} from 'lucide-react';
import { analyzeResume, generateUpgradedResume, AnalysisResponse } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [upgradedMarkdown, setUpgradedMarkdown] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analysis' | 'upgrade'>('upload');

  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const processResume = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      const result = await analyzeResume(text);
      setAnalysis(result);
      setStep('analysis');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const upgradeResume = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await extractTextFromPDF(file);
      const upgraded = await generateUpgradedResume(text);
      setUpgradedMarkdown(upgraded);
      setStep('upgrade');
    } catch (error) {
      console.error('Error upgrading resume:', error);
      alert('Failed to upgrade resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!upgradedMarkdown) return;
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    // Simple parsing to try and make it look better
    const lines = upgradedMarkdown.split('\n');
    let y = 20;

    lines.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(line.replace('# ', ''), margin, y);
        y += 10;
      } else if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(line.replace('## ', ''), margin, y);
        y += 8;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const wrapped = doc.splitTextToSize('• ' + line.substring(2), maxWidth);
        doc.text(wrapped, margin, y);
        y += (wrapped.length * 5);
      } else if (line.trim() !== '') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const wrapped = doc.splitTextToSize(line, maxWidth);
        doc.text(wrapped, margin, y);
        y += (wrapped.length * 5);
      } else {
        y += 4;
      }
    });

    doc.save('Upgraded_Resume.pdf');
  };

  const copyToClipboard = async () => {
    if (!upgradedMarkdown) return;
    try {
      await navigator.clipboard.writeText(upgradedMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">ResuRefine <span className="text-blue-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
              Go Pro
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="max-w-2xl mx-auto mb-12">
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                    Get your resume <span className="text-blue-600">Google-ready</span> in seconds.
                  </h1>
                  <p className="text-lg text-slate-600 mb-8">
                    Our AI scans your resume against Top 500 ATS systems, identifies critical gaps, and upgrades your content to elite standards.
                  </p>
                </div>

                <div 
                  {...getRootProps()} 
                  className={cn(
                    "relative group cursor-pointer max-w-xl mx-auto border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
                    isDragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-slate-200"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                      isDragActive ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}>
                      {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-900">
                        {file ? file.name : "Drop your resume here"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Supports PDF only (Max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={processResume}
                    disabled={!file || loading}
                    className="group relative inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        Analyze Resume
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: ShieldCheck, title: "ATS Optimized", desc: "Pass through any applicant tracking system with confidence." },
                    { icon: Sparkles, title: "FAANG Standards", desc: "Align with the strict standards used by Google, Meta, and Amazon." },
                    { icon: TrendingUp, title: "Impact Driven", desc: "Transform your responsibilities into quantifiable achievements." }
                  ].map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'analysis' && analysis && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Left Column: Score Card */}
                  <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                      <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-2">Overall ATS Score</p>
                      <div className="relative inline-flex items-center justify-center mb-6">
                        <svg className="w-40 h-40 transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-100"
                          />
                          <motion.circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={440}
                            initial={{ strokeDashoffset: 440 }}
                            animate={{ strokeDashoffset: 440 - (440 * analysis.score) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-blue-600"
                          />
                        </svg>
                        <span className="absolute text-5xl font-bold text-slate-900">{analysis.score}</span>
                      </div>
                      <p className="text-slate-600 text-sm italic">{analysis.summary}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Breakdown
                      </h3>
                      {[
                        { label: 'Impact', val: analysis.breakdown.impact, icon: Target },
                        { label: 'Formatting', val: analysis.breakdown.formatting, icon: Layout },
                        { label: 'Keywords', val: analysis.breakdown.keywords, icon: Star },
                        { label: 'Brevity', val: analysis.breakdown.brevity, icon: Clock },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-2"><item.icon className="w-3 h-3" /> {item.label}</span>
                            <span className="font-semibold text-slate-900">{item.val}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.val}%` }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 border border-green-100 rounded-3xl p-6">
                        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Strengths
                        </h3>
                        <ul className="space-y-3">
                          {analysis.details.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-green-800 flex gap-3">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
                        <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Improvements
                        </h3>
                        <ul className="space-y-3">
                          {analysis.details.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-orange-800 flex gap-3">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-3xl p-6">
                      <h3 className="font-bold text-red-900 mb-4">Critical Fixes Required</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.details.criticalFixes.map((f, i) => (
                          <div key={i} className="flex gap-3 bg-white/50 p-3 rounded-xl text-sm text-red-900 items-start">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold">Ready for the upgrade?</h2>
                        <p className="text-slate-400">Our AI can rewrite your resume to hit FAANG standards perfectly.</p>
                      </div>
                      <button
                        onClick={upgradeResume}
                        disabled={loading}
                        className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
                        Apply AI Upgrade
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'upgrade' && upgradedMarkdown && (
              <motion.div
                key="upgrade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8"
              >
                <div className="md:col-span-8">
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden min-h-[800px] flex flex-col">
                    <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                        <div className="w-3 h-3 rounded-full bg-slate-200" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Optimized Output</span>
                      <div className="w-12" />
                    </div>
                    <div className="p-12 prose prose-slate max-w-none flex-1">
                      <div className="markdown-body">
                        <ReactMarkdown>{upgradedMarkdown}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-6">
                  <div className="sticky top-32 space-y-6">
                    <div className="bg-blue-600 text-white rounded-3xl p-8 shadow-xl shadow-blue-100">
                      <h3 className="text-2xl font-bold mb-4">What's Changed?</h3>
                      <div className="space-y-4">
                        {[
                          "Action-oriented bullet points",
                          "Quantifiable metrics added",
                          "ATS keyword saturation",
                          "Professional tone polishing",
                          "FAANG structure formatting"
                        ].map((change, i) => (
                          <div key={i} className="flex gap-3 items-center text-sm font-medium">
                            <div className="bg-blue-500 p-1 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            {change}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={downloadPDF}
                      className="w-full bg-slate-900 text-white px-8 py-6 rounded-3xl font-bold text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                    >
                      <Download className="w-6 h-6" />
                      Download PDF
                    </button>

                    <button
                      onClick={copyToClipboard}
                      className="w-full border border-slate-200 bg-white text-slate-900 px-8 py-4 rounded-3xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy to Clipboard
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setStep('upload')}
                      className="w-full border border-slate-200 bg-white text-slate-600 px-8 py-4 rounded-3xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      Process Another
                    </button>
                    
                    <div className="p-6 border border-slate-100 bg-white rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-slate-900">Privacy First</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your data is never stored. We process your resume in real-time and clear all session data immediately after you close the tab.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <div className="bg-slate-900 p-1.5 rounded-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResuRefine</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 ResuRefine AI. Built for the future of work.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
