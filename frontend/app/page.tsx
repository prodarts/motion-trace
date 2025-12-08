"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadArea from "@/components/UploadArea";
import SettingsPanel from "@/components/SettingsPanel";
import ResultView from "@/components/ResultView";
import { Loader2, Globe, ExternalLink, Play } from "lucide-react";

export default function Home() {
  const [lang, setLang] = useState<"en" | "jp">("jp"); // Default to JP as per user preference
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSlowUrl, setResultSlowUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    drawSkeleton: true,
    drawTrajectoryWrist: true,
    drawTrajectoryElbow: false,
    drawTrajectoryShoulder: false,
    drawTrajectoryFinger: true,
    drawGuidelines: true,
  });

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("draw_skeleton", String(settings.drawSkeleton));
    formData.append("draw_trajectory_wrist", String(settings.drawTrajectoryWrist));
    formData.append("draw_trajectory_elbow", String(settings.drawTrajectoryElbow));
    formData.append("draw_trajectory_shoulder", String(settings.drawTrajectoryShoulder));
    formData.append("draw_trajectory_finger", String(settings.drawTrajectoryFinger));
    formData.append("draw_guidelines", String(settings.drawGuidelines));

    try {
      // Use environment variable for production, fallback to localhost for dev
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Processing failed");
      }

      const data = await response.json();
      // Construct full URL for download
      setResultUrl(`${apiUrl}${data.download_url}`);
      setResultSlowUrl(`${apiUrl}${data.download_url_slow}`);
      setIsAnalysisComplete(true);
    } catch (error: any) {
      console.error("Error processing video:", error);
      alert(`Error: ${error.message}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultUrl(null);
    setResultSlowUrl(null);
    setIsProcessing(false);
    setIsAnalysisComplete(false);
  };

  const t = {
    en: {
      title: "Motion Trace",
      subtitle: "AI-powered form analysis for dart players",
      analyzing: "Analyzing form...",
      wait: "This may take a few moments depending on video length",
      adTitle: "While you wait...",
      adText: "Did you know? Professional coaching can improve your accuracy by 40%. (Analysis continues in background)",
      adBtn: "Check out DartsProPower",
      completeTitle: "Analysis Complete! ",
      completeText: "Your video is ready to view.",
      viewResult: "View Result"
    },
    jp: {
      title: "Motion Trace",
      subtitle: "ダーツプレイヤーのためのAIフォーム分析",
      analyzing: "フォームを分析中...",
      wait: "動画の長さによっては数分かかる場合があります",
      adTitle: "お待ちの間に...",
      adText: "あなたのダーツの悩みはここで解決できるかも👇\n（このページを離れても分析は続きます）",
      adBtn: "DartsProPowerを見る",
      completeTitle: "分析が完了しました！",
      completeText: "動画の準備ができました。",
      viewResult: "結果を見る"
    }
  };
  const text = t[lang];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 pt-24 md:pt-8 flex flex-col items-center justify-center relative">
      {/* Language Toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "jp" : "en")}
        className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 rounded-full text-sm font-medium transition-colors backdrop-blur-sm z-10"
      >
        <Globe size={16} />
        {lang === "en" ? "日本語" : "English"}
      </button>

      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            {text.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {text.subtitle}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!file && !resultUrl && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <UploadArea onFileSelect={handleFileSelect} lang={lang} />
              <SettingsPanel settings={settings} onSettingsChange={setSettings} lang={lang} />
            </motion.div>
          )}

          {/* Unified Status View (Processing or Complete) */}
          {(isProcessing || isAnalysisComplete) && (
            <motion.div
              key="status-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 w-full max-w-md mx-auto"
            >
              {/* Dynamic Status Header */}
              <div className="text-center mb-8 min-h-[120px] flex flex-col items-center justify-center">
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key="processing-state"
                  >
                    <Loader2 className="w-12 h-12 text-white animate-spin mb-4 mx-auto" />
                    <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
                      {text.analyzing}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {text.wait}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key="complete-state"
                  >
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{text.completeTitle}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{text.completeText}</p>
                  </motion.div>
                )}
              </div>

              {/* Persistent Ad Card */}
              <motion.div
                layout
                className="p-6 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-700 shadow-xl w-full text-center mb-8"
              >
                <p className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">{text.adTitle}</p>
                <p className="text-sm text-gray-200 mb-4 leading-relaxed font-bold">
                  {text.adText.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))}
                </p>
                <a
                  href="https://dartspropower.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 hover:scale-105 transition-all"
                >
                  {text.adBtn} <ExternalLink size={16} />
                </a>
              </motion.div>

              {/* View Result Button (Appears when complete) */}
              <AnimatePresence>
                {isAnalysisComplete && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsAnalysisComplete(false)}
                    className="w-full py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    <Play fill="currentColor" size={20} />
                    {text.viewResult}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {resultUrl && !isAnalysisComplete && !isProcessing && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultView
                videoUrl={resultUrl}
                videoSlowUrl={resultSlowUrl || undefined}
                onReset={handleReset}
                lang={lang}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
