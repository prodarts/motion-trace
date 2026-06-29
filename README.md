# Motion Trace

Motion Trace is a local video-analysis tool for dart players.

Upload a throwing-form video, choose which guides to draw, and the app returns a processed video with pose skeletons, arm trajectories, finger traces, and alignment guides.

## Features

- Pose detection with MediaPipe
- Skeleton overlay without face landmarks
- Wrist, elbow, shoulder, and index-finger trajectory traces
- Shoulder-level and body-axis guide lines
- Slow-motion processed output
- Japanese / English UI

## App Structure

- `backend/` - FastAPI, OpenCV, MediaPipe video processing API
- `frontend/` - Next.js frontend for upload, settings, and result preview

## Local Development

Start the backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend uses `http://localhost:8000` by default. For another backend URL, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Privacy Note

Uploaded and processed videos are local runtime files. Do not commit files under `backend/uploads/` or `backend/processed/`.
