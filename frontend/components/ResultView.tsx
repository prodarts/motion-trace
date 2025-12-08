
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, RefreshCw } from "lucide-react";

interface ResultViewProps {
    videoUrl: string;
    videoSlowUrl?: string;
    onReset: () => void;
    lang: "en" | "jp";
}

export default function ResultView({ videoUrl, videoSlowUrl, onReset, lang }: ResultViewProps) {
    const t = {
        en: {
            downloadVideo: "Download Video",
            downloadSlow: "Download Slow Mo",
            processAnother: "Process Another",
            poweredBy: "Powered by"
        },
        jp: {
            downloadVideo: "動画を保存",
            downloadSlow: "スロー版を保存",
            processAnother: "もう一度",
            poweredBy: "Powered by"
        }
    };

    const text = t[lang];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto flex flex-col items-center"
        >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-zinc-900 mb-8 flex flex-col items-center justify-center p-8 text-center border border-zinc-800">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                    {lang === "en" ? "Analysis Complete!" : "分析完了！"}
                </h3>
                <p className="text-gray-400 max-w-md">
                    {lang === "en"
                        ? "Your video has been processed successfully. Please download it below to view the results."
                        : "動画の処理が完了しました。以下のボタンからダウンロードして結果をご覧ください。"}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-8 w-full max-w-2xl">
                <a
                    href={videoUrl}
                    download="motion-trace-result.mp4"
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-200 text-black rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg min-w-[200px]"
                >
                    <Download size={24} />
                    {text.downloadVideo}
                </a>

                {videoSlowUrl && (
                    <a
                        href={videoSlowUrl}
                        download="motion-trace-result-slow.mp4"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold text-base transition-all hover:scale-105 shadow-lg min-w-[240px] whitespace-nowrap"
                    >
                        <Download size={24} />
                        {text.downloadSlow}
                    </a>
                )}

                <button
                    onClick={onReset}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-lg border border-gray-200 min-w-[200px]"
                >
                    <RefreshCw size={24} />
                    {text.processAnother}
                </button>
            </div>

            <div className="text-gray-400 text-sm font-medium tracking-wide">
                {text.poweredBy} <a href="https://dartspropower.com" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline">DartsProPower</a>
            </div>
        </motion.div>
    );
}
