import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
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
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 3,
      });
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

  const groupNameLength = group.name?.length || 0;
  const groupNameSizeClass = groupNameLength > 40 ? "text-xs" : groupNameLength > 25 ? "text-sm" : groupNameLength > 15 ? "text-base" : "text-lg";

  const memberNameLength = member.name?.length || 0;
  const memberNameSizeClass = memberNameLength > 30 ? "text-base" : memberNameLength > 20 ? "text-lg" : "text-[22px]";

  const addressLength = member.address?.length || 0;
  const addressSizeClass = addressLength > 60 ? "text-[9px] line-clamp-3" : "text-[11px] line-clamp-2";

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
            className="shrink-0 w-[450px] h-[280px] bg-white rounded-xl shadow-lg relative overflow-hidden flex"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Left Column (Photo & Banner) */}
            <div className="w-[160px] h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex flex-col items-center pt-6 pb-4 relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Group Logo */}
              <div className="z-10 relative block text-center flex flex-col items-center mb-5 mt-2">
                <label className="cursor-pointer group relative block">
                  {group.logo ? (
                    <>
                      <img src={group.logo} alt="Group Logo" className="w-[72px] h-[72px] rounded-xl object-cover border-2 border-white/80 shadow-md mb-2 bg-white" crossOrigin="anonymous" />
                      <div className="absolute inset-0 top-0 w-[72px] h-[72px] rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-xl border-2 border-white/50 bg-black/10 flex items-center justify-center shadow-md mb-2 group-hover:border-white transition-colors">
                      <Building className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>

              {/* Photo Area */}
              <div className="z-10 relative px-4 w-full flex justify-center">
                <label className="block w-[110px] h-[110px] rounded-full border-[3px] border-white shadow-xl bg-slate-100 overflow-hidden flex items-center justify-center cursor-pointer group relative">
                  {member.photoUrl ? (
                    <>
                      <img src={member.photoUrl} alt="Member Photo" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center group-hover:text-slate-600 transition-colors">
                      <Camera className="w-8 h-8 mb-2 opacity-50 text-slate-400 group-hover:text-slate-500 transition-colors" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors text-center leading-tight">Add<br/>Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {/* Right Column (Details) */}
            <div className="flex-1 h-full pt-7 pl-7 pr-6 pb-[40px] flex flex-col relative bg-white">
              {/* Background Watermark (Optional) */}
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-[0.03] pointer-events-none">
                {group.logo ? (
                  <img src={group.logo} className="w-[180px] h-[180px] object-cover grayscale" crossOrigin="anonymous" />
                ) : (
                  <Building className="w-[180px] h-[180px]" />
                )}
              </div>

              {/* Header Text */}
              <div className="relative z-10 mb-4 border-b border-emerald-100 pb-2 shrink-0">
                <h1 className={cn("font-bold text-emerald-900 leading-tight tracking-wide drop-shadow-sm break-words line-clamp-2", groupNameSizeClass)}>
                  {group.name}
                </h1>
                <p className="text-[9px] text-emerald-600/80 uppercase tracking-[0.2em] font-bold mt-1">Official Member ID</p>
              </div>

              {/* Member Name */}
              <div className="relative z-10 mb-2 shrink-0">
                <h2 className={cn("font-bold text-gray-900 leading-snug line-clamp-2", memberNameSizeClass)}>{member.name}</h2>
                <div className="text-[10px] font-bold text-emerald-700/80 tracking-widest uppercase bg-emerald-50 px-2.5 py-0.5 inline-block rounded-md border border-emerald-100/50 mt-1">
                  Active Member
                </div>
              </div>

              {/* Lower Section Wrapper */}
              <div className="relative z-10 w-full mt-auto flex flex-col min-h-0">
                {/* Member Details */}
                <div className="space-y-1.5 mb-3">
                  <div className="grid grid-cols-[65px_1fr] text-left text-xs items-center gap-1">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">ID NO</span>
                    <span className="font-mono text-gray-800 font-semibold">{member.memberNumber || member.id.substring(0, 8)}</span>
                  </div>
                  {member.contact && (
                    <div className="grid grid-cols-[65px_1fr] text-left text-xs items-center gap-1">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">PHONE</span>
                      <span className="font-mono text-gray-800 font-semibold tracking-wide">{member.contact}</span>
                    </div>
                  )}
                  {member.address && (
                    <div className="grid grid-cols-[65px_1fr] text-left text-xs items-start gap-1">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] pt-0.5">ADDRESS</span>
                      <span className={cn("font-medium leading-[1.3] break-words text-gray-800", addressSizeClass)} style={{ letterSpacing: '0.01em' }}>{member.address}</span>
                    </div>
                  )}
                </div>

                {/* Group Contact Info */}
                {(group.contact || group.email) && (
                  <div className="flex flex-col justify-end text-[9px] text-gray-500 border-t border-slate-100 pt-2 shrink-0">
                     <div className="flex items-center justify-between gap-1">
                       <span className="font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Group Contact:</span>
                       <span className="font-mono font-medium text-emerald-700/90 line-clamp-1 text-right tracking-tight">{[group.contact, group.email].filter(Boolean).join(' • ')}</span>
                     </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="absolute bottom-0 right-0 w-full h-[36px] bg-slate-50 flex items-center justify-between pl-7 pr-6 text-slate-400 text-[10px] font-mono border-t border-slate-200 shrink-0">
                <span className="flex items-center tracking-wider text-[9px]">
                  Issued: <span className="text-slate-700 font-medium ml-1">{member.idIssueDate ? format(new Date(member.idIssueDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span>
                </span>
                <span className="font-bold text-emerald-600/30">SHG.APP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3 shrink-0 overflow-y-auto">
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
          </div>
          <div className="flex gap-3 mt-1">
            <button 
              onClick={() => {
                const img = new Image();
                img.src = cardRef.current ? (cardRef.current.querySelector('img') ? cardRef.current.querySelector('img')!.src : '') : ''; 
                setTimeout(() => window.print(), 500); 
              }}
              className="flex-1 py-2 bento-btn bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center gap-2 transition-all border border-slate-600"
            >
              Print
            </button>
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 py-2 bento-btn bento-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 group hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all"
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
