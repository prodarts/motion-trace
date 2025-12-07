"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileVideo } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface UploadAreaProps {
    onFileSelect: (file: File) => void;
    lang: "en" | "jp";
}

export default function UploadArea({ onFileSelect, lang }: UploadAreaProps) {
    const t = {
        en: {
            drop: "Drop video here",
            drag: "Drag & drop your video",
            browse: "or click to browse",
            alert: "Please upload a video file."
        },
        jp: {
            drop: "ここにドロップ",
            drag: "動画をドラッグ＆ドロップ",
            browse: "またはクリックして選択でスタート",
            alert: "動画ファイルをアップロードしてください。"
        }
    };
    const text = t[lang];
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith("video/")) {
                    onFileSelect(file);
                } else {
                    alert(text.alert);
                }
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                onFileSelect(files[0]);
            }
        },
        [onFileSelect]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={clsx(
                "relative w-full aspect-square max-w-md mx-auto rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group",
                isDragging
                    ? "border-white bg-white/10 scale-[1.02]"
                    : "border-gray-300 hover:border-gray-400 bg-white/50 hover:bg-white/80"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
        >
            <input
                id="file-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileInput}
            />

            <div className="z-10 flex flex-col items-center gap-4 text-gray-500 transition-colors group-hover:text-gray-700">
                <div className={clsx(
                    "p-4 rounded-full bg-gray-100 transition-transform duration-300",
                    isDragging ? "scale-110" : "group-hover:scale-110"
                )}>
                    {isDragging ? <FileVideo size={40} className="text-white" /> : <Upload size={40} />}
                </div>
                <div className="text-center">
                    <p className="text-lg font-medium">
                        {isDragging ? text.drop : text.drag}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{text.browse}</p>
                </div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
}
