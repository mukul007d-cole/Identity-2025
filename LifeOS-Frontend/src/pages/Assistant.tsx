import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  User,
  Bot,
  Thermometer,
  Wifi,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Behavior:
 * - VAD detects voice by analysing time-domain samples (RMS-like)
 * - When voice is first detected -> start MediaRecorder (no timeslice)
 * - When silence persists for SILENCE_MS -> stop MediaRecorder
 *   -> browser fires ondataavailable with final Blob -> send to backend
 *
 * Benefits:
 * - No manual chunk assembly (avoids broken WebM headers)
 * - Cleaner and reliable across browsers
 */

const SILENCE_MS = 2500; // silence threshold to send (2.5s)
const VAD_THRESHOLD = 8; // RMS threshold — tune if needed
// MEDIA_TIMESLICE not used in start; kept for reference
const MEDIA_TIMESLICE = 1000;

const Assistant: React.FC = () => {
  const { state, addMessage } = useApp();

  // UI / device state
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [deviceTemp, setDeviceTemp] = useState(42);
  const [signalStrength, setSignalStrength] = useState(85);

  // Connection / socket
  const [serverIP, setServerIP] = useState<string>(() => localStorage.getItem("serverIP") || "");
  const [socketConnected, setSocketConnected] = useState(false);
  const [statusText, setStatusText] = useState("Disconnected");
  const [statusKind, setStatusKind] = useState<"idle" | "connected" | "error">("idle");
  const socketRef = useRef<any>(null);
  const currentIPRef = useRef(serverIP);

  // Audio playback
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Recording / VAD refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef<boolean>(false); // whether mediaRecorder is currently recording
  const fullBlobRef = useRef<Blob | null>(null);  // final blob produced on stop
  const silenceTimerRef = useRef<number | null>(null);

  // analyser
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadDataArrayRef = useRef<Uint8Array | null>(null);
  const vadPollingRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { currentIPRef.current = serverIP; }, [serverIP]);


  // telemetry simulation
  useEffect(() => {
    const id = setInterval(() => {
      setDeviceTemp((p) => Math.min(60, Math.max(35, p + (Math.random() - 0.5) * 2)));
      setSignalStrength((p) => Math.min(100, Math.max(60, p + (Math.random() - 0.5) * 5)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // -------------------------
  // Socket helpers (unchanged)
  // -------------------------
  const connectToServer = (ip: string) => {
    if (!ip) {
      toast.error("Please provide server IP");
      return;
    }
    try {
      localStorage.setItem("serverIP", ip);
      setServerIP(ip);
      currentIPRef.current = ip;

      const url = `http://${ip}:3000`;
      setStatusText(`Connecting to ${url}...`);
      setStatusKind("idle");

      socketRef.current?.disconnect?.();

      const socket = io(url, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketConnected(true);
        setStatusText("Connected — waiting for audio...");
        setStatusKind("connected");
        toast.success("Connected to LifeOS server");
      });

      socket.on("ai-response", (data: any) => {
        if (data.audioFilePath) {
          setStatusText("Receiving audio...");
          const audioHttpUrl = `http://${currentIPRef.current}:3000/${data.audioFilePath.replace(/\\/g, "/")}?t=${Date.now()}`;
          playIncomingAudio(audioHttpUrl);
          if (data.finalResponseText || data.textReply) {
            addMessage({ role: "assistant", content: data.finalResponseText || data.textReply, timestamp: Date.now() } as any);
          }
        } else {
          setStatusText("Response received (no audio path)");
          setStatusKind("error");
        }
      });

      socket.on("play-audio", (data: any) => {
        if (data.audioUrl) playIncomingAudio(data.audioUrl + `?t=${Date.now()}`);
        if (data.text) addMessage({ role: "assistant", content: data.text, timestamp: Date.now() } as any);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
        setStatusText("Disconnected");
        setStatusKind("idle");
        toast("Disconnected from server");
      });

      socket.on("connect_error", (err: any) => {
        setSocketConnected(false);
        setStatusText("Connection error — check IP/server");
        setStatusKind("error");
        toast.error("Socket connection error");
        console.error("socket connect_error:", err);
      });
    } catch (err) {
      console.error("connectToServer error:", err);
      setStatusText("Connection failed");
      setStatusKind("error");
      toast.error("Failed to connect");
    }
  };

  const disconnectFromServer = () => {
    socketRef.current?.disconnect?.();
    socketRef.current = null;
    setSocketConnected(false);
    setStatusText("Disconnected");
    setStatusKind("idle");
  };

  const playIncomingAudio = (url: string) => {
    const player = audioPlayerRef.current;
    if (!player) return;
    player.src = url;
    player.load();
    player.play().then(() => setStatusText("Playing audio response.")).catch((err) => {
      console.warn("Autoplay blocked:", err);
      setStatusText("Audio received. Press play on the player.");
    });
  };

  const getApiBase = () => `http://${serverIP || "localhost"}:3000`;


  // Send final blob to backend (ensures correct filename / mimetype)
  const sendBlobToBackend = async (blob: Blob) => {
    try {
      if (!blob || blob.size === 0) {
        toast.error("Recording was empty");
        return;
      }

      setStatusText("Processing...");
      const form = new FormData();

      // Detect the correct extension based on the blob's type
      const mimeType = blob.type || "audio/webm";
      const extension = mimeType.split("/")[1]?.split(";")[0] || "webm";
      const filename = `utterance.${extension}`;

      console.log(`Sending audio: ${filename} (${mimeType}) - ${blob.size} bytes`);

      // Append with the dynamic filename
      form.append("audio", blob, filename);

      const res = await fetch(`${getApiBase()}/api/audio/voice-command`, {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        const txt = await res.text().catch(()=>null);
        throw new Error(`Server returned ${res.status} ${txt ? '- ' + txt : ''}`);
      }

      const data = await res.json();
      console.log("Voice response:", data);

      // --- Message Handling ---
      if (data.transcription) {
        addMessage({ role: "user", content: data.transcription, timestamp: Date.now() } as any);
      }

      const replyText = data.finalResponseText || data.textReply;
      if (replyText) {
        addMessage({ role: "assistant", content: replyText, timestamp: Date.now() } as any);
      }

      if (data.audioUrl) {
        playIncomingAudio(data.audioUrl + `?t=${Date.now()}`);
      } else if (data.audioFilePath) {
        const url = `${getApiBase()}/${data.audioFilePath.replace(/\\/g, "/")}?t=${Date.now()}`;
        playIncomingAudio(url);
      }

      setStatusText("Ready");
    } catch (err) {
      console.error("sendBlobToBackend error:", err);
      toast.error("Failed to process voice command");
      setStatusText("Error");
    }
  };

  // -------------------------
  // VAD (voice activity detection) + record-on-voice logic
  // -------------------------
  useEffect(() => {
    // Start mic and setup analyser once on mount
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        // Setup AudioContext + analyser for VAD
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextCtor) {
          const ac = new AudioContextCtor();
          audioContextRef.current = ac;
          const source = ac.createMediaStreamSource(stream);
          const analyser = ac.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          analyserRef.current = analyser;
          // using Uint8Array for byte time domain (0..255)
          vadDataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

          // start polling VAD
          startVadPolling();
        } else {
          console.warn("AudioContext not supported; VAD won't run");
        }

        // Create MediaRecorder but DO NOT start here.
        // We'll start when voice is detected, stop on silence.
        const options: MediaRecorderOptions = {};
        try {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) options.mimeType = "audio/webm;codecs=opus";
          else if (MediaRecorder.isTypeSupported("audio/webm")) options.mimeType = "audio/webm";
        } catch {}
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        // ondataavailable will be called once after stop() (we don't start with timeslice)
        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            fullBlobRef.current = e.data;
            console.log("MediaRecorder produced final blob:", e.data.size);
          }
        };

        recorder.onerror = (ev) => {
          console.warn("MediaRecorder error", ev);
        };

        recorder.onstart = () => {
          setStatusText("Recording...");
        };

        recorder.onstop = async () => {
          setStatusText("Processing...");
          // final blob should be available in fullBlobRef
          const blob = fullBlobRef.current;
          fullBlobRef.current = null;
          if (blob) {
            await sendBlobToBackend(blob);
          } else {
            console.warn("onstop: no blob available");
            setStatusText("Ready");
          }
        };

        setStatusText("Microphone active (listening)");
      } catch (err) {
        console.error("Error opening microphone:", err);
        toast.error("Microphone access denied or unavailable");
        setStatusText("Mic error");
      }
    };

    start();

    return () => {
      mounted = false;
      // cleanup
      try {
        // stop recorder if running
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      mediaStreamRef.current = null;
      cleanupVadPolling();
      try {
        audioContextRef.current?.close();
      } catch {}
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // VAD polling function
  const startVadPolling = () => {
    if (!analyserRef.current || !vadDataArrayRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = vadDataArrayRef.current;

    const poll = () => {
      try {
        // Use byte time-domain data for simple RMS-like energy
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] - 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Debug (uncomment if tuning): console.debug("VAD rms", rms);

        if (rms > VAD_THRESHOLD) {
          // voice detected
          if (!isRecordingRef.current) {
            // start recording
            try {
              // Clear any pending silence timer
              if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

              // Reset final blob
              fullBlobRef.current = null;

              // Start recorder (will produce final blob on stop)
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
                // Start without timeslice so ondataavailable happens once on stop()
                mediaRecorderRef.current.start();
                isRecordingRef.current = true;
                setStatusText("Recording...");
                console.log("VAD -> started recorder");
              }
            } catch (err) {
              console.error("Failed to start MediaRecorder:", err);
            }
          } else {
            // already recording; reset silence timer if any
            if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
          }
        } else {
          // low energy (silence)
          if (isRecordingRef.current && !silenceTimerRef.current) {
            // start silence countdown
            silenceTimerRef.current = window.setTimeout(() => {
              // silence timeout reached -> finalize utterance by stopping recorder
              try {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop(); // will trigger onstop -> send
                  console.log("VAD -> silence timeout -> stopped recorder");
                } else {
                  // nothing running
                  setStatusText("Ready");
                }
              } catch (err) {
                console.error("Error stopping recorder on silence:", err);
                setStatusText("Ready");
              } finally {
                isRecordingRef.current = false;
                silenceTimerRef.current = null;
              }
            }, SILENCE_MS);
          }
        }
      } catch (err) {
        console.warn("VAD poll error", err);
      }
      // schedule next poll
      vadPollingRef.current = window.setTimeout(poll, 120); // ~8Hz
    };

    // start first poll
    poll();
  };

  const cleanupVadPolling = () => {
    if (vadPollingRef.current) { clearTimeout(vadPollingRef.current); vadPollingRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    isRecordingRef.current = false;
  };

  // Manual fallback: stop everything and force send current buffer
  const manualFlushAndSend = async () => {
    try {
      if (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        // stop will trigger onstop and send final blob
        mediaRecorderRef.current.stop();
        isRecordingRef.current = false;
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        setStatusText("Sending...");
      } else {
        setStatusText("No speech to send");
      }
    } catch (err) {
      console.error("manualFlushAndSend error", err);
    }
  };
  
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl h-[calc(100vh-8rem)]">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Left: Device + Connection */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Device Status</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Thermometer className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-lg font-semibold">{deviceTemp.toFixed(1)}°C</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Signal</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-gradient-to-r from-primary to-tech-glow-secondary h-2 rounded-full transition-all" style={{ width: `${signalStrength}%` }} />
                        </div>
                        <span className="text-xs font-medium">{signalStrength.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className={`font-medium ${socketConnected ? 'text-green-500' : 'text-muted-foreground'}`}>{socketConnected ? 'Connected' : 'Disconnected'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection / Audio Receiver Card */}
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Receiver / Connection</h3>

                <div className="space-y-3">
                  <label className="text-xs">PC Local IP</label>
                  <Input value={serverIP} onChange={(e) => setServerIP(e.target.value)} placeholder="e.g. 192.168.1.10" />

                  <div className="flex gap-2 mt-2">
                    {!socketConnected ? (
                      <Button onClick={() => connectToServer(serverIP)} className="flex-1">Connect</Button>
                    ) : (
                      <Button variant="destructive" onClick={disconnectFromServer} className="flex-1">Disconnect</Button>
                    )}
                    <Button onClick={() => { setStatusText('Checking...'); connectToServer(serverIP); }} variant="outline">Quick</Button>
                  </div>

                  <div className="mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusKind === 'connected' ? 'bg-green-500' : statusKind === 'error' ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <span>{statusText}</span>
                    </div>

                    <div className="mt-3">
                      <audio ref={audioPlayerRef} controls className="w-full rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Captures */}
            
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4 text-center lg:text-left">
              <h1 className="text-3xl font-bold gradient-text">LifeOS Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {recordingIndicatorText()}
              </p>
            </div>

            <Card className="glass-card border-0 flex-1 mb-4 overflow-hidden">
              <ScrollArea className="h-full p-6">
                <div className="space-y-4">
                  {state.messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Listening continuously. Speak naturally — recording sends after silence.</p>
                    </div>
                  )}

                  {state.messages.map((message: any) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-primary to-tech-glow-secondary text-white'}`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                        {message.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden max-w-xs">
                            <img src={message.imageUrl} alt="Shared" className="w-full" />
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-2">{new Date(message.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}

                  {currentTranscript && (
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="bg-primary/50 text-primary-foreground rounded-2xl px-4 py-2 max-w-[80%]">
                        <p className="text-sm italic">{currentTranscript}</p>
                      </div>
                    </div>
                  )}

                  {isSpeaking && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tech-glow-secondary text-white flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </Card>

            {/* Controls: manual flush + optional mic toggle */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="mt-4 flex items-center gap-3 p-3 bg-muted/40 backdrop-blur-lg rounded-2xl border border-border">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Always listening. I'll send your speech after {SILENCE_MS / 1000}s of silence.</p>
                  </div>

                  <Button onClick={() => manualFlushAndSend()}>Send Now</Button>
                </div>
              </div>

              <div className="w-36 flex items-center justify-end">
                <Button onClick={() => {
                  // quick restart of mic (useful for debugging)
                  try {
                    cleanupVadPolling();
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                      mediaRecorderRef.current.stop();
                    }
                  } catch {}
                  // restart: stop tracks and re-init effect by reloading the page or instructing user to refresh
                  toast("To restart mic, refresh the page (recommended)");
                }}>Restart Mic</Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  // small helper for main header text
  function recordingIndicatorText() {
    if (isRecordingRef.current) return "Recording — waiting for silence to send...";
    if (statusText) return statusText;
    return "Listening...";
  }
};

export default Assistant;
