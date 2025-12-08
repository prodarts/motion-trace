import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
from collections import deque
from typing import Optional

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# MediaPipe Setup
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

import asyncio
import time

async def delete_file_delayed(path: str, delay: int = 60):
    """Deletes a file from the filesystem after a delay."""
    await asyncio.sleep(delay)
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted file: {path}")
    except Exception as e:
        print(f"Error deleting file {path}: {e}")

def cleanup_old_files(directory: str, max_age_seconds: int = 300):
    """Deletes files older than max_age_seconds."""
    try:
        now = time.time()
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                if now - os.path.getmtime(file_path) > max_age_seconds:
                    os.remove(file_path)
                    print(f"Cleaned up old file: {file_path}")
    except Exception as e:
        print(f"Error cleaning up files: {e}")

def process_video_logic(
    input_path: str,
    output_path: str,
    draw_skeleton: bool,
    draw_trajectory_wrist: bool,
    draw_trajectory_elbow: bool,
    draw_trajectory_shoulder: bool,
    draw_trajectory_finger: bool,
    draw_guidelines: bool
):
    """
    Processes the video using MediaPipe Pose.
    """
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    # Resize if too large (to prevent memory crash on Render Free Tier)
    MAX_HEIGHT = 720
    if height > MAX_HEIGHT:
        scale = MAX_HEIGHT / height
        width = int(width * scale)
        height = MAX_HEIGHT
        print(f"Resizing video to {width}x{height} for performance")

    def get_coords(landmark):
        return (int(landmark.x * width), int(landmark.y * height))
    
    # Define codec and create VideoWriter
    # mp4v is more compatible with Linux servers (Render) than avc1
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    # Trajectory history
    # Store normalized    # Trajectory history
    # Unlimited history for full path
    left_wrist_hist = []
    right_wrist_hist = []
    left_elbow_hist = []
    right_elbow_hist = []
    left_shoulder_hist = []
    right_shoulder_hist = []
    left_index_hist = []
    right_index_hist = []

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=1 # 0, 1, or 2. 1 is balanced.
    ) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert BGR to RGB
            if height != frame.shape[0]: # Resize if needed
                frame = cv2.resize(frame, (width, height))
            
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False

            # Process
            results = pose.process(image)

            # Convert back to BGR for drawing
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark

                # 1. Draw Skeleton (Stickman) - Body Only (Exclude face 0-10)
                if draw_skeleton:
                    # Filter connections to exclude face
                    body_connections = frozenset([
                        c for c in mp_pose.POSE_CONNECTIONS
                        if c[0] > 10 and c[1] > 10
                    ])
                    
                    # Draw landmarks (only body) manually to exclude face
                    for idx, landmark in enumerate(landmarks):
                        if idx > 10: # Skip face landmarks (0-10)
                            cx, cy = get_coords(landmark)
                            cv2.circle(image, (cx, cy), 4, (255, 255, 255), -1)

                    mp_drawing.draw_landmarks(
                        image,
                        results.pose_landmarks,
                        body_connections,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2)
                    )
                    
                    # Draw Body Axis (Cyan) - Now part of Skeleton
                    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
                    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]

                    if (left_shoulder.visibility > 0.5 and right_shoulder.visibility > 0.5 and
                        left_hip.visibility > 0.5 and right_hip.visibility > 0.5):
                        ls = get_coords(left_shoulder)
                        rs = get_coords(right_shoulder)
                        lh = get_coords(left_hip)
                        rh = get_coords(right_hip)

                        # Midpoints
                        mid_shoulder = ((ls[0] + rs[0]) // 2, (ls[1] + rs[1]) // 2)
                        mid_hip = ((lh[0] + rh[0]) // 2, (lh[1] + rh[1]) // 2)

                        cv2.line(image, mid_shoulder, mid_hip, (255, 255, 0), 2) # Cyan line for Body Axis

                # 2. Update Trajectories
                # Track Points
                if draw_trajectory_wrist:
                    left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                    right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
                    
                    if left_wrist.visibility > 0.5:
                        left_wrist_hist.append(get_coords(left_wrist))
                    if right_wrist.visibility > 0.5:
                        right_wrist_hist.append(get_coords(right_wrist))

                if draw_trajectory_elbow:
                    if landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].visibility > 0.5:
                        left_elbow_hist.append(get_coords(landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]))
                    if landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].visibility > 0.5:
                        right_elbow_hist.append(get_coords(landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]))

                if draw_trajectory_shoulder:
                    if landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].visibility > 0.5:
                        left_shoulder_hist.append(get_coords(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]))
                    if landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].visibility > 0.5:
                        right_shoulder_hist.append(get_coords(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]))

                if draw_trajectory_finger:
                    left_index = landmarks[mp_pose.PoseLandmark.LEFT_INDEX]
                    right_index = landmarks[mp_pose.PoseLandmark.RIGHT_INDEX]

                    if left_index.visibility > 0.5:
                        left_index_hist.append(get_coords(left_index))
                    if right_index.visibility > 0.5:
                        right_index_hist.append(get_coords(right_index))

                # 3. Draw Trajectories
                def draw_trail(hist, color):
                    if len(hist) < 2:
                        return
                    # Draw full path
                    for i in range(1, len(hist)):
                        cv2.line(image, hist[i - 1], hist[i], color, 2)

                # Colors (BGR)
                # Cyan for Left, Magenta for Right
                COLOR_LEFT = (255, 255, 0) 
                COLOR_RIGHT = (255, 0, 255)
                COLOR_INDEX = (0, 255, 255) # Yellow for index finger

                if draw_trajectory_wrist:
                    draw_trail(left_wrist_hist, COLOR_LEFT)
                    draw_trail(right_wrist_hist, COLOR_RIGHT)
                
                if draw_trajectory_elbow:
                    draw_trail(left_elbow_hist, COLOR_LEFT)
                    draw_trail(right_elbow_hist, COLOR_RIGHT)

                if draw_trajectory_shoulder:
                    draw_trail(left_shoulder_hist, COLOR_LEFT)
                    draw_trail(right_shoulder_hist, COLOR_RIGHT)

                if draw_trajectory_finger:
                    draw_trail(left_index_hist, COLOR_INDEX)
                    draw_trail(right_index_hist, COLOR_INDEX)

                # 4. Draw Guidelines (Shoulder Line & COG)
                if draw_guidelines:
                    # Shoulder level
                    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                    
                    if left_shoulder.visibility > 0.5 and right_shoulder.visibility > 0.5:
                        ls = get_coords(left_shoulder)
                        rs = get_coords(right_shoulder)
                        
                        # Draw horizontal line at average shoulder height
                        avg_y = (ls[1] + rs[1]) // 2
                        cv2.line(image, (0, avg_y), (width, avg_y), (0, 255, 0), 1) # Green line

                    # Center of Gravity (COG) - Vertical line from hips
                    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
                    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]

                    if left_hip.visibility > 0.5 and right_hip.visibility > 0.5:
                        lh = get_coords(left_hip)
                        rh = get_coords(right_hip)
                        # Midpoint
                        cog_x = (lh[0] + rh[0]) // 2
                        # Draw vertical line through COG
                        cv2.line(image, (cog_x, 0), (cog_x, height), (0, 0, 255), 1) # Red line for COG

            # 5. Draw Credits (Powered by DartsProPower)
            text = "Powered by DartsProPower"
            font = cv2.FONT_HERSHEY_SIMPLEX
            
            # Dynamic font scale based on width
            # Base scale 1.0 for 1080p width (1920) -> width / 1920
            # Let's try width / 1500 for a good balance
            font_scale = max(0.6, width / 1500.0)
            thickness = max(1, int(font_scale * 2.5))
            
            # Get text size
            (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)
            
            # Position: Bottom Right with padding
            # User requested 20% up from the bottom.
            padding_y = int(height * 0.20) 
            padding_x = int(width * 0.03) # 3% padding from right
            
            x = width - text_width - padding_x
            y = height - padding_y

            # Draw Shadow (Black)
            cv2.putText(image, text, (x + 2, y + 2), font, font_scale, (0, 0, 0), thickness + 2, cv2.LINE_AA)
            # Draw Text (White)
            cv2.putText(image, text, (x, y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

            out.write(image)

    cap.release()
    out.release()

    # Generate Slow Motion Version
    # We will read the processed video and write it out at a lower FPS
    # Or simpler: Re-process? No, that's expensive.
    # We can use ffmpeg if installed, but we only have opencv.
    # OpenCV way: Read processed video, write with lower FPS.
    
    cap_processed = cv2.VideoCapture(output_path)
    output_slow_path = output_path.replace(".mp4", "_slow.mp4")
    
    # Slow motion factor (e.g., 0.5x speed)
    # To make it play slower, we decrease the FPS in the writer
    slow_fps = fps / 2.0
    
    out_slow = cv2.VideoWriter(output_slow_path, fourcc, slow_fps, (width, height))
    
    while cap_processed.isOpened():
        ret, frame = cap_processed.read()
        if not ret:
            break
        out_slow.write(frame)
        
    cap_processed.release()
    out_slow.release()

@app.post("/process")
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    draw_skeleton: bool = Form(True),
    draw_trajectory_wrist: bool = Form(True),
    draw_trajectory_elbow: bool = Form(False),
    draw_trajectory_shoulder: bool = Form(False),
    draw_trajectory_finger: bool = Form(True),
    draw_guidelines: bool = Form(True)
):
    # Validate file type
    if not file.content_type.startswith("video/"):
        return JSONResponse(status_code=400, content={"message": "Invalid file type. Please upload a video."})

    # Generate unique IDs
    request_id = str(uuid.uuid4())
    input_filename = f"{request_id}_{file.filename}"
    output_filename = f"processed_{request_id}.mp4"
    output_slow_filename = f"processed_{request_id}_slow.mp4"
    
    input_path = os.path.join(UPLOAD_DIR, input_filename)
    output_path = os.path.join(PROCESSED_DIR, output_filename)

    # Save uploaded file
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to save file: {e}"})
    
    # Schedule input file deletion immediately after processing (or now if we want to keep it until done)
    # For simplicity, we'll delete input after processing logic finishes in this request, 
    # or add it to background tasks if we were doing async processing.
    # Since we are doing synchronous processing here (simple version), we delete after function call.

    # Cleanup old files
    cleanup_old_files(UPLOAD_DIR)
    cleanup_old_files(PROCESSED_DIR)

    try:
        process_video_logic(
            input_path, 
            output_path, 
            draw_skeleton, 
            draw_trajectory_wrist, 
            draw_trajectory_elbow,
            draw_trajectory_shoulder,
            draw_trajectory_finger,
            draw_guidelines
        )
        
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
             raise Exception("Output video file was not created or is empty.")

    except Exception as e:
        # Cleanup input if failed
        await delete_file_delayed(input_path, delay=0)
        return JSONResponse(status_code=500, content={"message": f"Video processing failed: {e}"})

    # Cleanup input file
    await delete_file_delayed(input_path, delay=0)

    # Return download URL
    # In a real app, you might return a full URL. Here we return a relative path or ID.
    download_url = f"/download/{output_filename}"
    download_url_slow = f"/download/{output_slow_filename}"
    
    return {
        "download_url": download_url, 
        "download_url_slow": download_url_slow,
        "filename": output_filename
    }

@app.get("/download/{filename}")
async def download_video(filename: str, background_tasks: BackgroundTasks):
    file_path = os.path.join(PROCESSED_DIR, filename)
    
    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"message": "File not found or expired."})

    # Schedule deletion after response with a delay to allow for playback/download
    # 60 seconds delay to allow the user to click download after preview starts
    background_tasks.add_task(delete_file_delayed, file_path, 60)
    
    return FileResponse(file_path, media_type="video/mp4", filename=filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
