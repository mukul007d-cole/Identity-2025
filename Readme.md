# AI Smart Glasses — ESP32-CAM + Web + AI Backend

A modular, production-lean prototype of wearable AI glasses built using **ESP32-CAM hardware**, a **Node.js backend**, and an **intelligent multimodal pipeline**.

Originally built for the **IDENTITY Exhibition 2025 at Dezyne École College Ajmer**.

---

## 📌 Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Backend API Reference](#backend-api-reference)
- [ESP32 Hardware Setup](#esp32-hardware-setup)
- [Frontend Usage](#frontend-usage)
- [Vision Pipeline](#vision-pipeline)
- [Audio + Speech Pipeline](#audio--speech-pipeline)
- [Challenges and Engineering Solutions](#challenges-and-engineering-solutions)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## 🧠 Introduction

This project demonstrates how **low-cost IoT hardware** can be combined with **cloud-based AI** to deliver a wearable, hands-free assistant capable of:

- Understanding voice commands
- Analyzing real-world visuals from a camera sensor
- Returning contextual AI responses
- Speaking outputs back to the user

The **ESP32-CAM** acts as the **vision module**, while the backend manages:

- AI inference (Gemini API)
- Speech transcription
- Text-to-speech synthesis
- Real-time communication with the frontend

> Goal: **Build a real-world AI wearable baseline** without relying on expensive proprietary hardware like Vision Pro or Ray-Ban Meta.

---

## ⭐ Features

### 🧠 AI Conversation
- Natural language conversation
- Context-aware responses
- Multimodal reasoning (vision + text)

### 👁️ Visual Intelligence
- Single snapshot capture
- Live MJPEG stream support
- AI-powered image analysis (object + environment)

### 🎙️ Voice Input & Output
- Browser STT (Web Speech API, WebM/WAV uploads)
- Gemini response generation
- TTS WAV file synthesis

### 🖥️ Dashboard UI
- See what the camera sees
- Chat or voice interaction
- Debug logs
- Realtime state tracking

---

+------------------+ +------------------+ +----------------------+
| ESP32-CAM | -----> | Node Backend | ---> | Gemini / AI Inference|
| (Camera Module) | | (Web + WS + API) | | Models and Services |
+------------------+ +------------------+ +----------------------+
^ |
| v
+--------------- Web UI / Mobile ----------------


The backend is the **central brain**, orchestrating communication, image capture, AI processing, speech generation, and UI updates.

---

## 🧰 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Socket.IO
- MJPEG stream rendering

### Backend
- Node.js + Express
- Socket.IO
- Multer (file uploads)
- Gemini REST API
- MongoDB (optional log storage)

### Hardware
- ESP32-CAM AI Thinker
- OV2640 camera sensor
- FTDI programmer
- Stable 5V supply (recommended)

---

## 📁 Directory Structure



project/
│
├── backend
│ ├── server.js
│ ├── app.js
│ ├── routes/
│ ├── controllers/
│ ├── services/
│ ├── models/
│ └── public/audio
│
├── firmware
│ └── esp32_cam.ino
│
├── frontend
│ ├── src/
│ ├── pages/
│ ├── components/
│ └── utils/
│
└── README.md


---

## ⚙️ Installation

### 1️⃣ Clone the repo
```bash
git clone https://github.com/mukul007d-cole/Identity-2025.git
cd ai-smart-glasses

2️⃣ Install backend dependencies
cd backend
npm install

3️⃣ Install frontend dependencies
cd frontend
npm install

4️⃣ Flash ESP32 firmware

Upload:
firmware/esp32_cam.ino


Using Arduino IDE or PlatformIO.

🔐 Environment Variables

Create:

backend/.env

PORT=3000
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGIN=http://localhost:5173


Optional:

MONGO_URI=mongodb://localhost:27017

📡 Backend API Reference
Text Chat

POST /api/chat/text

Example request:

{
  "message": "Explain what you see"
}

Voice Commands

POST /api/audio/voice-command

Multipart audio input (WebM, WAV)

Returns:

transcription
response
audioURL
visionRequired (bool)
Live Stream

GET /api/camera/live

Continuous MJPEG feed
Capture Frame

GET /api/camera/capture
Returns a single JPEG frame
Vision AI

POST /api/vision/analyze
Accepts imageBuffer + optional prompt

🔧 ESP32 Hardware Setup
Wiring Table (FTDI → ESP32-CAM)
FTDI	ESP32-CAM
5V	5V
GND	GND
TX	U0R
RX	U0T
IO0	GND (only while flashing)

After flashing remove IO0 → GND

💻 Frontend Usage

Configure:
frontend/.env.local

Example:
VITE_BACKEND_ENDPOINT=http://localhost:3000

Start:
npm run dev


Open browser:

http://localhost:5173

🔍 Vision Pipeline
ESP32 captures raw JPEG
Backend buffers image
Gemini vision model analyzes & returns structured JSON
UI displays summary + objects

Example Output
{
  "summary": "A desk with a laptop and a white coffee mug.",
  "objects": ["Laptop", "Mug", "Cable"]
}

🔊 Audio + Speech Pipeline
Browser → records PCM/WebM
Backend → STT → text
Gemini → text response
If model requests → capture image
TTS → WAV file generated
UI → plays audio via URL
Fail-safe: If TTS fails, return text only.

🧠 Challenges and Engineering Solutions
⚡ ESP32 Brownout / Reboot
Cause: Combined WiFi + camera power spikes
Solutions:
Use external stable 5V
Avoid USB-only power
Disable flash LED if unnecessary

⏱️ Latency
Prefer single snapshots over streaming inference
Lower camera resolution (SVGA/UXGA)
Cache last frames
Avoid synchronous blocking AI calls

🔐 Serial Debug Locks
Use baud 115200
Avoid delay()
Add watchdog timers

🧵 Concurrency
Queue AI inference
Avoid parallel vision & chat
Emit messages via WebSockets

🔧 Troubleshooting
Problem	Fix
Camera feed lagging	Lower resolution
ESP32 resets	Use external 5V
CORS blocked	Update ALLOWED_ORIGIN
Gemini model missing	Use gemini-1.5-flash
TTS silent	Check file write perms
---
## Made By Mukul Bassi

