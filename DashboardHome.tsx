import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  FileText, 
  ChevronRight, 
  PlusCircle, 
  BookOpen, 
  Settings
} from 'lucide-react';

import { RphData } from '../types';

interface DashboardHomeProps {
  onStartEditing: (selectedKelas?: string) => void;
  draftsCount: number;
  schoolName: string;
  drafts: RphData[];
  onLoadDraft: (selectedDraft: RphData) => void;
}

export default function DashboardHome({ onStartEditing, draftsCount, schoolName, drafts, onLoadDraft }: DashboardHomeProps) {
  // Real school classes list
  const CLASSES_LIST = [
    { name: '3UIA', subjek: 'RBT T3', defaultTopic: 'Reka Bentuk Mekatronik' },
    { name: '3UUM', subjek: 'RBT T3', defaultTopic: 'Penghasilan Produk' },
    { name: '3UKM', subjek: 'RBT T3', defaultTopic: 'Sistem Akuaponik Hijau' },
    { name: '3UMS', subjek: 'RBT T3', defaultTopic: 'Lakaran Reka Bentuk' },
    { name: '3UPM', subjek: 'RBT T3', defaultTopic: 'Pemasangan Mekatronik' },
    { name: '3UM', subjek: 'RBT T3', defaultTopic: 'Pembangunan Atur Cara & Projek' },
  ];

  // Dynamically calculate status for each class based on actual local storage drafts
  const processedClasses = CLASSES_LIST.map((c, index) => {
    const classDrafts = drafts.filter(d => d.kelas === c.name);
    // Get the latest draft for this class
    const latestDraft = classDrafts.length > 0 
      ? [...classDrafts].sort((a, b) => (b.id || 0) - (a.id || 0))[0] 
      : null;

    let status = 'Belum Selesai';
    let badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    let topik = c.defaultTopic;
    let details = 'Tiada Data';

    if (latestDraft) {
      if (latestDraft.synced === true) {
        status = 'Sudah Siap';
        badgeStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      } else {
        status = 'Draf Tersimpan';
        badgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      }
      topik = latestDraft.sp || latestDraft.sk || c.defaultTopic;
      details = `Minggu ${latestDraft.minggu} - ${latestDraft.tarikh}`;
    }

    return {
      id: index + 1,
      kelas: c.name,
      subjek: c.subjek,
      topik,
      status,
      badgeStyle,
      draft: latestDraft,
      details
    };
  });

  // Calculate stats dynamically
  const totalRphCount = drafts.filter(d => d.synced === true).length;
  const unfinishedCount = processedClasses.filter(c => c.status === 'Belum Selesai').length;
  const activeDraftsCount = drafts.filter(d => d.synced !== true).length;

  return (
    <div className="w-full space-y-12 py-4 no-print">
      
      {/* 1. BRAND HERO INTRO BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto space-y-6 px-4"
      >
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-lg">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 flex items-center gap-1.5 font-mono">
            <Sparkles className="h-3 w-3 text-blue-400" /> ENJIN PINTAR DSKP RBT
          </span>
        </div>

        <div className="relative py-2">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 blur-3xl rounded-full pointer-events-none opacity-40 -z-10" />
          
          <h1 className="text-5xl sm:text-8xl font-sans font-black tracking-tight text-white leading-none uppercase select-none">
            <span className="bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">SMART RPH</span>
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent ml-3 sm:ml-5 drop-shadow-[0_0_35px_rgba(59,130,246,0.25)] animate-pulse">AI</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-extrabold text-blue-400 tracking-[0.3em] uppercase mt-4 mb-2 select-none">
            RPH Pintar DSKP Terpaling Kebabom 🔥
          </p>
        </div>
        
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
          Ikut format sekolah anda — automatik, berpandukan DSKP RBT KSSM Tingkatan 3 bersepadu AI. Pencetakan gred A4 dioptimumkan secara jernih dan profesional.
        </p>

        {/* Master Primary Action Button */}
        <div className="pt-2 flex justify-center">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartEditing()}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-slate-950 via-blue-900 to-slate-950 hover:from-blue-900 hover:to-blue-800 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs sm:text-sm border border-blue-500/50 hover:border-blue-400 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/15 transition-all duration-300 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Mula Sediakan / Jana RPH Pintar</span>
            <ArrowRight className="h-4.5 w-4.5 text-blue-450" />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. MAIN HUB GIGA-GRID (Screenshot replica layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT CARD: PAPARAN SEBENAR SMARTRPH WEBSITE PREVIEW */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-8 bg-slate-900/45 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          {/* Subtle light effect glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/65 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/65 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/65 inline-block"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 ml-2">smartrph.app/dashboard</span>
            </div>
            <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-700/50 text-slate-300">
              Minggu Aktif: Kursus RBT
            </span>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Selamat datang kembali, Cikgu!</h3>
                <p className="text-[11px] text-blue-400 mt-0.5 font-bold tracking-wide uppercase">
                  {schoolName || "Sekolah Menengah Kebangsaan"}
                </p>
              </div>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                Sesi Akademik 2026 / 2027
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">RPH Minggu Ini</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-blue-400">{totalRphCount}</span>
                  <span className="text-[10px] text-slate-600">dokumen</span>
                </div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Belum Selesai</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-rose-450">{unfinishedCount}</span>
                  <span className="text-[10px] text-slate-600">kelas</span>
                </div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Draf Disimpan</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-amber-400">{activeDraftsCount}</span>
                  <span className="text-[10px] text-slate-600">rekod</span>
                </div>
              </div>
            </div>

            {/* Class status lists */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Roster Kelas & Sesi PdPc</h4>
                <span className="text-[10px] text-slate-500 font-medium">Klik pada tindakan kelas untuk memuatkan RPH</span>
              </div>
              
              <div className="overflow-hidden border border-slate-850 bg-slate-950/50 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Subjek</th>
                      <th className="p-3 hidden sm:table-cell">Topik RBT (DSKP)</th>
                      <th className="p-3">Status RPH</th>
                      <th className="p-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {processedClasses.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => item.draft ? onLoadDraft(item.draft) : onStartEditing(item.kelas)}
                        className="hover:bg-slate-900/80 cursor-pointer transition group"
                      >
                        <td className="p-3 font-bold text-slate-200">
                          {item.kelas}
                          <span className="block text-[8px] font-mono text-slate-500 font-normal">{item.details}</span>
                        </td>
                        <td className="p-3 text-slate-400">{item.subjek}</td>
                        <td className="p-3 text-slate-300 hidden sm:table-cell max-w-[200px] truncate" title={item.topik}>{item.topik}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${item.badgeStyle}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-bold text-[11px] text-slate-400 group-hover:text-blue-400 transition-colors">
                            <span>{item.draft ? 'Buka RPH' : 'Pilih Kelas'}</span>
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT CARD: THE PROMOTIONAL TEAL STATEMENT CARD */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-4 bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl min-h-[420px] relative overflow-hidden"
        >
          {/* Visual noise background mesh */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="bg-blue-500/10 border border-blue-500/30 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-300 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Lebih masa untuk cikgu.<br />
                <span className="text-blue-400">Lebih perhatian</span> untuk murid.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                SmartRPH membantu meringankan beban perkeranian guru di Malaysia dengan mengautomasi proses pembikinan RPH harian yang memakan masa standard. Kini, penyediaan aktiviti PdPc PAK-21 menjadi lebih terperinci dan berkualiti tinggi dengan rangsangan KBAT.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800/85 pt-5 space-y-4 relative z-10 bg-slate-950/40 p-4 rounded-xl">
            <div className="flex gap-2 items-center">
              <div className="text-blue-400 font-extrabold text-lg flex items-center">
                ~2 <span className="text-xs text-slate-400 font-semibold ml-1">jam</span>
              </div>
              <span className="text-[11px] text-slate-200">dijimatkan setiap minggu berbanding cara manual.</span>
            </div>
            <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 select-none">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> Bersedia Untuk Sesi Akademik 2026/2027
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. TECHNOLOGY STATS SECTION (AI Dual Engine highlight) */}
      <div className="bg-slate-900/15 border border-slate-850 p-8 rounded-3xl space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">
            Kelebihan Teknologi Struktur
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">AI Dwi-Enjin Pintar</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Satu-satunya sistem perisian dwi-enjin harian yang menghasilkan pengajaran RPH dengan tepat mengikut Sukat & silibus RBT Tingkatan 3.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Engine 1 */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex gap-4 items-start hover:border-blue-500/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 font-black text-sm text-blue-400 flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-100">Enjin Pembaca Format</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Membaca dan menstruktur susunan komponen RPH asal (jadual parameter, standard kandungan DSKP, bahan utama) supaya hasil muatan tepat ditekankan jernih pada sehelai kertas A4 yang kemas sewaktu anda mencetak atau mengeksport.
              </p>
            </div>
          </div>

          {/* Card Engine 2 */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex gap-4 items-start hover:border-blue-500/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 font-black text-sm text-blue-400 flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-100">Enjin Perangka RPH</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Merumuskan objektif daripada pangkalan data & menjana langkah aktiviti PdPc (Permulaan, Rangka Kerja Perkembangan, Penutup) dengan kaedah KBAT, PAK-21, serta bantuan bahan bantu mengajar munasabah mengikut maklum balas kelas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THREE HIGHLIGHT INTEGRATION BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/35 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-[11px] text-slate-200 font-semibold">Tepat mengikut format sekolah anda</span>
        </div>
        <div className="bg-slate-900/35 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-[11px] text-slate-200 font-semibold">Standard subjek kurikulum KSSM RBT T3</span>
        </div>
        <div className="bg-slate-900/35 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-[11px] text-slate-200 font-semibold">Export dokumen Word / PDF sedia hantar</span>
        </div>
      </div>

      {/* 5. GIGA CTA BOTTOM BANNER */}
      <motion.div 
        whileHover={{ scale: 1.005 }}
        className="bg-gradient-to-r from-slate-950 via-blue-950/20 to-slate-950 border border-blue-900/40 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[9px] uppercase tracking-wider bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20">
            Percuma Sepanjang Akademik Beta
          </span>
          <h3 className="text-xl font-extrabold text-white">Sertai sebagai pengguna perintis beta</h3>
          <p className="text-[11px] text-slate-300 max-w-xl">
            Akses penuh penyuntingan RPH AI, sandaran Google Sheets Awan peranti, draf luar talian percuma tanpa memerlukan sebarang pendaftaran kad kredit.
          </p>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 shrink-0 select-none">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider">Host Server: Cloud Run (Aktif)</span>
        </div>
      </motion.div>

    </div>
  );
}
