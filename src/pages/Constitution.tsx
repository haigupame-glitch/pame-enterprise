import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Upload, Download, Printer, FileText, Check, AlertCircle, 
  Loader2, Copy, Edit2, FileDown, ChevronDown 
} from 'lucide-react';
import { 
  parseDocument, 
  downloadConstitutionAsWord, 
  downloadConstitutionAsPdf 
} from '../lib/documentParser';

export function Constitution() {
  const { groups, activeGroupId, updateConstitution, currentUserRole } = useAppContext();
  const activeGroup = groups.find(g => g.id === activeGroupId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [constitutionText, setConstitutionText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeGroup) {
      setConstitutionText(activeGroup.constitution || '');
    }
  }, [activeGroup]);

  // Close download dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeGroupId || !activeGroup) {
    return (
      <div className="p-8 text-center text-app-muted">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Please select a group first to view its constitution.</p>
      </div>
    );
  }

  const handleSave = () => {
    updateConstitution(activeGroupId, constitutionText);
    setIsEditing(false);
    setImportStatus(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const extractedText = await parseDocument(file);
      setConstitutionText(extractedText);
      setIsEditing(true);
      const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
      setImportStatus({
        type: 'success',
        message: `Successfully imported "${file.name}" (${wordCount} words). Review below and click "Save Changes" to save.`
      });
    } catch (err: any) {
      console.error('File import error:', err);
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to read document. Please ensure it is a valid Word (.docx), PDF (.pdf), or text file.'
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    if (!activeGroup.constitution) return;
    downloadConstitutionAsWord(activeGroup.name, activeGroup.constitution);
    setShowDownloadMenu(false);
  };

  const handleDownloadPdf = () => {
    if (!activeGroup.constitution) return;
    downloadConstitutionAsPdf(activeGroup.name, activeGroup.constitution);
    setShowDownloadMenu(false);
  };

  const handleDownloadText = () => {
    if (!activeGroup.constitution) return;
    const blob = new Blob([activeGroup.constitution], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeGroup.name.replace(/[^a-z0-9]/gi, '_')}_Constitution.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleCopyText = () => {
    if (!activeGroup.constitution) return;
    navigator.clipboard.writeText(activeGroup.constitution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canEdit = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'TREASURER';
  const hasConstitution = Boolean(activeGroup.constitution && activeGroup.constitution.trim());
  const wordsCount = constitutionText.trim() ? constitutionText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-6">
      {/* Hidden file input supporting Word (.docx, .doc), PDF (.pdf), and Text (.txt, .md) */}
      <input
        type="file"
        accept=".docx,.doc,.pdf,.txt,.md"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Screen Header & Action Toolbar (Hidden during print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-app-card p-4 sm:p-5 rounded-xl border border-app-border print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-app-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text">Group Constitution</h1>
          </div>
          <p className="text-app-muted text-xs sm:text-sm mt-1">Rules, bylaws, and governance guidelines for <strong className="text-app-text">{activeGroup.name}</strong></p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Download Dropdown */}
          {hasConstitution && !isEditing && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                type="button"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
                title="Download Constitution"
              >
                <Download className="w-4 h-4 text-app-primary" />
                <span>Download</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Export Format
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Adobe PDF (.pdf)</div>
                      <div className="text-[10px] text-slate-400">Formatted printable document</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadWord}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      DOC
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Microsoft Word (.doc)</div>
                      <div className="text-[10px] text-slate-400">Editable Word document</div>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors border-t border-slate-800"
                  >
                    <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      TXT
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Plain Text (.txt)</div>
                      <div className="text-[10px] text-slate-400">Raw text file</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Printable Button */}
          {hasConstitution && !isEditing && (
            <button
              onClick={handlePrint}
              className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
              title="Print Constitution"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print</span>
            </button>
          )}

          {/* Import Button (Available to editors) */}
          {canEdit && !isEditing && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bento-btn bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
              title="Import Word, PDF or Text file"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin text-app-primary" /> : <Upload className="w-4 h-4 text-app-primary" />}
              <span>{isImporting ? 'Importing...' : 'Import Word / PDF'}</span>
            </button>
          )}

          {/* Edit Button */}
          {canEdit && !isEditing && (
            <button 
              onClick={() => {
                setConstitutionText(activeGroup.constitution || '');
                setIsEditing(true);
                setImportStatus(null);
              }}
              className="bento-btn bento-btn-primary flex items-center gap-2 py-2 px-3 text-xs sm:text-sm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Constitution</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading banner while importing */}
      {isImporting && (
        <div className="bg-app-primary/10 border border-app-primary/30 p-4 rounded-xl flex items-center gap-3 text-app-primary print:hidden animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Extracting document content...</span> Reading text from your Word/PDF file. This will only take a moment.
          </div>
        </div>
      )}

      {/* Status Alert Banner */}
      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 print:hidden ${
          importStatus.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {importStatus.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm flex-1">
            <p>{importStatus.message}</p>
          </div>
          <button 
            onClick={() => setImportStatus(null)} 
            className="text-xs opacity-70 hover:opacity-100 uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Constitution Content Area */}
      <div className="bg-app-card border border-app-border rounded-xl p-6 sm:p-8 print:border-none print:p-0 print:bg-white print:text-black">
        
        {/* Printable Header (Visible strictly when printing) */}
        <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-300 text-center">
          {activeGroup.logo && (
            <img src={activeGroup.logo} alt="Group Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{activeGroup.name}</h1>
          <h2 className="text-base font-bold uppercase tracking-wider text-blue-700 mt-1">GROUP CONSTITUTION & BYLAWS</h2>
          <p className="text-xs text-slate-500 mt-1">Self-Help Group Registered Rules & Regulations</p>
        </div>

        {isEditing ? (
          <div className="space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-900/60 p-3 rounded-lg border border-app-border">
              <div className="text-xs text-app-muted">
                Tip: You can type your constitution, paste text, or import directly from a <strong className="text-white">Word (.docx)</strong> or <strong className="text-white">PDF (.pdf)</strong> document.
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="bento-btn bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-2 py-1 px-2.5 text-xs whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-app-primary" />
                <span>Import from Word / PDF</span>
              </button>
            </div>

            <textarea
              className="w-full h-[500px] p-4 rounded-xl bg-slate-900 text-slate-100 border border-app-border focus:border-app-primary focus:ring-1 focus:ring-app-primary resize-y font-mono text-sm leading-relaxed"
              value={constitutionText}
              onChange={(e) => setConstitutionText(e.target.value)}
              placeholder="Paste or write the group constitution rules, objectives, member responsibilities, meeting schedules, and penalty bylaws here..."
            />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="text-xs text-app-muted font-medium">
                {wordsCount} words &bull; {constitutionText.length} characters
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  type="button"
                  onClick={() => {
                    setConstitutionText(activeGroup.constitution || '');
                    setIsEditing(false);
                    setImportStatus(null);
                  }}
                  className="bento-btn bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  className="bento-btn bento-btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {hasConstitution ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-app-border/40 text-xs text-app-muted print:hidden">
                  <span>Official Group Bylaws</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="hover:text-white flex items-center gap-1.5 transition-colors"
                      title="Copy constitution to clipboard"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                    <span>&bull;</span>
                    <span>{activeGroup.constitution?.trim().split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>

                {/* Printable and viewable constitution text */}
                <div 
                  className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed text-sm sm:text-base print:text-black print:text-xs print:leading-normal"
                >
                  {activeGroup.constitution}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-app-muted">
                <FileText className="w-14 h-14 mx-auto mb-4 opacity-30 text-app-primary" />
                <h3 className="text-lg font-bold text-app-text mb-1">No Constitution Added Yet</h3>
                <p className="max-w-md mx-auto text-sm text-app-muted mb-6">
                  Add the bylaws and guidelines for your group by importing a Word (.docx) or PDF (.pdf) file, or by writing it directly.
                </p>
                {canEdit && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bento-btn bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-app-primary" />
                      <span>Import Word / PDF</span>
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bento-btn bento-btn-primary flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Type Constitution</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Printable Footer (Visible strictly when printing) */}
        <div className="hidden print:block mt-12 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          <p>This constitution document was generated by {activeGroup.name} via SHG Connect on {new Date().toLocaleDateString()}.</p>
        </div>
      </div>
    </div>
  );
}
