import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Upload, Camera, Building } from 'lucide-react';
import { format } from 'date-fns';
import type { Member, Group } from '../types';
import { useAppContext } from '../store/AppContext';
import { cn } from '../lib/utils';

interface IdCardModalProps {
  member: Member;
  group: Group;
  onClose: () => void;
}

export function IdCardModal({ member, group, onClose }: IdCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const { updateMember, updateGroup } = useAppContext();
  
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ID_${member.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ID card', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateMember({ ...member, photoUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateGroup(group.id, { logo: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col max-h-[95vh] overflow-hidden relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h3 className="font-bold text-lg text-white">Member ID Card</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-8 flex justify-center items-center bg-slate-950/50 overflow-y-auto">
          {/* ID Card Wrapper */}
          <div 
            ref={cardRef} 
            className="shrink-0 w-[300px] h-[480px] bg-white rounded-xl shadow-lg relative overflow-hidden flex flex-col items-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Card Header Background */}
            <div className="absolute top-0 left-0 w-full h-[140px] bg-gradient-to-br from-emerald-600 to-teal-800" />
            <div className="absolute top-[138px] left-0 w-full overflow-hidden leading-[0]">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8 flex-shrink-0 fill-emerald-600/50" style={{ transform: 'rotate(180deg)', transformOrigin: 'top' }}>
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
              </svg>
            </div>

            {/* Header Content */}
            <div className="z-10 w-full px-4 pt-4 pb-2 mb-4 text-center flex flex-col items-center">
              {group.logo && (
                <img src={group.logo} alt="Group Logo" className="w-[40px] h-[40px] rounded-full object-cover border-2 border-white shadow-sm mb-2" crossOrigin="anonymous" />
              )}
              <h1 className={cn("font-bold text-white leading-tight uppercase tracking-wide drop-shadow-md", group.logo ? "text-lg" : "text-xl pt-2")}>
                {group.name}
              </h1>
              <p className="text-[10px] text-emerald-100 uppercase tracking-widest mt-1 opacity-90">Official Member ID</p>
            </div>

            {/* Photo Area */}
            <div className="z-10 relative">
              <div className="w-[120px] h-[120px] rounded-full border-[4px] border-white shadow-md bg-slate-100 overflow-hidden flex items-center justify-center">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="Member Photo" className="w-full h-full object-cover" crossOrigin="anonymous" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <Camera className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Member Details */}
            <div className="z-10 mt-5 w-full px-6 flex flex-col items-center text-center pb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-1 leading-snug">{member.name}</h2>
              <div className="text-xs font-bold text-emerald-600 mb-4 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Member Status: Active
              </div>

              <div className="w-full space-y-2 mt-2">
                <div className="grid grid-cols-[30%_70%] text-left text-xs">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Mem ID:</span>
                  <span className="font-mono text-gray-800 font-medium">{member.memberNumber || member.id.substring(0, 8)}</span>
                </div>
                {member.contact && (
                  <div className="grid grid-cols-[30%_70%] text-left text-xs">
                    <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Phone:</span>
                    <span className="font-mono text-gray-800 font-medium">{member.contact}</span>
                  </div>
                )}
                {member.address && (
                  <div className="grid grid-cols-[30%_70%] text-left text-xs items-start pt-1 border-t border-slate-100 mt-1">
                    <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] pt-0.5">Address:</span>
                    <span className="text-gray-800 text-[11px] leading-[1.3] break-words line-clamp-3">{member.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="absolute bottom-0 left-0 w-full h-[36px] bg-slate-900 flex items-center justify-between px-4 text-slate-400 text-[9px] font-mono shadow-inner border-t-2 border-emerald-500">
              <span className="flex items-center gap-1">
                ISSUED
                <span className="text-white font-bold">
                  {member.idIssueDate ? format(new Date(member.idIssueDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
                </span>
              </span>
              <span>SHG.APP</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3 shrink-0 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 bento-btn bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="text-xs">Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            
            <label className="flex-1 bento-btn bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
              <Building className="w-4 h-4 text-blue-400" />
              <span className="text-xs">Group Logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Issue Date</label>
              <input 
                type="date" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" 
                value={member.idIssueDate ? member.idIssueDate.split('T')[0] : new Date().toISOString().split('T')[0]} 
                onChange={(e) => updateMember({ ...member, idIssueDate: new Date(e.target.value).toISOString() })}
              />
            </div>
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 self-end py-2 bento-btn bento-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 group hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all"
            >
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs">{downloading ? 'Wait...' : 'Download'}</span>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-full bento-btn bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
