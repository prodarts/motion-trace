# Motion Trace

ダーツプレイヤー向けのローカル動画解析ツールです。  
投フォームの動画をアップロードすると、骨格、腕の軌道、指先の軌道、肩ラインなどを重ねた解析動画を生成できます。

This is a local video-analysis tool for dart players.  
Upload a throwing-form video, choose the guide overlays, and generate a processed video with pose skeletons, arm trajectories, finger traces, and alignment guides.

## 日本語

### できること

- MediaPipeによるフォーム姿勢検出
- 顔のランドマークを除いた骨格表示
- 手首、肘、肩、指先の軌道表示
- 肩ライン、体軸ガイドの表示
- 通常速度 / スロー動画の生成
- 日本語 / 英語UI

### 使い方

このアプリはローカルPC上で動かす想定です。  
動画ファイルは自分のPC上で処理されます。

#### 1. リポジトリをダウンロード

```bash
git clone https://github.com/prodarts/motion-trace.git
cd motion-trace
```

#### 2. バックエンドを起動

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. フロントエンドを起動

別のターミナルを開いて実行します。

```bash
cd frontend
npm install
npm run dev:host
```

#### 4. ブラウザで開く

```text
http://localhost:3000
```

同じWi-Fi上のスマホから使う場合は、PCのローカルIPアドレスを調べて、スマホのブラウザで以下のように開きます。

```text
http://<PCのローカルIP>:3000
```

例:

```text
http://192.168.1.23:3000
```

### 必要なもの

- Python 3.11推奨
- Node.js / npm
- 動画処理ができる程度のPC性能

### 注意

- `backend/uploads/` と `backend/processed/` はローカルの一時ファイル用です。
- アップロード動画や処理済み動画はGitHubにコミットしないでください。
- 長い動画や高解像度の動画は処理に時間がかかる場合があります。
- フォーム解析は補助ツールです。最終的な判断はコーチングや実際の練習感覚とあわせて行ってください。

## English

### What It Does

- Detects throwing form with MediaPipe
- Draws pose skeletons while excluding face landmarks
- Traces wrist, elbow, shoulder, and index-finger movement
- Adds shoulder-level and body-axis guide lines
- Generates normal and slow-motion processed videos
- Supports Japanese and English UI

### How to Use

This app is designed to run locally on your computer.  
Your videos are processed on your own machine.

#### 1. Download the Repository

```bash
git clone https://github.com/prodarts/motion-trace.git
cd motion-trace
```

#### 2. Start the Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Start the Frontend

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev:host
```

#### 4. Open in Browser

```text
http://localhost:3000
```

To use it from a phone on the same Wi-Fi network, find your computer's local IP address and open:

```text
http://<your-computer-local-IP>:3000
```

Example:

```text
http://192.168.1.23:3000
```

### Requirements

- Python 3.11 recommended
- Node.js / npm
- A computer with enough performance for video processing

### Notes

- `backend/uploads/` and `backend/processed/` are local runtime folders.
- Do not commit uploaded or processed videos to GitHub.
- Long or high-resolution videos may take time to process.
- This is an assistive analysis tool. Use the output together with coaching, practice, and your own throwing feel.

## Project Structure

```text
backend/   FastAPI, OpenCV, MediaPipe video processing API
frontend/  Next.js upload UI, settings, and result preview
```

## Administrator / Related Site

This project is maintained by the administrator of [Darts Pro Power](https://dartspropower.com/), a darts-focused website sharing player support, practice tools, and darts-related resources.

関連サイト: [Darts Pro Power](https://dartspropower.com/)

## Privacy

This repository does not include API keys, private tokens, or sample personal videos.  
Runtime video files are intentionally ignored by Git.
