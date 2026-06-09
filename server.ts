import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Shared generator logic
  function getAi(customApiKey?: string): GoogleGenAI {
    let apiKey = customApiKey ? customApiKey.trim() : "";
    apiKey = apiKey || (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "");
    
    if (!apiKey) {
      throw new Error("Kunci API Gemini tidak dikesan. Sila sediakan kunci API dalam Settings > Secrets atau masukkan kunci peribadi.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Fungsi pembantu untuk menjana kandungan dengan percubaan semula pintar jika berlaku ralat 503 / 429
  async function generateContentWithRetry(
    ai: GoogleGenAI,
    model: string,
    contents: string,
    systemInstruction: string,
    retries = 3,
    delay = 1000
  ): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
          },
        });
        return response;
      } catch (error: any) {
        const errorMsg = error.message || "";
        const isBusy = /demand|spikes|temporary|busy|unavailable|503/i.test(errorMsg) || 
                       error.status === 503 || error.code === 503 || error.status === "UNAVAILABLE";
        const is429 = /429|quota|exhausted|limit/i.test(errorMsg) || 
                      error.status === 429 || error.code === 429;
                      
        if (i === retries - 1 || (!isBusy && !is429)) {
          throw error;
        }
        
        const waitTime = delay * Math.pow(2, i); // Backoff eksponen: 1s, 2s, 4s...
        console.warn(`[AI Retry] Percubaan ${i + 1}/${retries} untuk model ${model} gagal (${error.status || error.code || "raw"}). Menunggu ${waitTime}ms sebelum mencuba semula. Ralat: ${errorMsg}`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // API 1: Generate Objectives
  app.post("/api/ai/objective", async (req, res) => {
    const { sk, sp, customApiKey } = req.body;
    try {
      const ai = getAi(customApiKey);
      const isCustomUsed = !!(customApiKey && customApiKey.trim());
      console.log(`[AI Obj] Menjana objektif. Sumber kunci: ${isCustomUsed ? "Kunci Peribadi" : "Kunci Kongsi"}`);

      const systemInstruction = "Anda adalah guru pakar RBT KSSM. Bantu bina satu objektif pembelajaran khusus, eksplisit dan boleh diukur yang bermula dengan frasa 'Pada akhir pembelajaran, murid dapat...'. Berikan jawapan terus dalam satu ayat sahaja tanpa format markdown.";
      const contents = `Bina satu objektif pembelajaran untuk Standard Kandungan: ${sk} dan Standard Pembelajaran: ${sp}`;
      
      let response;
      try {
        response = await generateContentWithRetry(ai, "gemini-3.5-flash", contents, systemInstruction, 3, 1000);
      } catch (innerError: any) {
        const errorMsg = innerError.message || "";
        console.warn(`[AI Obj] gemini-3.5-flash gagal sepenuhnya selepas cubaan semula. Mencuba alternatif 'gemini-flash-latest'... Ralat: ${errorMsg}`);
        try {
          response = await generateContentWithRetry(ai, "gemini-flash-latest", contents, systemInstruction, 3, 1000);
        } catch (innerFallbackError: any) {
          const fallbackErrorMsg = innerFallbackError.message || "";
          console.warn(`[AI Obj] gemini-flash-latest ralat juga. Mencuba 'gemini-3.1-flash-lite'... Ralat: ${fallbackErrorMsg}`);
          try {
            response = await generateContentWithRetry(ai, "gemini-3.1-flash-lite", contents, systemInstruction, 2, 1000);
          } catch (finalError: any) {
            throw finalError;
          }
        }
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Ralat membina objektif AI:", error);
      let errorMsg = error.message || "Ralat pelayan kecerdasan buatan";
      
      const isQuotaError = /quota|429|exhausted|limit/i.test(errorMsg) || error.status === 429 || error.code === 429;
      const isBusyError = /demand|spikes|temporary|busy|unavailable|503/i.test(errorMsg) || error.status === 503 || error.code === 503 || error.status === "UNAVAILABLE";
      
      if (isQuotaError) {
        if (customApiKey && customApiKey.trim().length > 0) {
          errorMsg = "Had Kuota Kunci Peribadi: Kunci API Gemini peribadi yang anda masukkan telah melebihi had kuota harian pelan anda. Sila jana Kunci API baru di Google AI Studio atau cuba sebentar lagi!";
        } else {
          errorMsg = "Had kuota harian percuma pelayan kongsi AI (Gemini) telah tamat harian. Sila masukkan kunci peribadi anda melalui butang '⚙️ Kunci API (Pilihan)' di bahagian bawah untuk meneruskannya!";
        }
      } else if (isBusyError) {
        if (customApiKey && customApiKey.trim().length > 0) {
          errorMsg = "Sistem Google sedang mengalami kesesakan trafik yang sangat tinggi saat ini (Ralat 503). Sila cuba klik butang jana sekali lagi dalam beberapa saat untuk mencuba semula.";
        } else {
          errorMsg = "Pelayan kongsi AI percuma Google sedang mengalami kesesakan trafik yang sangat tinggi untuk model ini (Ralat 503). Lonjakan permintaan ini bersifat sementara. Sila cuba butang jana semula dalam beberapa saat, atau gunakan Kunci API peribadi anda untuk kestabilan optimum!";
        }
      }
      res.status(500).json({ error: errorMsg });
    }
  });

  // API 2: Generate Activities
  app.post("/api/ai/activities", async (req, res) => {
    const { sk, sp, objektif, customApiKey } = req.body;
    try {
      const ai = getAi(customApiKey);
      const isCustomUsed = !!(customApiKey && customApiKey.trim());
      console.log(`[AI Acts] Menjana aktiviti. Sumber kunci: ${isCustomUsed ? "Kunci Peribadi" : "Kunci Kongsi"}`);

      const systemInstruction = "Anda adalah Guru Cemerlang Reka Bentuk dan Teknologi (RBT) Malaysia. Bantu jana draf ringkas dan padat bagi aktiviti PdPc (Pembelajaran Abad Ke-21) untuk RPH. TULISKAN AKTIVITI DALAM POINT BERNOMBOR (1. Set Induksi, 2. Aktiviti Utama, dan 3. Penutup) di mana setiap bahagian bermula pada baris baru (newline) yang berasingan secara kemas. Pastikan setiap point sangat pendek, padat, dan terus kepada isi penting pembelajaran untuk menjamin pemuatan satu muka surat.";
      const contents = `Standard Kandungan: ${sk}\nStandard Pembelajaran: ${sp}\nObjektif Pembelajaran: ${objektif}`;
      
      let response;
      try {
        response = await generateContentWithRetry(ai, "gemini-3.5-flash", contents, systemInstruction, 3, 1000);
      } catch (innerError: any) {
        const errorMsg = innerError.message || "";
        console.warn(`[AI Acts] gemini-3.5-flash gagal sepenuhnya selepas cubaan semula. Mencuba alternatif 'gemini-flash-latest'... Ralat: ${errorMsg}`);
        try {
          response = await generateContentWithRetry(ai, "gemini-flash-latest", contents, systemInstruction, 3, 1000);
        } catch (innerFallbackError: any) {
          const fallbackErrorMsg = innerFallbackError.message || "";
          console.warn(`[AI Acts] gemini-flash-latest ralat juga. Mencuba 'gemini-3.1-flash-lite'... Ralat: ${fallbackErrorMsg}`);
          try {
            response = await generateContentWithRetry(ai, "gemini-3.1-flash-lite", contents, systemInstruction, 2, 1000);
          } catch (finalError: any) {
            throw finalError;
          }
        }
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Ralat membina aktiviti AI:", error);
      let errorMsg = error.message || "Ralat pelayan kecerdasan buatan";
      
      const isQuotaError = /quota|429|exhausted|limit/i.test(errorMsg) || error.status === 429 || error.code === 429;
      const isBusyError = /demand|spikes|temporary|busy|unavailable|503/i.test(errorMsg) || error.status === 503 || error.code === 503 || error.status === "UNAVAILABLE";
      
      if (isQuotaError) {
        if (customApiKey && customApiKey.trim().length > 0) {
          errorMsg = "Had Kuota Kunci Peribadi: Kunci API Gemini peribadi yang anda masukkan telah melebihi had kuota harian pelan anda (atau had janaan percuma Google bagi Kunci API tersebut telah tamat sepenuhnya untuk semua model). Sila jana / bina Kunci API baru di Google AI Studio atau cuba sebentar lagi!";
        } else {
          errorMsg = "Had kuota harian percuma pelayan kongsi AI (Gemini) telah tamat harian. Sila masukkan kunci peribadi anda melalui butang '⚙️ Kunci API (Pilihan)' di bahagian bawah untuk meneruskannya dengan serta-merta tanpa sebarang bayaran!";
        }
      } else if (isBusyError) {
        if (customApiKey && customApiKey.trim().length > 0) {
          errorMsg = "Sistem Google sedang mengalami kesesakan trafik yang sangat tinggi saat ini (Ralat 503 / UNAVAILABLE). Lonjakan permintaan ini biasanya bersifat sementara. Sila cuba klik butang jana sekali lagi dalam beberapa saat untuk mencuba semula.";
        } else {
          errorMsg = "Pelayan kongsi AI percuma Google sedang mengalami kesesakan trafik yang sangat tinggi untuk model ini (Ralat 503). Lonjakan permintaan ini bersifat sementara. Sila cuba butang jana semula dalam beberapa saat, atau masukkan Kunci API peribadi anda melalui butang '⚙️ Kunci API (Pilihan)' di bahagian bawah untuk kestabilan optimum!";
        }
      }
      res.status(500).json({ error: errorMsg });
    }
  });

  // API 3: Webhook proxy to bypass CORS
  app.post("/api/sheets-proxy", async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      if (!webhookUrl) {
        return res.status(400).json({ error: "Sila berikan webhookUrl" });
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      res.json({ status: response.status, text: responseText });
    } catch (error: any) {
      console.error("Ralat proksi webhook Google Sheets:", error);
      res.status(500).json({ error: error.message || "Gagal menghubungi Google Apps Script" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve HTML fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server RPH RBT T3 Pro sedang berjalan di http://localhost:${PORT}`);
  });
}

startServer();
