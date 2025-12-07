"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface Settings {
    drawSkeleton: boolean;
    drawTrajectoryWrist: boolean;
    drawTrajectoryElbow: boolean;
    drawTrajectoryShoulder: boolean;
    drawTrajectoryFinger: boolean;
    drawGuidelines: boolean;
}

interface SettingsPanelProps {
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
    lang: "en" | "jp";
}

export default function SettingsPanel({
    settings,
    onSettingsChange,
    lang,
}: SettingsPanelProps) {
    const t = {
        en: {
            title: "Analysis Settings",
            skeleton: "Show Skeleton",
            skeletonDesc: "Overlay stickman figure on body",
            wrist: "Wrist Trajectory",
            wristDesc: "Trace path of wrist movement",
            elbow: "Elbow Trajectory",
            elbowDesc: "Trace path of elbow movement",
            shoulderTraj: "Shoulder Trajectory",
            shoulderTrajDesc: "Trace path of shoulder movement",
            finger: "Index Finger Trajectory",
            fingerDesc: "Track the path of your index finger",
            guidelines: "Guidelines (Shoulder & COG)",
            guidelinesDesc: "Show shoulder height and COG line",
        },
        jp: {
            title: "分析設定",
            skeleton: "骨格・体幹を表示",
            skeletonDesc: "体の動きを表示します",
            wrist: "手首の軌跡",
            wristDesc: "手首の動きを線で追跡します",
            elbow: "肘の軌跡",
            elbowDesc: "肘の動きを線で追跡します",
            shoulderTraj: "肩の軌跡",
            shoulderTrajDesc: "肩の動きを線で追跡します",
            finger: "人差し指の軌跡",
            fingerDesc: "人差し指の動きを追跡します",
            guidelines: "ガイドライン（肩・中心線）",
            guidelinesDesc: "肩の高さ（緑）と中心線（赤）を表示します",
        }
    };

    const text = t[lang];

    const toggleSetting = (key: keyof Settings) => {
        onSettingsChange({ ...settings, [key]: !settings[key] });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-2xl mx-auto mt-8 p-6 rounded-xl glass border border-white/40 shadow-xl"
        >
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{text.title}</h2>

            <div className="space-y-4">
                <ToggleItem
                    label={text.skeleton}
                    description={text.skeletonDesc}
                    isOn={settings.drawSkeleton}
                    onToggle={() => toggleSetting("drawSkeleton")}
                />

                <ToggleItem
                    label={text.wrist}
                    description={text.wristDesc}
                    isOn={settings.drawTrajectoryWrist}
                    onToggle={() => toggleSetting("drawTrajectoryWrist")}
                />

                <ToggleItem
                    label={text.elbow}
                    description={text.elbowDesc}
                    isOn={settings.drawTrajectoryElbow}
                    onToggle={() => toggleSetting("drawTrajectoryElbow")}
                />
                <ToggleItem
                    label={text.shoulderTraj}
                    description={text.shoulderTrajDesc}
                    isOn={settings.drawTrajectoryShoulder}
                    onToggle={() => toggleSetting("drawTrajectoryShoulder")}
                />
                <ToggleItem
                    label={text.finger}
                    description={text.fingerDesc}
                    isOn={settings.drawTrajectoryFinger}
                    onToggle={() => toggleSetting("drawTrajectoryFinger")}
                />

                <ToggleItem
                    label={text.guidelines}
                    description={text.guidelinesDesc}
                    isOn={settings.drawGuidelines}
                    onToggle={() => toggleSetting("drawGuidelines")}
                />
            </div>
        </motion.div>
    );
}

function ToggleItem({
    label,
    description,
    isOn,
    onToggle,
}: {
    label: string;
    description: string;
    isOn: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-lg">{label}</p>
                <p className="text-sm text-gray-200 dark:text-white font-medium">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={clsx(
                    "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                    isOn ? "bg-orange-500" : "bg-zinc-600"
                )}
            >
                <span
                    className={clsx(
                        "inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-300",
                        isOn ? "translate-x-7" : "translate-x-1"
                    )}
                />
            </button>
        </div>
    );
}
