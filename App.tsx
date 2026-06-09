/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Settings, 
  Bookmark, 
  FolderOpen, 
  CloudLightning, 
  Printer, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Trash2, 
  X, 
  Layers,
  Key,
  Info,
  FileText,
  Clipboard,
  Home,
  Clock,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { rbtDatabase } from './syllabusData';
import { RphData } from './types';
import DashboardHome from './components/DashboardHome';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>('dashboard');

  // RPH Document States
  const [minggu, setMinggu] = useState<number>(1);
  const [kelas, setKelas] = useState<string>("3UIA");
  const [tarikh, setTarikh] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().substring(0, 10);
  });
  const [hari, setHari] = useState<string>(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const mapping = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    return mapping[dayIndex];
  });
  const [masa, setMasa] = useState<string>("08:05 AM - 09:05 AM");
  const [skKey, setSkKey] = useState<string>("1.1");
  const [sp, setSp] = useState<string>("");
  const [objektif, setObjektif] = useState<string>("");
  const [aktiviti, setAktiviti] = useState<string>("");
  const [bbm, setBbm] = useState<string>("Slaid Slaid Canva, Papan Mikro, Gambar Rajah Mekatronik");
  const [refleksi, setRefleksi] = useState<string>("___ / ___ murid menguasai objektif pembelajaran dan diberikan latihan pengukuhan.");

  // Layout optimization states
  const [fontSize, setFontSize] = useState<string>("text-[12.5px] leading-relaxed");
  const [spacing, setSpacing] = useState<string>("space-y-5.5");

  // Config/Security States
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('rbt_webhook_url') || "";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || "";
  });

  // School Custom Branding States
  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('rbt_school_name') || "SMK KUNAK";
  });
  const [schoolLogo, setSchoolLogo] = useState<string>(() => {
    return localStorage.getItem('rbt_school_logo') || "https://upload.wikimedia.org/wikipedia/ms/0/07/Sekolah_Menengah_Kebangsaan_Kunak.png";
  });

  // Drafts & Modal States
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<RphData[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  
  // Local Temp Webhook/API key inputs
  const [tempWebhookUrl, setTempWebhookUrl] = useState<string>("");
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [scriptType, setScriptType] = useState<'single' | 'weekly_folder' | 'weekly_doc_pdf'>('weekly_doc_pdf');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [showPermissionErrorPrompt, setShowPermissionErrorPrompt] = useState<boolean>(false);

  // Pembantu Pengisian BBM & Refleksi
  const [hadirCount, setHadirCount] = useState<string>("");
  const [menguasaiCount, setMenguasaiCount] = useState<string>("");
  const [bimbinganCount, setBimbinganCount] = useState<string>("");

  const COMMON_BBM = [
    "Buku Teks",
    "Slaid Canva",
    "Model Maujud",
    "Laptop / Projektor LCD",
    "Kit Mikropengawal",
    "Papan Litar",
    "Gambar Rajah",
    "Lembaran Kerja / Modul",
    "Marker Pen / Kertas Sebak",
    "Video YouTube Rujukan"
  ];

  const REFLECTION_PRESETS = [
    {
      label: "Menguasai Objektif (Asas)",
      value: "___ / ___ murid menguasai objektif pembelajaran dan diberikan latihan pengukuhan."
    },
    {
      label: "Sebilangan Perlu Bimbingan",
      value: "___ / ___ murid menguasai objektif pembelajaran manakala ___ murid memerlukan bimbingan tambahan."
    },
    {
      label: "Aktiviti Berjalan Lancar & Aktif",
      value: "Aktiviti PdPc berjalan lancar dengan maklum balas kreatif. Murid aktif dalam kerja berkumpulan."
    },
    {
      label: "Pembentangan Gallery Walk",
      value: "Sesi kreatif berjalan cemerlang. Murid berjaya menerangkan lakaran produk melalui aktiviti Gallery Walk."
    },
    {
      label: "Amali Sistem Mikropengawal",
      value: "Amali mekatronik selesai dengan jaya. Semua kumpulan berjaya memasang litar mikropengawal."
    },
    {
      label: "Ditunda: Program Rasmi Sekolah",
      value: "Aktiviti PdPc ditangguhkan kerana program rasmi sekolah dan akan dibawa ke kelas berikutnya."
    },
    {
      label: "Ditunda: Mesyuarat / Kursus Luar",
      value: "Aktiviti pembelajaran ditunda kerana guru menghadiri mesyuarat luar / urusan rasmi sekolah."
    },
    {
      label: "Ditunda: Cuti Umum / Pelepasan",
      value: "PdPc ditangguhkan kerana Cuti Umum / Cuti Perayaan yang diperuntukkan."
    },
    {
      label: "Bimbingan Reka Bentuk / Melakar",
      value: "Sebahagian besar murid memerlukan bimbingan tersusun membina lakaran dan mengidentifikasi komponen mekatronik."
    }
  ];

  const toggleBbmItem = (item: string) => {
    const items = bbm ? bbm.split(',').map(i => i.trim()).filter(Boolean) : [];
    if (items.includes(item)) {
      const updated = items.filter(i => i !== item);
      setBbm(updated.join(', '));
    } else {
      items.push(item);
      setBbm(items.join(', '));
    }
  };

  const isBbmActive = (item: string) => {
    const items = bbm ? bbm.split(',').map(i => i.trim()) : [];
    return items.includes(item);
  };

  const applyStudentCounts = () => {
    let text = refleksi;
    if (menguasaiCount && hadirCount) {
      text = text.replace(/___ \/ ___/g, `${menguasaiCount} / ${hadirCount}`);
    }
    if (bimbinganCount) {
      text = text.replace(/___ murid/g, `${bimbinganCount} murid`);
    }
    setRefleksi(text);
    showToast('Parameter murid berjaya dimasukkan ke dalam refleksi!', 'success');
  };

  // Loading indicator states
  const [isGeneratingObj, setIsGeneratingObj] = useState<boolean>(false);
  const [isGeneratingAct, setIsGeneratingAct] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>("Format Standard A4");

  // Custom Toast State
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);

  const rphDocRef = useRef<HTMLDivElement>(null);

  // Load drafts count and initialize SP / default objectives on start
  useEffect(() => {
    updateDraftsList();
    const defaultSpList = rbtDatabase[skKey]?.sp || [];
    if (defaultSpList.length > 0) {
      setSp(defaultSpList[0]);
    }
    setObjektif(rbtDatabase[skKey]?.defaultObj || "");
  }, []);

  // Update SP & Objectives when SK changes
  const handleSkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSk = e.target.value;
    setSkKey(selectedSk);
    const spList = rbtDatabase[selectedSk]?.sp || [];
    const firstSp = spList[0] || "";
    setSp(firstSp);
    setObjektif(rbtDatabase[selectedSk]?.defaultObj || "");
    showToast(`Standard Kandungan Ditukar ke ${selectedSk}`, 'info');
  };

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Draft Actions
  const updateDraftsList = () => {
    const storedDrafts = localStorage.getItem('rbt_drafts');
    if (storedDrafts) {
      try {
        setDrafts(JSON.parse(storedDrafts));
      } catch (err) {
        setDrafts([]);
      }
    }
  };

  const handleSaveDraft = () => {
    const currentDrafts = JSON.parse(localStorage.getItem('rbt_drafts') || "[]") as RphData[];
    
    // Check if we already have a draft with the same activeDraftId
    // OR if we have a draft with the same kelas AND minggu
    let existingIndex = -1;
    if (activeDraftId !== null) {
      existingIndex = currentDrafts.findIndex(d => d.id === activeDraftId);
    } else {
      existingIndex = currentDrafts.findIndex(d => d.kelas === kelas && d.minggu === minggu);
    }

    const compiledDraft: RphData = {
      id: existingIndex !== -1 ? (currentDrafts[existingIndex].id || Date.now()) : Date.now(),
      timestamp: new Date().toLocaleString('ms-MY'),
      minggu,
      kelas,
      tarikh,
      hari,
      masa,
      sk: skKey,
      sp,
      objektif,
      aktiviti,
      bbm,
      refleksi,
      synced: existingIndex !== -1 ? (currentDrafts[existingIndex].synced || false) : false
    };

    if (existingIndex !== -1) {
      currentDrafts[existingIndex] = compiledDraft;
    } else {
      currentDrafts.push(compiledDraft);
    }

    localStorage.setItem('rbt_drafts', JSON.stringify(currentDrafts));
    setActiveDraftId(compiledDraft.id || null);
    updateDraftsList();
    showToast("Draf RPH berjaya disimpan dalam pelayar peranti!", "success");
  };

  const handleLoadDraft = (selectedDraft: RphData) => {
    setActiveDraftId(selectedDraft.id || null);
    setMinggu(selectedDraft.minggu);
    setKelas(selectedDraft.kelas);
    setTarikh(selectedDraft.tarikh);
    if (selectedDraft.hari) {
      setHari(selectedDraft.hari);
    } else {
      const mapping = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
      const dateObj = new Date(selectedDraft.tarikh);
      if (!isNaN(dateObj.getTime())) {
        setHari(mapping[dateObj.getDay()]);
      } else {
        setHari("Isnin");
      }
    }
    setMasa(selectedDraft.masa);
    setSkKey(selectedDraft.sk);
    setSp(selectedDraft.sp);
    setObjektif(selectedDraft.objektif);
    setAktiviti(selectedDraft.aktiviti);
    setBbm(selectedDraft.bbm);
    setRefleksi(selectedDraft.refleksi);
    
    setIsDraftsModalOpen(false);
    showToast("Draf RPH berjaya dipulihkan!", "success");
  };

  const handleDeleteDraft = (draftId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentDrafts = JSON.parse(localStorage.getItem('rbt_drafts') || "[]") as RphData[];
    const updated = currentDrafts.filter(d => d.id !== draftId);
    localStorage.setItem('rbt_drafts', JSON.stringify(updated));
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
    updateDraftsList();
    showToast("Draf dipadam secara kekal.", "warning");
  };

  const handleResetForm = () => {
    setActiveDraftId(null);
    setMinggu(1);
    setKelas("3UIA");
    const today = new Date();
    setTarikh(today.toISOString().substring(0, 10));
    const dayIndex = today.getDay();
    const mapping = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    setHari(mapping[dayIndex]);
    setMasa("08:05 AM - 09:05 AM");
    setSkKey("1.1");
    setSp(rbtDatabase["1.1"].sp[0]);
    setObjektif(rbtDatabase["1.1"].defaultObj);
    setAktiviti("");
    setBbm("Slaid Slaid Canva, Papan Mikro, Gambar Rajah Mekatronik");
    setRefleksi("___ / ___ murid menguasai objektif pembelajaran dan diberikan latihan pengukuhan.");
    
    setFontSize("text-[11px] leading-normal");
    setSpacing("space-y-3.5");
    showToast("Borang pengajaran telah di-set semula.", "info");
  };

  // Webhook action
  const handleOpenSetup = () => {
    setTempWebhookUrl(webhookUrl);
    setIsSetupModalOpen(true);
  };

  const handleSaveWebhook = () => {
    localStorage.setItem('rbt_webhook_url', tempWebhookUrl);
    setWebhookUrl(tempWebhookUrl);
    setIsSetupModalOpen(false);
    showToast('Pautan Webhook Google Sheets anda didaftarkan!', 'success');
  };

  // API Key action
  const handleOpenApiKey = () => {
    setTempApiKey(apiKey);
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setIsApiKeyModalOpen(false);
    showToast('Kunci API Gemini dikemas kini!', 'success');
  };

  // Call backend direct API proxies to guarantee no Client CORS blockages or Key leakages
  const handleGenerateAiObjective = async () => {
    setIsGeneratingObj(true);
    showToast("Menjana draf objektif KBAT baru...", "info");

    try {
      const selectedSkText = rbtDatabase[skKey]?.name || skKey;
      const response = await fetch("/api/ai/objective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sk: selectedSkText,
          sp: sp,
          customApiKey: apiKey || undefined
        })
      });

      if (!response.ok) {
        let errorMsg = "Gagal menghubungi servis AI.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } else {
            const rawText = await response.text();
            if (rawText && rawText.length < 300) {
              errorMsg = rawText;
            }
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respons daripada pelayan adalah tidak sah (bukan JSON). Sila semak sambungan rangkaian.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setObjektif(data.text.trim());
      showToast("Objektif KBAT dijana dengan jayanya!", "success");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Gagal membina objektif AI.";
      if (/quota|429|exhausted|limit/i.test(msg)) {
        msg = "Had kuota harian percuma pelayan AI (Gemini) telah tamat harian. Sila masukkan kunci peribadi anda melalui butang '⚙️ Kunci API (Pilihan)' di bahagian bawah untuk meneruskannya dengan serta-merta secara percuma!";
      }
      showToast(msg, "error");
    } finally {
      setIsGeneratingObj(false);
    }
  };

  const handleGenerateAiActivities = async () => {
    setIsGeneratingAct(true);
    showToast("AI sedang membina rancangan PdPc yang inovatif...", "info");

    try {
      const selectedSkText = rbtDatabase[skKey]?.name || skKey;
      const response = await fetch("/api/ai/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sk: selectedSkText,
          sp: sp,
          objektif: objektif,
          customApiKey: apiKey || undefined
        })
      });

      if (!response.ok) {
        let errorMsg = "Gagal menghubungi servis AI.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } else {
            const rawText = await response.text();
            if (rawText && rawText.length < 300) {
              errorMsg = rawText;
            }
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respons daripada pelayan adalah tidak sah (bukan JSON). Sila semak sambungan rangkaian.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Strip potential markdown enclosures
      const cleaned = data.text.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "").trim();
      setAktiviti(cleaned);
      showToast("Aktiviti PdPc berjaya dijana oleh AI!", "success");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Aktiviti gagal dijana. Sila periksa sambungan.";
      if (/quota|429|exhausted|limit/i.test(msg)) {
        msg = "Had kuota harian percuma pelayan AI (Gemini) telah tamat harian. Sila masukkan kunci peribadi anda melalui butang '⚙️ Kunci API (Pilihan)' di bahagian bawah untuk meneruskannya dengan serta-merta secara percuma!";
      }
      showToast(msg, "error");
    } finally {
      setIsGeneratingAct(false);
    }
  };

  // Google Sheets Sync
  const handleSaveToGoogleSheets = async () => {
    if (!webhookUrl) {
      showToast('Sila konfigurasi pautan Google Sheets Webhook dahulu.', 'warning');
      handleOpenSetup();
      return;
    }

    setIsSyncingSheets(true);
    setSyncMessage("Sedang menghantar ke Google Sheets...");

    try {
      const response = await fetch("/api/sheets-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          payload: {
            minggu,
            kelas,
            tarikh: `${getFormattedDateDisplay()} / ${hari}`,
            masa,
            sk: rbtDatabase[skKey]?.name || skKey,
            sp,
            objektif,
            aktiviti,
            bbm,
            refleksi,
            schoolLogo,
            schoolName
          }
        })
      });

      if (!response.ok) {
        let errorMsg = "Gagal menyambung ke Google Sheets.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } else {
            const rawText = await response.text();
            if (rawText && rawText.length < 300) {
              errorMsg = rawText;
            }
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respons daripada pelayan adalah tidak sah (bukan JSON). Sila semak sambungan rangkaian.");
      }

      const data = await response.json();
      
      let innerResult: any = null;
      try {
        if (data.text) {
          innerResult = JSON.parse(data.text);
        }
      } catch (e) {
        // Not JSON formatted text, check raw text string
      }

      if (innerResult && innerResult.status === "error") {
        throw new Error(innerResult.error || innerResult.message || "Ralat pelaksanaan dalam Google Apps Script.");
      } else if (data.text && (data.text.includes("Error") || data.text.includes("Exception") || data.text.includes("SyntaxError"))) {
        throw new Error(data.text);
      }

      setSyncMessage("Berjaya disegerakkan!");
      showToast(innerResult?.message || "Data RPH berjaya dihantar ke Google Sheets anda!", "success");

      // Auto-save/update local draft with synced: true
      try {
        const currentDrafts = JSON.parse(localStorage.getItem('rbt_drafts') || "[]") as RphData[];
        let existingIndex = -1;
        if (activeDraftId !== null) {
          existingIndex = currentDrafts.findIndex(d => d.id === activeDraftId);
        } else {
          existingIndex = currentDrafts.findIndex(d => d.kelas === kelas && d.minggu === minggu);
        }

        const compiledDraft: RphData = {
          id: existingIndex !== -1 ? (currentDrafts[existingIndex].id || Date.now()) : Date.now(),
          timestamp: new Date().toLocaleString('ms-MY'),
          minggu,
          kelas,
          tarikh,
          hari,
          masa,
          sk: skKey,
          sp,
          objektif,
          aktiviti,
          bbm,
          refleksi,
          synced: true
        };

        if (existingIndex !== -1) {
          currentDrafts[existingIndex] = compiledDraft;
        } else {
          currentDrafts.push(compiledDraft);
        }

        localStorage.setItem('rbt_drafts', JSON.stringify(currentDrafts));
        setActiveDraftId(compiledDraft.id || null);
        updateDraftsList();
      } catch (saveErr) {
        console.error("Gagal auto-update status draf:", saveErr);
      }
    } catch (err: any) {
      console.error(err);
      setSyncMessage("Ralat segerak awan...");
      const errMsg = err.message || "";
      if (
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("documentapp") ||
        errMsg.toLowerCase().includes("documents") ||
        errMsg.toLowerCase().includes("auth") ||
        errMsg.toLowerCase().includes("exception")
      ) {
        setShowPermissionErrorPrompt(true);
      }
      showToast(`Mengisi rekod gagal: ${err.message || "Sila semak pautan webhook Google script anda."}`, "error");
    } finally {
      setIsSyncingSheets(false);
      setTimeout(() => {
        setSyncMessage("Auto-muat 1 Muka Surat");
      }, 4000);
    }
  };

  // Pristine A4 print rendering & direct High-Quality PDF download using native print preview
  const handleDownloadPdf = () => {
    showToast("Pilih destinasi 'Simpan sebagai PDF' (Save as PDF) dalam tetingkap cetakan.", "info");
    
    // Trigger standard native print layout which is styled with high-fidelity A4 media rules in index.css
    setTimeout(() => {
      window.focus();
      window.print();
    }, 450);
  };

  // Export RPH to Microsoft Word format (.doc)
  const handleExportWord = () => {
    showToast("Menyediakan fail Microsoft Word...", "info");
    
    const dateStr = `${getFormattedDateDisplay()} / ${hari}`;
    const skText = rbtDatabase[skKey]?.name || skKey;
    const formattedObjektif = objektif ? objektif.replace(/\n/g, '<br />') : '-';
    const formattedAktiviti = aktiviti ? aktiviti.replace(/\n/g, '<br />') : 'Sila tulis atau jana aktiviti.';
    const formattedBbm = bbm ? bbm.replace(/\n/g, '<br />') : '-';
    const formattedRefleksi = refleksi ? refleksi.replace(/\n/g, '<br />') : '-';

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>RPH RBT T3 - Minggu ${minggu}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000000;
            margin: 1in;
          }
          h2 {
            font-size: 14pt;
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 2px;
            color: #000000;
          }
          .subtitle {
            font-size: 9pt;
            text-align: center;
            font-weight: bold;
            color: #0056b3;
            text-transform: uppercase;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            margin-bottom: 15px;
          }
          table, td, th {
            border: 1px solid #000000;
          }
          td {
            padding: 8px;
            font-size: 10.5pt;
            vertical-align: top;
            color: #000000;
          }
          .header-cell {
            background-color: #f2f2f2;
            font-weight: bold;
            width: 18%;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #e6e6e6;
            padding: 5px 8px;
            margin-top: 15px;
            margin-bottom: 8px;
            border-left: 5px solid #10b981;
            color: #000000;
          }
          .content-box {
            padding: 6px 10px;
            font-size: 10.5pt;
            margin-bottom: 12px;
            color: #000000;
          }
          .footer-table {
            border: none;
            margin-top: 40px;
            width: 100%;
          }
          .footer-table td {
            border: none;
            font-size: 9pt;
            color: #555555;
          }
        </style>
      </head>
      <body>
        <table style="border: none; margin-bottom: 20px; width: 100%;">
          <tr style="border: none;">
            <td style="border: none; width: 68px; vertical-align: middle; padding: 0;">
              ${schoolLogo ? `<img src="${schoolLogo}" width="56" height="56" style="display: block; width: 56px; height: 56px;" />` : `<span style="font-size: 26pt; font-family: 'Segoe UI', Arial;">🏫</span>`}
            </td>
            <td style="border: none; text-align: left; vertical-align: middle; padding: 0 0 0 15px;">
              <h2 style="font-size: 13.5pt; font-weight: bold; text-align: left; margin: 0; padding: 0; text-transform: uppercase; color: #000000; border: none; background: none;">Rancangan Pengajaran Harian (RPH)</h2>
              <div style="font-size: 11pt; font-weight: bold; color: #0056b3; text-transform: uppercase; margin-top: 2px;">${schoolName || "SMK Dato' Harun"}</div>
              <div style="font-size: 8.5pt; color: #555555; text-transform: uppercase; margin-top: 1.5px;">Kurikulum Standard Sekolah Menengah (KSSM) • RBT T3</div>
            </td>
          </tr>
        </table>
          <tr>
            <td class="header-cell">Mata Pelajaran</td>
            <td style="width: 32%">Reka Bentuk dan Teknologi (RBT)</td>
            <td class="header-cell">Minggu</td>
            <td style="width: 32%">${minggu}</td>
          </tr>
          <tr>
            <td class="header-cell">Tarikh / Hari</td>
            <td>${dateStr}</td>
            <td class="header-cell">Kelas</td>
            <td>${kelas}</td>
          </tr>
          <tr>
            <td class="header-cell">Masa</td>
            <td colspan="3">${masa}</td>
          </tr>
        </table>

        <div class="section-title">1. Fokus Pembelajaran</div>
        <div class="content-box">
          <strong>Standard Kandungan:</strong> ${skText}<br />
          <strong>Standard Pembelajaran:</strong> ${sp || '-'}
        </div>

        <div class="section-title">2. Objektif Pembelajaran</div>
        <div class="content-box">
          ${formattedObjektif}
        </div>

        <div class="section-title">3. Aktiviti Pembelajaran & Pemudahcaraan (PdPc)</div>
        <div class="content-box">
          ${formattedAktiviti}
        </div>

        <div class="section-title">4. Bahan Bantu Mengajar (BBM)</div>
        <div class="content-box">
          ${formattedBbm}
        </div>

        <div class="section-title">5. Refleksi & Impak</div>
        <div class="content-box">
          ${formattedRefleksi}
        </div>

        <table class="footer-table">
          <tr>
            <td>Disemak Oleh: ___________________________</td>
            <td style="text-align: right">Muka Surat 1 daripada 1 | RPH T3 Pro</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RPH_RBT_T3_Minggu_${minggu}_Kelas_${kelas.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Fail Word (.doc) berjaya dimuat turun!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal membina fail Word.", "error");
    }
  };

  // Copy standard compatible Rich Word format directly to Clipboard
  const handleCopyWordClipboard = async () => {
    showToast("Menyediakan draf salinan untuk Microsoft Word...", "info");
    
    const dateStr = `${getFormattedDateDisplay()} / ${hari}`;
    const skText = rbtDatabase[skKey]?.name || skKey;
    const formattedObjektif = objektif ? objektif.replace(/\n/g, '<br />') : '-';
    const formattedAktiviti = aktiviti ? aktiviti.replace(/\n/g, '<br />') : 'Sila tulis atau jana aktiviti.';
    const formattedBbm = bbm ? bbm.replace(/\n/g, '<br />') : '-';
    const formattedRefleksi = refleksi ? refleksi.replace(/\n/g, '<br />') : '-';

    const cleanHtml = `
      <div style="font-family: Arial, sans-serif; color: #000000; padding: 10px;">
        <table style="border: none; margin-bottom: 15px; width: 100%;">
          <tr style="border: none;">
            <td style="border: none; width: 68px; vertical-align: middle; padding: 0;">
              ${schoolLogo ? `<img src="${schoolLogo}" width="56" height="56" style="display: block; width: 56px; height: 56px;" />` : `<span style="font-size: 26pt; font-family: 'Segoe UI', Arial;">🏫</span>`}
            </td>
            <td style="border: none; text-align: left; vertical-align: middle; padding: 0 0 0 15px;">
              <h2 style="font-size: 13.5pt; font-weight: bold; text-align: left; margin: 0; padding: 0; text-transform: uppercase; color: #000000; border: none; background: none;">Rancangan Pengajaran Harian (RPH)</h2>
              <div style="font-size: 11pt; font-weight: bold; color: #0056b3; text-transform: uppercase; margin-top: 2px;">${schoolName || "SMK Dato' Harun"}</div>
              <div style="font-size: 8.5pt; color: #555555; text-transform: uppercase; margin-top: 1.5px;">Kurikulum Standard Sekolah Menengah (KSSM) • RBT T3</div>
            </td>
          </tr>
        </table>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000000;">
          <tr>
            <td style="border: 1px solid #000000; padding: 6px; font-weight: bold; background-color: #f2f2f2; width: 18%; font-size: 10.5pt;">Mata Pelajaran</td>
            <td style="border: 1px solid #000000; padding: 6px; width: 32%; font-size: 10.5pt;">Reka Bentuk dan Teknologi (RBT)</td>
            <td style="border: 1px solid #000000; padding: 6px; font-weight: bold; background-color: #f2f2f2; width: 18%; font-size: 10.5pt;">Minggu</td>
            <td style="border: 1px solid #000000; padding: 6px; width: 32%; font-size: 10.5pt;">${minggu}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; padding: 6px; font-weight: bold; background-color: #f2f2f2; font-size: 10.5pt;">Tarikh / Hari</td>
            <td style="border: 1px solid #000000; padding: 6px; font-size: 10.5pt;">${dateStr}</td>
            <td style="border: 1px solid #000000; padding: 6px; font-weight: bold; background-color: #f2f2f2; font-size: 10.5pt;">Kelas</td>
            <td style="border: 1px solid #000000; padding: 6px; font-size: 10.5pt;">${kelas}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000000; padding: 6px; font-weight: bold; background-color: #f2f2f2; font-size: 10.5pt;">Masa</td>
            <td colspan="3" style="border: 1px solid #000000; padding: 6px; font-size: 10.5pt;">${masa}</td>
          </tr>
        </table>

        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #e6e6e6; padding: 5px 8px; margin-top: 15px; margin-bottom: 6px; border-left: 5px solid #10b981;">1. Fokus Pembelajaran</div>
        <div style="padding: 6px; font-size: 10.5pt; margin-bottom: 12px;">
          <strong>Standard Kandungan:</strong> ${skText}<br />
          <strong>Standard Pembelajaran:</strong> ${sp || '-'}
        </div>

        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #e6e6e6; padding: 5px 8px; margin-top: 15px; margin-bottom: 6px; border-left: 5px solid #10b981;">2. Objektif Pembelajaran</div>
        <div style="padding: 6px; font-size: 10.5pt; margin-bottom: 12px;">
          ${formattedObjektif}
        </div>

        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #e6e6e6; padding: 5px 8px; margin-top: 15px; margin-bottom: 6px; border-left: 5px solid #10b981;">3. Aktiviti Pembelajaran & Pemudahcaraan (PdPc)</div>
        <div style="padding: 6px; font-size: 10.5pt; margin-bottom: 12px;">
          ${formattedAktiviti}
        </div>

        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #e6e6e6; padding: 5px 8px; margin-top: 15px; margin-bottom: 6px; border-left: 5px solid #10b981;">4. Bahan Bantu Mengajar (BBM)</div>
        <div style="padding: 6px; font-size: 10.5pt; margin-bottom: 12px;">
          ${formattedBbm}
        </div>

        <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; background-color: #e6e6e6; padding: 5px 8px; margin-top: 15px; margin-bottom: 6px; border-left: 5px solid #10b981;">5. Refleksi & Impak</div>
        <div style="padding: 6px; font-size: 10.5pt; margin-bottom: 12px;">
          ${formattedRefleksi}
        </div>

        <table style="width: 100%; margin-top: 30px; border: none;">
          <tr>
            <td style="border: none; font-size: 9pt; color: #555555;">Disemak Oleh: ___________________________</td>
            <td style="border: none; font-size: 9pt; color: #555555; text-align: right;">Muka Surat 1 daripada 1 | RPH T3 Pro</td>
          </tr>
        </table>
      </div>
    `;

    try {
      const blobHtml = new Blob([cleanHtml], { type: 'text/html' });
      const blobText = new Blob([`RPH RBT T3 - MINGGU ${minggu}\nSK: ${skText}\nSP: ${sp}\n\nOBJEKTIF:\n${objektif}\n\nAKTIVITI:\n${aktiviti}\n\nBBM:\n${bbm}\n\nREFLEKSI:\n${refleksi}`], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      });
      await navigator.clipboard.write([item]);
      showToast("Berjaya disalin ke Papan Klip! Buka MS Word dan tekan Paste (Ctrl+V).", "success");
    } catch (err) {
      console.error(err);
      try {
        await navigator.clipboard.writeText(`RPH RBT T3 - MINGGU ${minggu}\nKelas: ${kelas}\nTarikh: ${dateStr}\n\nStandard Kandungan: ${skText}\nStandard Pembelajaran: ${sp}\n\nObjektif:\n${objektif}\n\nAktiviti:\n${aktiviti}\n\nBBM:\n${bbm}\n\nRefleksi:\n${refleksi}`);
        showToast("RPH disalin sebagai teks biasa! Sila tampal (Ctrl+V) di Word.", "success");
      } catch (innerErr) {
        showToast("Gagal menyalin draf ke papan klip.", "error");
      }
    }
  };

  // Convert date format to DD/MM/YYYY for Preview Display
  const getFormattedDateDisplay = () => {
    if (!tarikh) return '-';
    const parts = tarikh.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return tarikh;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 no-print transition-all">
        <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-sky-400 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-extrabold bg-blue-500/15 text-blue-400 rounded-md border border-blue-500/20">BETA</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SMART RPH</span>
              </div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                SmartRPH AI Workspace
              </h1>
            </div>
          </div>

          {/* Action Quick Bar Only visible on editor active tab */}
          {activeTab === 'editor' ? (
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center md:justify-end animate-in fade-in slide-in-from-right-3 duration-255">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="Kembali ke Dashboard Utama"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Muka Depan</span>
              </button>
              <button 
                id="btn-setup-cloud"
                onClick={handleOpenSetup} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Settings className="h-3.5 w-3.5 text-blue-400" /> Setup Cloud
              </button>
              <button 
                id="btn-save-draft"
                onClick={handleSaveDraft} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <Bookmark className="h-3.5 w-3.5 text-amber-400" /> Simpan Draf
              </button>
              <button 
                id="btn-view-drafts"
                onClick={() => { updateDraftsList(); setIsDraftsModalOpen(true); }} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-700"
              >
                <FolderOpen className="h-3.5 w-3.5 text-blue-400" /> Fail Draf ({drafts.length})
              </button>
              <button 
                id="btn-sync-sheets"
                onClick={handleSaveToGoogleSheets} 
                disabled={isSyncingSheets}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer border border-blue-500/30"
              >
                <CloudLightning className={`h-3.5 w-3.5 ${isSyncingSheets ? 'animate-bounce' : ''}`} /> Hantar Ke Sheets
              </button>
              <button 
                id="btn-copy-word"
                onClick={handleCopyWordClipboard} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-700"
                title="Salin RPH berformat jadual ke Papan Klip untuk ditampal ke Microsoft Word"
              >
                <Clipboard className="h-3.5 w-3.5 text-blue-400" /> Salin untuk Word
              </button>
              <button 
                id="btn-export-word"
                onClick={handleExportWord} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer border border-blue-500/30"
                title="Muat turun RPH sebagai fail dokumen Microsoft Word (.doc)"
              >
                <FileText className="h-3.5 w-3.5" /> Eksport Word
              </button>
              <button 
                id="btn-export-pdf"
                onClick={handleDownloadPdf} 
                className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-rose-600" /> PDF / Cetak
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col flex-grow w-full">
        {activeTab === 'dashboard' ? (
          <DashboardHome 
            draftsCount={drafts.length}
            schoolName={schoolName}
            drafts={drafts}
            onLoadDraft={(d) => {
              handleLoadDraft(d);
              setActiveTab('editor');
            }}
            onStartEditing={(selectedKelas) => {
              if (selectedKelas) {
                setKelas(selectedKelas);
                const classDrafts = drafts.filter(d => d.kelas === selectedKelas);
                if (classDrafts.length > 0) {
                  const latest = [...classDrafts].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
                  handleLoadDraft(latest);
                } else {
                  setActiveDraftId(null);
                }
              }
              setActiveTab('editor');
            }}
          />
        ) : (
          <div id="rph-editor-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        {/* LEFT PANEL: CONFIG, AI TRIGGER & FORMS */}
        <section className="lg:col-span-5 space-y-6 no-print">
          {/* Parameters configuration */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                <Layers className="h-4 w-4 text-blue-400" /> Parameter Pelajaran
              </h2>
              <button 
                type="button" 
                onClick={handleResetForm} 
                className="text-xs text-slate-400 hover:text-rose-450 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Set Semula
              </button>
            </div>

            <form id="rph-editor-form" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Maklumat Sekolah (Logo & Nama) */}
              <div className="bg-slate-950/70 border border-slate-800/85 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider">Pentadbiran & Logo Sekolah</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Nama Sekolah</label>
                    <input 
                      name="inputSchoolName"
                      type="text" 
                      value={schoolName}
                      onChange={(e) => {
                        setSchoolName(e.target.value);
                        localStorage.setItem('rbt_school_name', e.target.value);
                      }}
                      placeholder="Contoh: SMK Dato' Harun" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition font-medium" 
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Lambang / Logo</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-grow flex gap-1.5">
                        <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition select-none flex items-center justify-center gap-1 w-full text-center">
                          Muat Naik Logo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 200 * 1024) {
                                  showToast("Ralat: Logo haruslah di bawah 200KB bagi kestabilan pelayar.", "error");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64String = reader.result as string;
                                  setSchoolLogo(base64String);
                                  localStorage.setItem('rbt_school_logo', base64String);
                                  showToast("Insignia / Logo sekolah berjaya diimport!", "success");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {schoolLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolLogo("");
                              localStorage.removeItem('rbt_school_logo');
                              showToast("Logo di-set semula ke pilihan lalai.", "info");
                            }}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 px-2 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition shrink-0"
                            title="Hapus Logo"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weeks and Classroom selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Minggu PdPc</label>
                  <input 
                    name="inputMinggu"
                    type="number" 
                    value={minggu} 
                    onChange={(e) => setMinggu(Number(e.target.value))}
                    min={1} 
                    max={43} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Kelas</label>
                  <select 
                    name="inputKelas"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option>3UIA</option>
                    <option>3UUM</option>
                    <option>3UKM</option>
                    <option>3UMS</option>
                    <option>3UPM</option>
                    <option>3UM</option>
                  </select>
                </div>
              </div>

              {/* Date, Day, and Timing */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tarikh</label>
                  <input 
                    name="inputTarikh"
                    type="date" 
                    value={tarikh}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setTarikh(newDate);
                      const mapping = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
                      const dateObj = new Date(newDate);
                      if (!isNaN(dateObj.getTime())) {
                        setHari(mapping[dateObj.getDay()]);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hari</label>
                  <select 
                    name="inputHari"
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  >
                    <option>Isnin</option>
                    <option>Selasa</option>
                    <option>Rabu</option>
                    <option>Khamis</option>
                    <option>Jumaat</option>
                    <option>Sabtu</option>
                    <option>Ahad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Masa PdPc</label>
                  <input 
                    name="inputMasa"
                    type="text" 
                    value={masa}
                    onChange={(e) => setMasa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Sila masukkan tempoh masa"
                  />
                </div>
              </div>

              {/* Syllabus selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Standard Kandungan (SK)</label>
                <select 
                  name="inputSk"
                  value={skKey}
                  onChange={handleSkChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                >
                  {Object.keys(rbtDatabase).map((key) => (
                    <option key={key} value={key}>
                      {rbtDatabase[key].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Standard Pembelajaran (SP)</label>
                <select 
                  name="inputSp"
                  value={sp}
                  onChange={(e) => setSp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                >
                  {(rbtDatabase[skKey]?.sp || []).map((singleSp, index) => (
                    <option key={index} value={singleSp}>
                      {singleSp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Objectives */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">Objektif Pembelajaran</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateAiObjective}
                    disabled={isGeneratingObj}
                    className="text-purple-400 hover:text-purple-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Wand2 className={`h-3 w-3 ${isGeneratingObj ? 'animate-spin' : ''}`} /> AI Objektif
                  </button>
                </div>
                <textarea 
                  name="inputObjektif"
                  rows={2} 
                  value={objektif}
                  onChange={(e) => setObjektif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition" 
                  placeholder="Tulis objektif pengajaran..."
                />
              </div>

              {/* Dynamic Activities Panel */}
              <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Aktiviti PdPc PAK-21</span>
                    <span className="text-[10px] text-slate-500">Kombinasi AI berasaskan perancangan KBAT</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleGenerateAiActivities}
                    disabled={isGeneratingAct}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-900/20 border border-purple-500/20"
                  >
                    <Wand2 className={`h-3.5 w-3.5 ${isGeneratingAct ? 'animate-spin' : 'animate-pulse'}`} /> 
                    <span>{isGeneratingAct ? 'Menjana...' : 'Jana PdPc AI'}</span>
                  </button>
                </div>
                <textarea 
                  name="inputAktiviti"
                  rows={6} 
                  value={aktiviti}
                  onChange={(e) => setAktiviti(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition placeholder:text-slate-750" 
                  placeholder={`Contoh format:\n1. Set Induksi: Guru menayangkan video pengiklanan kepada murid.\n2. Aktiviti Utama: Murid melakar reka bentuk pengiklanan produk secara berkumpulan.\n3. Penutup: Murid membuat penilaian penilaian dan rumusan.`}
                />
              </div>

              {/* Support Materials (BBM) & Reflection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                {/* BBM Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bahan Bantu Mengajar (BBM)</label>
                    <span className="text-[9px] text-slate-500 font-medium font-mono">Boleh dipilih dan digabung</span>
                  </div>
                  <input 
                    name="inputBbm"
                    type="text" 
                    value={bbm}
                    onChange={(e) => setBbm(e.target.value)}
                    placeholder="Pilih di bawah atau tulis di sini..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  />
                  
                  {/* BBM Quick Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_BBM.map((item) => {
                      const active = isBbmActive(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleBbmItem(item)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition duration-150 cursor-pointer ${
                            active 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/40 font-semibold' 
                              : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {item} {active && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Refleksi Section */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Refleksi / Impak</label>
                  
                  {/* Select Preset Dropdown */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block">Pilih Templat Refleksi Pintar:</span>
                    <select 
                      name="selectRefleksiPreset"
                      onChange={(e) => {
                        if (e.target.value) {
                          setRefleksi(e.target.value);
                          showToast('Templat refleksi ditukar!', 'info');
                        }
                      }}
                      defaultValue=""
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="" disabled>-- Pilih Templat Refleksi --</option>
                      {REFLECTION_PRESETS.map((preset, idx) => (
                        <option key={idx} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea 
                    name="inputRefleksi"
                    rows={3}
                    value={refleksi}
                    onChange={(e) => setRefleksi(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition font-mono"
                    placeholder="Isi refleksi pembelajaran di sini..."
                  />

                  {/* Smart Student Count Injector */}
                  <div className="bg-slate-950/40 border border-slate-800/80 p-2.5 rounded-xl space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Alat Autoganti (Suntikan Hadir / Menguasai ke "___")</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Bil. Menguasai</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Cth: 24" 
                          value={menguasaiCount}
                          onChange={(e) => setMenguasaiCount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Jumlah Kehadiran</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Cth: 28" 
                          value={hadirCount}
                          onChange={(e) => setHadirCount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Bimbingan (Pilihan)</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Cth: 4" 
                          value={bimbinganCount}
                          onChange={(e) => setBimbinganCount(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyStudentCounts}
                      className="w-full bg-blue-600/15 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400 text-[10px] font-bold py-1 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      Terapkan Bilangan Murid ke Teks Refleksi
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* PRIVATE KEY DRAWER (OPTIONAL) */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiKey ? 'bg-blue-400' : 'bg-purple-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${apiKey ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {apiKey ? `Kunci Peribadi Aktif (${apiKey.slice(0, 6)}...${apiKey.slice(-4)})` : "Modul AI Cloud bersedia tanpa had"}
                </span>
              </div>
              <button 
                onClick={handleOpenApiKey} 
                className={`text-xs ${apiKey ? 'text-blue-400 hover:text-blue-300' : 'text-purple-400 hover:text-purple-300'} font-bold transition flex items-center gap-1 cursor-pointer`}
              >
                <Key className="h-3 w-3" /> {apiKey ? "Ubah Kunci API" : "API Kunci (Pilihan)"}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: LIVE PREVIEW RPH (PRINT-CARD) */}
        <section 
          id="rphDocument" 
          ref={rphDocRef}
          className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl shadow-2xl text-slate-900 border border-slate-200 print-card page-container relative flex flex-col justify-between" 
          style={{ minHeight: '296mm', boxSizing: 'border-box' }}
        >
          <div>
            {/* Live Watermark indicator */}
            <div className="no-print flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> 
                Live Preview RPH (Kompak A4)
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3 text-blue-600" /> {syncMessage}
              </span>
            </div>

            {/* Document Header with School Logo & Name */}
            <div className="flex items-center gap-3.5 border-b-2 border-slate-900 pb-3 mb-4">
              {schoolLogo ? (
                <img 
                  referrerPolicy="no-referrer" 
                  src={schoolLogo} 
                  alt="Logo Sekolah" 
                  className="h-14 w-14 object-contain shrink-0" 
                />
              ) : (
                /* Elegant default education shield vector fallback */
                <svg className="h-14 w-14 text-slate-700 shrink-0 select-none" viewBox="0 0 100 110" fill="currentColor">
                  <path d="M50 5 L85 22 L85 58 C85 80, 50 102, 50 102 C50 102, 15 80, 15 58 L15 22 Z" fill="none" stroke="currentColor" strokeWidth="6" />
                  <path d="M50 12 L77 26 L77 54 C77 72, 50 89, 50 89 C50 89, 23 72, 23 54 L23 26 Z" fill="currentColor" className="text-blue-500/10" />
                  <path d="M50 25 L50 75 M25 50 L75 50" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" opacity="0.3" />
                  <path d="M40 73 Q50 81 60 73" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                  <polygon points="50,30 60,45 40,45" fill="currentColor" className="text-blue-600" />
                  <circle cx="50" cy="54" r="7" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              )}
              <div className="flex-grow text-left">
                <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-900 leading-tight">Rancangan Pengajaran Harian (RPH)</h2>
                <p className="text-[11px] font-extrabold text-[#0056b3] tracking-normal uppercase mt-0.5 leading-snug">
                  {schoolName || "SILA TETAPKAN NAMA SEKOLAH"}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1">
                  Kurikulum Standard Sekolah Menengah (KSSM) • RBT Tingkatan 3
                </p>
              </div>
            </div>

            {/* Metadata Matrix Grid Box */}
            <table className="w-full text-[11px] border-collapse border border-slate-400 mb-4">
              <tbody>
                <tr>
                  <td className="border border-slate-400 px-2.5 py-1.5 bg-slate-100/80 font-bold w-1/6">Mata Pelajaran</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 w-2/6 font-semibold text-slate-800">Reka Bentuk dan Teknologi (RBT)</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 bg-slate-100/80 font-bold w-1/6">Minggu</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 w-2/6 font-semibold text-slate-800">{minggu}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 px-2.5 py-1.5 bg-slate-100/80 font-bold">Tarikh / Hari</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 text-slate-800">{getFormattedDateDisplay()} / {hari}</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 bg-slate-100/80 font-bold">Kelas</td>
                  <td className="border border-slate-400 px-2.5 py-1.5 font-semibold text-slate-800">{kelas}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 px-2.5 py-1.5 bg-slate-100/80 font-bold">Masa</td>
                  <td colSpan={3} className="border border-slate-400 px-2.5 py-1.5 text-slate-800">{masa}</td>
                </tr>
              </tbody>
            </table>

            {/* Document Main Layout Frame */}
            <div className={`text-[11px] leading-normal ${fontSize} ${spacing}`} id="rphContent">
              <div className="print-break">
                <h3 className="font-extrabold text-slate-900 uppercase border-l-4 border-blue-600 pl-2 bg-slate-100 py-1 mb-1.5">1. Fokus Pembelajaran</h3>
                <div className="space-y-1 pl-1">
                  <p className="text-slate-800">
                    <strong className="text-slate-900">Standard Kandungan:</strong> <span className="font-medium">{rbtDatabase[skKey]?.name || skKey}</span>
                  </p>
                  <p className="text-slate-800">
                    <strong className="text-slate-900">Standard Pembelajaran:</strong> <span className="font-medium">{sp || '-'}</span>
                  </p>
                </div>
              </div>

              <div className="print-break">
                <h3 className="font-extrabold text-slate-900 uppercase border-l-4 border-blue-600 pl-2 bg-slate-100 py-1 mb-1.5">2. Objektif Pembelajaran</h3>
                <p className="pl-1 text-slate-800 whitespace-pre-line font-medium">{objektif || '-'}</p>
              </div>

              <div className="print-break">
                <h3 className="font-extrabold text-slate-900 uppercase border-l-4 border-blue-600 pl-2 bg-slate-100 py-1 mb-1.5">3. Aktiviti Pembelajaran & Pemudahcaraan (PdPc)</h3>
                <div className="pl-1 py-1 text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {aktiviti || 'Sila jana aktiviti menggunakan "Jana PdPc AI" atau tulis secara manual.'}
                </div>
              </div>

              <div className="print-break">
                <h3 className="font-extrabold text-slate-900 uppercase border-l-4 border-blue-600 pl-2 bg-slate-100 py-1 mb-1.5">4. Bahan Bantu Mengajar (BBM)</h3>
                <p className="pl-1 py-1 text-slate-800 font-medium">{bbm || '-'}</p>
              </div>

              <div className="print-break mt-1.5">
                <h3 className="font-extrabold text-slate-900 uppercase border-l-4 border-blue-600 pl-2 bg-slate-100 py-1 mb-1.5">5. Refleksi & Impak</h3>
                <p className="pl-1 py-1 text-slate-800 font-medium whitespace-pre-line">
                  {refleksi || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures and strict margin layout */}
          <div className="mt-10 pt-4 border-t border-slate-200 grid grid-cols-2 text-[9px] text-slate-400 font-semibold uppercase tracking-wider print-break">
            <div>Disemak Oleh: ___________________________</div>
            <div className="text-right">Muka Surat 1 daripada 1 | RPH T3 Pro</div>
          </div>
        </section>
          </div>
        )}
      </main>

      {/* WEBHOOK CLOUD CONFIGURATION MODAL */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CloudLightning className="h-4 w-4 text-blue-400" /> Sambungan Google Sheets
              </h3>
              <button 
                onClick={() => setIsSetupModalOpen(false)} 
                className="text-slate-455 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Masukkan URL <strong>Google Apps Script Web App</strong> anda untuk menghubungkan RPH ini terus ke rekod Google Sheets peribadi anda di awan. Hal ini membolehkan anda membuat sandaran bersepadu.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Webhook URL</label>
                <input 
                  type="text" 
                  value={tempWebhookUrl}
                  onChange={(e) => setTempWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Apps Script Guide Area */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <span className="text-[10px] uppercase font-bold text-blue-400">Pilih Format & Kaedah Simpan:</span>
                  <div className="grid grid-cols-3 bg-slate-900 border border-slate-800 p-0.5 rounded-lg select-none gap-0.5 max-w-full overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setScriptType('weekly_doc_pdf')}
                      className={`px-1 py-1 text-[8px] sm:text-[9px] font-extrabold rounded-md cursor-pointer transition text-center truncate ${scriptType === 'weekly_doc_pdf' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                      title="Simpan dalam Google Sheets, Google Docs & fail PDF mengikut minggu"
                    >
                      📁📝 Sheets+PDF (Syor)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setScriptType('weekly_folder')}
                      className={`px-1 py-1 text-[8px] sm:text-[9px] font-extrabold rounded-md cursor-pointer transition text-center truncate ${scriptType === 'weekly_folder' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                      title="Urutan fail Google Sheets berbeza mengikut minggu"
                    >
                      📁 Sheets Saja
                    </button>
                    <button 
                      type="button"
                      onClick={() => setScriptType('single')}
                      className={`px-1 py-1 text-[8px] sm:text-[9px] font-extrabold rounded-md cursor-pointer transition text-center truncate ${scriptType === 'single' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                      title="Satu file Google Sheets untuk simpanan semua RPH"
                    >
                      📄 Sheets Asal
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-450 leading-normal">
                  {scriptType === 'weekly_doc_pdf' ? (
                    <span className="text-blue-400/90 font-medium">
                      🔥 <strong>SUPER AUTOMATION:</strong> Automatik membina Folder <strong>"RPH RBT Tingkatan 3"</strong> ➜ Subfolder Minggu (cth: <strong>"Minggu 15"</strong>). Di dalamnya ia akan menambah baris ke Google Sheets, menjana <strong>Google Docs RPH kemas</strong> dan <strong>fail PDF rasmi</strong> secara serentak!
                    </span>
                  ) : scriptType === 'weekly_folder' ? (
                    <span className="text-blue-400/90 font-medium">
                      📁 <strong>Mingguan:</strong> Membina Folder <strong>"RPH RBT Tingkatan 3"</strong> ➜ Subfolder Minggu (cth: <strong>"Minggu 15"</strong>) ➜ Membina fail Google Sheets berasingan bagi rujukan minggu berikut.
                    </span>
                  ) : (
                    <span>
                      Menambah baris data RPH terus ke tab aktif sedia ada di dalam dokumen Google Sheets yang anda tetapkan sebagai aktif (satu fail tunggal).
                    </span>
                  )}
                </p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-[9.5px] text-amber-300 leading-relaxed space-y-2">
                  <div>
                    ⚠️ <strong>PANDUAN KEMAS KINI GOOGLE SCRIPT (MIGRASI FOLDER):</strong><br />
                    Jika anda dapati fail Google Doc/PDF anda masih tersimpan di <code>My Drive / MyDrive</code> (bukan di dalam folder mingguan), sila pautkan kod terbaru dengan menekan pautan <strong>Deploy ➜ New Deployment (atau Manage Deployments)</strong>, tukar versi drop-down ke <strong>"New Version" (Versi Baru)</strong>, dan klik <strong>Deploy</strong> sekali lagi. Web App anda hanya akan membaca perubahan kod folder terkini apabila ia di-deploy di bawah versi baharu!
                  </div>
                  <div className="border-t border-amber-500/15 pt-2">
                    🔑 <strong>SINKRONISASI GAGAL / "You do not have permission to call DocumentApp.create" (RALAT KEBENARAN):</strong><br />
                    Jika dikesan ralat akses (Permission), Google Web App memerlukan anda memberikan kebenaran manual. <strong>Sangat Penting:</strong> Selepas tampal kod baru, wajib klik ikon 💾 <strong>Simpan (Save)</strong> atau tekan <strong>Ctrl + S</strong> terlebih dahulu. Kemudian, pilih fungsi <code>triggerAuthorization</code> dari drop-down fungsi di bar atas, klik <strong>▶ Run (Jalankan)</strong> ➜ klik "Review Permissions" ➜ pilih akaun e-mel anda ➜ Advanced ➜ Go to... (Unsafe) ➜ Allow. Selepas itu, deploy semula seperti biasa.
                  </div>
                </div>

                <div className="relative">
                  <pre className="text-[9px] text-slate-500 overflow-x-auto p-2.5 bg-slate-905 rounded border border-slate-800 max-h-40 font-mono">
                    {scriptType === 'weekly_doc_pdf' ? (
`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // 1. Dapatkan atau bina Folder Utama Google Drive
    var folderName = "RPH RBT Tingkatan 3";
    var parentFolders = DriveApp.getFoldersByName(folderName);
    var parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.createFolder(folderName);
    
    // 2. Dapatkan atau bina Subfolder berdasarkan Minggu (cth: "Minggu 15")
    var mingguRaw = data.minggu ? data.minggu.toString() : "Tiada Minggu";
    var mingguName = mingguRaw.indexOf("Minggu") === -1 ? "Minggu " + mingguRaw : mingguRaw;
    var subFolders = parentFolder.getFoldersByName(mingguName);
    var subFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(mingguName);
    
    // 3. Dapatkan atau bina Google Sheets mingguan di dalam subfolder tersebut
    var sheetFileName = "RPH RBT - " + mingguName;
    var files = subFolder.getFilesByName(sheetFileName);
    var spreadsheet;
    var isNewSheet = false;
    
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(files.next().getId());
    } else {
      spreadsheet = SpreadsheetApp.create(sheetFileName);
      isNewSheet = true;
      
      var newSheet = spreadsheet.getSheets()[0];
      newSheet.appendRow([
        "Tarikh Rekod", "Minggu", "Kelas", "Tarikh RPH / Hari", "Masa", 
        "Standard Kandungan", "Standard Pembelajaran", "Objektif Pembelajaran", 
        "Aktiviti Pembelajaran", "Bahan Bantu Mengajar (BBM)", "Refleksi"
      ]);
      newSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#e6f4ea");
    }
    
    var sheet = spreadsheet.getSheets()[0];
    sheet.appendRow([
      new Date(), data.minggu, data.kelas, data.tarikh, data.masa, 
      data.sk, data.sp, data.objektif, data.aktiviti, data.bbm, data.refleksi
    ]);
    
    SpreadsheetApp.flush();
    Utilities.sleep(1000);
    
    var sheetMoveStatus = "tidak perlu alih";
    if (isNewSheet) {
      sheetMoveStatus = moveFileToFolder(spreadsheet.getId(), subFolder);
    }
    
    // 4. BINA GOOGLE DOC & FORMAT RPH DENGAN JADUAL KEMAS
    var cleanTarikh = data.tarikh ? data.tarikh.toString().replace(/[\/\\?*:\\|"<>&]/g, "-") : "";
    var docTitle = "Dokumen RPH - " + data.kelas + " [" + cleanTarikh + "]";
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();
    
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);
    
    // PEMASUKAN LENCANA SEKOLAH SECARA DINAMIK (PILIHAN BASE64 / LINK FAIL)
    var schoolLogoData = data.schoolLogo;
    var logoBlob = null;
    
    if (schoolLogoData && schoolLogoData.indexOf("data:") === 0) {
      try {
        var splitData = schoolLogoData.split(",");
        var contentType = "image/png";
        var base64String = splitData[0];
        if (splitData.length > 1) {
          base64String = splitData[1];
          if (splitData[0].indexOf("image/jpeg") !== -1) contentType = "image/jpeg";
          else if (splitData[0].indexOf("image/gif") !== -1) contentType = "image/gif";
        }
        var decoded = Utilities.base64Decode(base64String);
        logoBlob = Utilities.newBlob(decoded, contentType, "logo_sekolah");
      } catch (baseErr) {
        Logger.log("Ralat menyahkod Base64 logo: " + baseErr.toString());
      }
    } else if (schoolLogoData && schoolLogoData.indexOf("http") === 0) {
      try {
        var logoResponse = UrlFetchApp.fetch(schoolLogoData);
        logoBlob = logoResponse.getBlob();
      } catch (urlErr) {
        Logger.log("Ralat memuat turun URL logo: " + urlErr.toString());
      }
    }
    
    // Pautan sandaran jika tiada logo dijumpai dalam payload
    if (!logoBlob) {
      var logoUrl = "https://upload.wikimedia.org/wikipedia/ms/0/07/Sekolah_Menengah_Kebangsaan_Kunak.png";
      try {
        var logoResponse = UrlFetchApp.fetch(logoUrl);
        logoBlob = logoResponse.getBlob();
      } catch (logoErr) {
        Logger.log("Sistem melangkau pautan lencana atas ralat atau talian internet: " + logoErr.toString());
      }
    }
    
    if (logoBlob) {
      try {
        var logoParagraph = body.appendParagraph("");
        logoParagraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        var logoImage = logoParagraph.appendInlineImage(logoBlob);
        logoImage.setWidth(50);
        logoImage.setHeight(54); // Nisbah dikekalkan (50x54)
        logoParagraph.setSpacingAfter(4);
      } catch (imgErr) {
        Logger.log("Gagal memaparkan lencana dalam Google Doc: " + imgErr.toString());
      }
    }
    
    var t1 = body.appendParagraph("RANCANGAN PENGAJARAN HARIAN (RPH)");
    t1.setHeading(DocumentApp.ParagraphHeading.TITLE);
    t1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    var tSchool = body.appendParagraph(data.schoolName || "SMK KUNAK");
    tSchool.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    tSchool.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    tSchool.editAsText().setBold(true);
    
    var t2 = body.appendParagraph("KURIKULUM STANDARD SEKOLAH MENENGAH (KSSM) • RBT TINGKATAN 3");
    t2.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    t2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph("").setSpacingAfter(8);
    
    var tableData = [
      ["Minggu / Rujukan", mingguName + "  |  " + data.tarikh],
      ["Mata Pelajaran", "Reka Bentuk dan Teknologi (RBT) Tingkatan 3"],
      ["Kelas & Waktu", data.kelas + "  [ " + data.masa + " ]"],
      ["Standard Kandungan (SK)", data.sk],
      ["Standard Pembelajaran (SP)", data.sp],
      ["Objektif Pembelajaran", "Pada akhir PdPc, murid dapat:\n" + data.objektif],
      ["Aktiviti Pembelajaran (PdPc)", data.aktiviti],
      ["Bahan Bantu Mengajar (BBM)", data.bbm],
      ["Refleksi / Impak", data.refleksi]
    ];
    
    var table = body.appendTable(tableData);
    table.setBorderColor("#22c55e");
    table.setBorderWidth(1.2);
    
    for (var r = 0; r < tableData.length; r++) {
      var row = table.getRow(r);
      row.getCell(0).setWidth(150);
      row.getCell(0).editAsText().setBold(true);
      row.getCell(0).setBackgroundColor("#f0fdf4");
      row.getCell(1).editAsText().setFontSize(10.5);
    }
    
    doc.saveAndClose();
    Utilities.sleep(1000); // Tunggu dokumen selesai diproses oleh Google Drive
    
    var pdfStatus = "Sukses";
    try {
      var docFile = DriveApp.getFileById(doc.getId());
      var pdfBlob = docFile.getAs("application/pdf");
      var pdfFile = subFolder.createFile(pdfBlob);
      pdfFile.setName("Format PDF - RPH T3 " + data.kelas + " [" + cleanTarikh + "].pdf");
    } catch (pdfErr) {
      pdfStatus = "Ralat penukaran PDF: " + pdfErr.toString();
    }
    
    // Alihkan fail Google Doc ke Subfolder secara selamat & kalis ralat selepas PDF dijana
    var docMoveStatus = moveFileToFolder(doc.getId(), subFolder);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success", 
      message: "Sukses! RPH disimpan ke Sheets & fail Google Docs serta PDF telah dijana di Google Drive anda! (Status PDF: " + pdfStatus + ", Alih Doc: " + docMoveStatus + ", Alih Sheet: " + sheetMoveStatus + ")"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi pembantu untuk memindahkan fail ke subfolder secara selamat & kalis ralat dengan sela masa
function moveFileToFolder(fileId, targetFolder) {
  try {
    Utilities.sleep(1500); // Benarkan Google Drive menyelesaikan operasi hulu
    var file = DriveApp.getFileById(fileId);
    try {
      file.moveTo(targetFolder);
      return "Sukses";
    } catch (e) {
      try {
        targetFolder.addFile(file);
      } catch (addErr) {}
      try {
        var parents = file.getParents();
        while (parents.hasNext()) {
          var parent = parents.next();
          if (parent.getId() !== targetFolder.getId()) {
            parent.removeFile(file);
          }
        }
      } catch (remErr) {}
      return "Sukses (Fallback)";
    }
  } catch (err) {
    return "Gagal: " + err.toString();
  }
}

// JALANKAN FUNGSI INI SEKALI SAHAJA DALAM EDITOR APPS SCRIPT UNTUK MEMBERIKAN KEBENARAN AKSES (AUTHORIZATION POP-UP)
function triggerAuthorization() {
  Logger.log("Memulai proses kelulusan akses...");
  DriveApp.getRootFolder();
  var doc = DocumentApp.create("Kebenaran_Akses_RPH_RBT");
  DriveApp.getFileById(doc.getId()).setTrashed(true); // Buang fail pengesahan dummy ke tong sampah
  SpreadsheetApp.create("Kebenaran_Akses_Sheets_RPH");
  Logger.log("Selesai! Kebenaran untuk Google Drive, Docs & Sheets telah berjaya diluluskan. Sila Deploy semula Apps Script!");
}`
                    ) : scriptType === 'weekly_folder' ? (
`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // 1. Dapatkan atau bina Folder Utama Google Drive
    var folderName = "RPH RBT Tingkatan 3";
    var parentFolders = DriveApp.getFoldersByName(folderName);
    var parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.createFolder(folderName);
    
    // 2. Dapatkan atau bina Subfolder berdasarkan Minggu (cth: "Minggu 15")
    var mingguRaw = data.minggu ? data.minggu.toString() : "Tiada Minggu";
    var mingguName = mingguRaw.indexOf("Minggu") === -1 ? "Minggu " + mingguRaw : mingguRaw;
    var subFolders = parentFolder.getFoldersByName(mingguName);
    var subFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(mingguName);
    
    // 3. Dapatkan atau bina Google Sheets mingguan di dalam subfolder tersebut
    var fileName = "RPH RBT - " + mingguName;
    var files = subFolder.getFilesByName(fileName);
    var spreadsheet;
    
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(files.next().getId());
    } else {
      spreadsheet = SpreadsheetApp.create(fileName);
      moveFileToFolder(spreadsheet.getId(), subFolder); // Alihkan terus ke subfolder secara selamat
      
      var newSheet = spreadsheet.getSheets()[0];
      newSheet.appendRow([
        "Tarikh Rekod", "Minggu", "Kelas", "Tarikh RPH / Hari", "Masa", 
        "Standard Kandungan", "Standard Pembelajaran", "Objektif Pembelajaran", 
        "Aktiviti Pembelajaran", "Bahan Bantu Mengajar (BBM)", "Refleksi"
      ]);
      newSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#e6f4ea");
    }
    
    var sheet = spreadsheet.getSheets()[0];
    sheet.appendRow([
      new Date(), 
      data.minggu, 
      data.kelas, 
      data.tarikh, 
      data.masa, 
      data.sk, 
      data.sp, 
      data.objektif, 
      data.aktiviti, 
      data.bbm, 
      data.refleksi
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "RPH disimpan di folder!"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi pembantu untuk memindahkan fail ke subfolder secara selamat & kalis ralat
function moveFileToFolder(fileId, targetFolder) {
  try {
    var file = DriveApp.getFileById(fileId);
    try {
      file.moveTo(targetFolder);
    } catch (e) {
      try {
        targetFolder.addFile(file);
      } catch (addErr) {}
      try {
        var parents = file.getParents();
        while (parents.hasNext()) {
          var parent = parents.next();
          if (parent.getId() !== targetFolder.getId()) {
            parent.removeFile(file);
          }
        }
      } catch (remErr) {}
    }
  } catch (err) {}
}

// JALANKAN FUNGSI INI SEKALI SAHAJA DALAM EDITOR APPS SCRIPT UNTUK MEMBERIKAN KEBENARAN AKSES (AUTHORIZATION POP-UP)
function triggerAuthorization() {
  Logger.log("Memulai proses kelulusan akses...");
  DriveApp.getRootFolder();
  SpreadsheetApp.create("Kebenaran_Akses_Sheets_RPH");
  Logger.log("Selesai! Kebenaran untuk Google Drive & Sheets telah berjaya diluluskan. Sila Deploy semula Apps Script!");
}`
                    ) : (
`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([
    new Date(), 
    data.minggu, 
    data.kelas, 
    data.tarikh, 
    data.masa, 
    data.sk, 
    data.sp, 
    data.objektif, 
    data.aktiviti, 
    data.bbm, 
    data.refleksi
  ]);
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}`
                    )}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = scriptType === 'weekly_doc_pdf' ? 
`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderName = "RPH RBT Tingkatan 3";
    var parentFolders = DriveApp.getFoldersByName(folderName);
    var parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.createFolder(folderName);
    var mingguRaw = data.minggu ? data.minggu.toString() : "Tiada Minggu";
    var mingguName = mingguRaw.indexOf("Minggu") === -1 ? "Minggu " + mingguRaw : mingguRaw;
    var subFolders = parentFolder.getFoldersByName(mingguName);
    var subFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(mingguName);
    var sheetFileName = "RPH RBT - " + mingguName;
    var files = subFolder.getFilesByName(sheetFileName);
    var spreadsheet;
    var isNewSheet = false;
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(files.next().getId());
    } else {
      spreadsheet = SpreadsheetApp.create(sheetFileName);
      isNewSheet = true;
      var newSheet = spreadsheet.getSheets()[0];
      newSheet.appendRow([
        "Tarikh Rekod", "Minggu", "Kelas", "Tarikh RPH / Hari", "Masa", 
        "Standard Kandungan", "Standard Pembelajaran", "Objektif Pembelajaran", 
        "Aktiviti Pembelajaran", "Bahan Bantu Mengajar (BBM)", "Refleksi"
      ]);
      newSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#e6f4ea");
    }
    var sheet = spreadsheet.getSheets()[0];
    sheet.appendRow([
      new Date(), data.minggu, data.kelas, data.tarikh, data.masa, 
      data.sk, data.sp, data.objektif, data.aktiviti, data.bbm, data.refleksi
    ]);
    
    SpreadsheetApp.flush();
    Utilities.sleep(1000);
    
    var sheetMoveStatus = "tidak perlu alih";
    if (isNewSheet) {
      sheetMoveStatus = moveFileToFolder(spreadsheet.getId(), subFolder);
    }

    var cleanTarikh = data.tarikh ? data.tarikh.toString().replace(/[\/\\?*:\\|"<>&]/g, "-") : "";
    var docTitle = "Dokumen RPH - " + data.kelas + " [" + cleanTarikh + "]";
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();
    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(36);
    body.setMarginRight(36);
    
    // PEMASUKAN LENCANA SEKOLAH SECARA DINAMIK (PILIHAN BASE64 / LINK FAIL)
    var schoolLogoData = data.schoolLogo;
    var logoBlob = null;
    
    if (schoolLogoData && schoolLogoData.indexOf("data:") === 0) {
      try {
        var splitData = schoolLogoData.split(",");
        var contentType = "image/png";
        var base64String = splitData[0];
        if (splitData.length > 1) {
          base64String = splitData[1];
          if (splitData[0].indexOf("image/jpeg") !== -1) contentType = "image/jpeg";
          else if (splitData[0].indexOf("image/gif") !== -1) contentType = "image/gif";
        }
        var decoded = Utilities.base64Decode(base64String);
        logoBlob = Utilities.newBlob(decoded, contentType, "logo_sekolah");
      } catch (baseErr) {
        Logger.log("Ralat menyahkod Base64 logo: " + baseErr.toString());
      }
    } else if (schoolLogoData && schoolLogoData.indexOf("http") === 0) {
      try {
        var logoResponse = UrlFetchApp.fetch(schoolLogoData);
        logoBlob = logoResponse.getBlob();
      } catch (urlErr) {
        Logger.log("Ralat memuat turun URL logo: " + urlErr.toString());
      }
    }
    
    // Pautan sandaran jika tiada logo dijumpai dalam payload
    if (!logoBlob) {
      var logoUrl = "https://upload.wikimedia.org/wikipedia/ms/0/07/Sekolah_Menengah_Kebangsaan_Kunak.png";
      try {
        var logoResponse = UrlFetchApp.fetch(logoUrl);
        logoBlob = logoResponse.getBlob();
      } catch (logoErr) {
        Logger.log("Sistem melangkau pautan lencana atas ralat atau talian internet: " + logoErr.toString());
      }
    }
    
    if (logoBlob) {
      try {
        var logoParagraph = body.appendParagraph("");
        logoParagraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        var logoImage = logoParagraph.appendInlineImage(logoBlob);
        logoImage.setWidth(50);
        logoImage.setHeight(54); // Nisbah dikekalkan (50x54)
        logoParagraph.setSpacingAfter(4);
      } catch (imgErr) {
        Logger.log("Gagal memaparkan lencana dalam Google Doc: " + imgErr.toString());
      }
    }
    
    var t1 = body.appendParagraph("RANCANGAN PENGAJARAN HARIAN (RPH)");
    t1.setHeading(DocumentApp.ParagraphHeading.TITLE);
    t1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    var tSchool = body.appendParagraph(data.schoolName || "SMK KUNAK");
    tSchool.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    tSchool.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    tSchool.editAsText().setBold(true);
    
    var t2 = body.appendParagraph("KURIKULUM STANDARD SEKOLAH MENENGAH (KSSM) • RBT TINGKATAN 3");
    t2.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    t2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph("").setSpacingAfter(8);
    var tableData = [
      ["Minggu / Rujukan", mingguName + "  |  " + data.tarikh],
      ["Mata Pelajaran", "Reka Bentuk dan Teknologi (RBT) Tingkatan 3"],
      ["Kelas & Waktu", data.kelas + "  [ " + data.masa + " ]"],
      ["Standard Kandungan (SK)", data.sk],
      ["Standard Pembelajaran (SP)", data.sp],
      ["Objektif Pembelajaran", "Pada akhir PdPc, murid dapat:\\n" + data.objektif],
      ["Aktiviti Pembelajaran (PdPc)", data.aktiviti],
      ["Bahan Bantu Mengajar (BBM)", data.bbm],
      ["Refleksi / Impak", data.refleksi]
    ];
    var table = body.appendTable(tableData);
    table.setBorderColor("#22c55e");
    table.setBorderWidth(1.2);
    for (var r = 0; r < tableData.length; r++) {
      var row = table.getRow(r);
      row.getCell(0).setWidth(150);
      row.getCell(0).editAsText().setBold(true);
      row.getCell(0).setBackgroundColor("#f0fdf4");
      row.getCell(1).editAsText().setFontSize(10.5);
    }
    doc.saveAndClose();
    Utilities.sleep(1000); // Tunggu dokumen selesai diproses oleh Google Drive
    
    var pdfStatus = "Sukses";
    try {
      var docFile = DriveApp.getFileById(doc.getId());
      var pdfBlob = docFile.getAs("application/pdf");
      var pdfFile = subFolder.createFile(pdfBlob);
      pdfFile.setName("Format PDF - RPH T3 " + data.kelas + " [" + cleanTarikh + "].pdf");
    } catch (pdfErr) {
      pdfStatus = "Ralat penukaran PDF: " + pdfErr.toString();
    }
    
    // Alihkan fail Google Doc ke Subfolder secara selamat selepas PDF dijana
    var docMoveStatus = moveFileToFolder(doc.getId(), subFolder);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success", 
      message: "Sukses! RPH disimpan ke Sheets & fail Google Docs serta PDF telah dijana di Google Drive anda! (Status PDF: " + pdfStatus + ", Alih Doc: " + docMoveStatus + ", Alih Sheet: " + sheetMoveStatus + ")"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi pembantu untuk memindahkan fail ke subfolder secara selamat & kalis ralat dengan sela masa
function moveFileToFolder(fileId, targetFolder) {
  try {
    Utilities.sleep(1500); // Benarkan Google Drive menyelesaikan operasi hulu
    var file = DriveApp.getFileById(fileId);
    try {
      file.moveTo(targetFolder);
      return "Sukses";
    } catch (e) {
      try {
        targetFolder.addFile(file);
      } catch (addErr) {}
      try {
        var parents = file.getParents();
        while (parents.hasNext()) {
          var parent = parents.next();
          if (parent.getId() !== targetFolder.getId()) {
            parent.removeFile(file);
          }
        }
      } catch (remErr) {}
      return "Sukses (Fallback)";
    }
  } catch (err) {
    return "Gagal: " + err.toString();
  }
}

// JALANKAN FUNGSI INI SEKALI SAHAJA DALAM EDITOR APPS SCRIPT UNTUK MEMBERIKAN KEBENARAN AKSES (AUTHORIZATION POP-UP)
function triggerAuthorization() {
  Logger.log("Memulai proses kelulusan akses...");
  DriveApp.getRootFolder();
  var doc = DocumentApp.create("Kebenaran_Akses_RPH_RBT");
  DriveApp.getFileById(doc.getId()).setTrashed(true); // Buang fail pengesahan dummy ke tong sampah
  SpreadsheetApp.create("Kebenaran_Akses_Sheets_RPH");
  Logger.log("Selesai! Kebenaran untuk Google Drive, Docs & Sheets telah berjaya diluluskan. Sila Deploy semula Apps Script!");
}` : scriptType === 'weekly_folder' ?  
`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderName = "RPH RBT Tingkatan 3";
    var parentFolders = DriveApp.getFoldersByName(folderName);
    var parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.createFolder(folderName);
    var mingguRaw = data.minggu ? data.minggu.toString() : "Tiada Minggu";
    var mingguName = mingguRaw.indexOf("Minggu") === -1 ? "Minggu " + mingguRaw : mingguRaw;
    var subFolders = parentFolder.getFoldersByName(mingguName);
    var subFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(mingguName);
    var fileName = "RPH RBT - " + mingguName;
    var files = subFolder.getFilesByName(fileName);
    var spreadsheet;
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(files.next().getId());
    } else {
      spreadsheet = SpreadsheetApp.create(fileName);
      moveFileToFolder(spreadsheet.getId(), subFolder); // Alihkan terus ke subfolder secara selamat
      var newSheet = spreadsheet.getSheets()[0];
      newSheet.appendRow([
        "Tarikh Rekod", "Minggu", "Kelas", "Tarikh RPH / Hari", "Masa", 
        "Standard Kandungan", "Standard Pembelajaran", "Objektif Pembelajaran", 
        "Aktiviti Pembelajaran", "Bahan Bantu Mengajar (BBM)", "Refleksi"
      ]);
      newSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#e6f4ea");
    }
    var sheet = spreadsheet.getSheets()[0];
    sheet.appendRow([
      new Date(), 
      data.minggu, 
      data.kelas, 
      data.tarikh, 
      data.masa, 
      data.sk, 
      data.sp, 
      data.objektif, 
      data.aktiviti, 
      data.bbm, 
      data.refleksi
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Berjaya disimpan."})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi pembantu untuk memindahkan fail ke subfolder secara selamat & kalis ralat
function moveFileToFolder(fileId, targetFolder) {
  try {
    var file = DriveApp.getFileById(fileId);
    try {
      file.moveTo(targetFolder);
    } catch (e) {
      try {
        targetFolder.addFile(file);
      } catch (addErr) {}
      try {
        var parents = file.getParents();
        while (parents.hasNext()) {
          var parent = parents.next();
          if (parent.getId() !== targetFolder.getId()) {
            parent.removeFile(file);
          }
        }
      } catch (remErr) {}
    }
  } catch (err) {}
}

// JALANKAN FUNGSI INI SEKALI SAHAJA DALAM EDITOR APPS SCRIPT UNTUK MEMBERIKAN KEBENARAN AKSES (AUTHORIZATION POP-UP)
function triggerAuthorization() {
  Logger.log("Memulai proses kelulusan akses...");
  DriveApp.getRootFolder();
  SpreadsheetApp.create("Kebenaran_Akses_Sheets_RPH");
  Logger.log("Selesai! Kebenaran untuk Google Drive & Sheets telah berjaya diluluskan. Sila Deploy semula Apps Script!");
}` : 
`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([
    new Date(), 
    data.minggu, 
    data.kelas, 
    data.tarikh, 
    data.masa, 
    data.sk, 
    data.sp, 
    data.objektif, 
    data.aktiviti, 
    data.bbm, 
    data.refleksi
  ]);
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiedScript(true);
                      showToast("Kod Google Apps Script disalin ke papan klip!", "success");
                      setTimeout(() => setCopiedScript(false), 2000);
                    }}
                    className="absolute bottom-2.5 right-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 px-2.5 py-1 text-[9px] font-extrabold rounded-lg flex items-center gap-1 transition cursor-pointer select-none shadow"
                  >
                    <Clipboard className="h-3 w-3" />
                    {copiedScript ? "Telah Disalin!" : "Salin Kod"}
                  </button>
                </div>

                <div className="text-[9.5px] text-slate-500 space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
                  <div className="font-bold text-slate-400">Cara Penggunaan:</div>
                  <ol className="list-decimal pl-4 space-y-1 font-medium">
                    <li>Sila layari <a href="https://script.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">script.google.com</a> dan buat projek baharu.</li>
                    <li>Salin kod di atas dan tampal ke dalam editor Apps Script.</li>
                    <li>Klik butang **Deploy** (atas kanan) &gt; **New deployment**.</li>
                    <li>Pilih jenis **Web app**. Setkan <strong>Execute as: Me</strong> dan <strong>Who has access: Anyone</strong> (Wajib bagi kelulusan awan).</li>
                    <li>Seterusnya, klik **Deploy**, luluskan keizinan Google Drive / Sheets anda, lalu salin **Web app URL** yang terhasil dan tampal ke ruangan "Webhook URL" di atas!</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setIsSetupModalOpen(false)} 
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveWebhook} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-blue-900/10"
              >
                Simpan Pautan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionErrorPrompt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Masalah Keizinan Dikesan! (Permission Error)
              </h3>
              <button 
                onClick={() => setShowPermissionErrorPrompt(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Apps Script anda memerlukan kelulusan akses manual sebelum ia dibenarkan untuk menjana dokumen Google Docs (DocumentApp) atau PDF pada akaun anda. Ini adalah prosedur keselamatan Google yang biasa.
            </p>
            
            <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl space-y-3">
              <span className="text-[10px] uppercase font-bold text-rose-300">Langkah Penyelesaian Pantas (Wajib Buat Sekali):</span>
              <ol className="list-decimal pl-4 text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>
                  Buka editor kod <strong>Google Apps Script</strong> anda (layari <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">script.google.com</a>).
                </li>
                <li className="text-amber-300 font-medium">
                  Tampal kod terbaru dan klik ikon 💾 <strong>Simpan (Save)</strong> atau tekan <strong>Ctrl + S</strong>. ⚠️ <em>Jika tidak disimpan dahulu, Google tidak dapat mengesan fungsi baru dan ia tidak akan muncul di dropdown!</em>
                </li>
                <li>
                  Di bar menu teratas (toolbar) berhampiran butang <strong>"Run" (Jalankan)</strong>, ada senarai drop-down fungsi: klik drop-down tersebut dan tukar daripada <code>doPost</code> kepada <strong><code>triggerAuthorization</code></strong>.
                </li>
                <li>
                  Klik butang <strong>"Run" (Jalankan)</strong> atau ikon ▶️.
                </li>
                <li>
                  Paparan kelulusan hak milik akan keluar. Klik <strong>"Review Permissions"</strong> (Semak Keizinan) &gt; klik nama e-mel akaun Google anda.
                </li>
                <li>
                  Jika ada amaran keselamatan merah dari Google, klik link kecil <strong>"Advanced" (Lanjutan)</strong> di sebelah bawah, lalu klik pautan <strong>"Go to Untitled project (unsafe)"</strong> di bawahnya.
                </li>
                <li>
                  Klik butang <strong>"Allow" (Benarkan)</strong> di skrin seterusnya.
                </li>
                <li>
                  <strong>SANGAT PENTING:</strong> Selepas meluluskan keizinan tersebut, anda mesti buat deployment yang baharu semula! Klik <strong>Deploy</strong> ➜ <strong>Manage Deployments</strong> ➜ Klik butang <strong>Edit (Ikon Pensel)</strong> ➜ Tukar seting Version ke <strong>"New Version" (Versi Baru)</strong> ➜ Klik <strong>Deploy</strong> semula.
                </li>
              </ol>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowPermissionErrorPrompt(false)} 
                className="bg-blue-600 shadow hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Faham, Saya Selesaikannya Sekarang!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API KEY CONFIGURATION MODAL */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" /> Kunci API Gemini (Pilihan)
              </h3>
              <button 
                onClick={() => setIsApiKeyModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Secara lalai, aplikasi ini menggunakan API kunci pelayan terbina secara percuma. Walau bagaimanapun, jika anda mempunyai kunci API sendiri (AIzaSy...) dan ingin menggunakannya bagi memastikan tiada sekatan pelayan, anda boleh tetapkan di bawah.
            </p>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Kunci API Gemini</label>
              <input 
                type="password" 
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Masukkan kunci AIzaSy..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setIsApiKeyModalOpen(false)} 
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveApiKey} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Simpan Kunci API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFTS MANAGER MODAL */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-500" /> Pengurusan Draf RPH
              </h3>
              <button 
                onClick={() => setIsDraftsModalOpen(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Berikut adalah senarai draf RPH yang disimpan secara lisan dalam simpanan tempatan pelayar anda. Klik "Buka" untuk menyisipkan draf terus ke borang.
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-2">
              {drafts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  Tiada draf yang disimpan dalam pelayar ini buat masa sekarang.
                </div>
              ) : (
                drafts.map((d) => (
                  <div 
                    key={d.id} 
                    onClick={() => handleLoadDraft(d)}
                    className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center gap-4 hover:border-slate-700 transition cursor-pointer"
                  >
                    <div className="flex-grow space-y-1">
                      <div className="text-xs font-bold text-slate-200">
                        Minggu {d.minggu} - Kelas {d.kelas}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Tarikh: {d.tarikh || 'Tiada'}</span>
                        <span>•</span>
                        <span>Disimpan: {d.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleLoadDraft(d)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Buka
                      </button>
                      <button 
                        onClick={(e) => handleDeleteDraft(d.id!, e)} 
                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-1.5 rounded-lg text-xs transition cursor-pointer border border-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button 
                onClick={() => setIsDraftsModalOpen(false)} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CONTAINER */}
      <div id="toastContainer" className="fixed bottom-5 right-5 space-y-2.5 z-50 no-print">
        {toasts.map(t => {
          let bgClass = 'bg-slate-900 border-blue-500 text-blue-400';
          let Icon = CheckCircle2;
          
          if (t.type === 'error') {
            bgClass = 'bg-slate-900 border-rose-500 text-rose-400';
            Icon = AlertCircle;
          } else if (t.type === 'info') {
            bgClass = 'bg-slate-900 border-blue-500 text-blue-400';
            Icon = Info;
          } else if (t.type === 'warning') {
            bgClass = 'bg-slate-900 border-amber-500 text-amber-400';
            Icon = AlertCircle;
          }

          return (
            <div 
              key={t.id} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgClass} shadow-xl text-xs font-semibold transition-all duration-300 w-80`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex-grow">{t.message}</div>
              <button onClick={() => removeToast(t.id)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
