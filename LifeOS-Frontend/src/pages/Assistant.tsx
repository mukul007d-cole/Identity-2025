import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Send,
  User,
  Bot,
  Thermometer,
  Wifi,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
const Assistant: React.FC = () => {
  const { state, addMessage } = useApp();

  // Chat / voice UI state
  const [textInput, setTextInput] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Device / connection UI
  const [deviceTemp, setDeviceTemp] = useState(42);
  const [signalStrength, setSignalStrength] = useState(85);

  // Connection / socket
  const [serverIP, setServerIP] = useState<string>(
    () => localStorage.getItem("serverIP") || ""
  );
  const [socketConnected, setSocketConnected] = useState(false);
  const [statusText, setStatusText] = useState("Disconnected");
  const [statusKind, setStatusKind] = useState<
    "idle" | "connected" | "error"
  >("idle");
  const socketRef = useRef<any>(null);
  const currentIPRef = useRef(serverIP);

  // Audio player ref
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Recording refs/state
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  // Speech recognition (optional live STT)
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  // scroll ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Simulate telemetry
  useEffect(() => {
    const id = setInterval(() => {
      setDeviceTemp((p) => Math.min(60, Math.max(35, p + (Math.random() - 0.5) * 2)));
      setSignalStrength((p) => Math.min(100, Math.max(60, p + (Math.random() - 0.5) * 5)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // -------------------------
  // Socket connection helpers
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

      // clean up old socket if any
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
        // expects data.audioFilePath (relative)
        if (data.audioFilePath) {
          setStatusText("Receiving audio...");
          const audioHttpUrl = `http://${currentIPRef.current}:3000/${data.audioFilePath.replace(
            /\\/g,
            "/"
          )}?t=${Date.now()}`;
          playIncomingAudio(audioHttpUrl);

          if (data.finalResponseText || data.textReply) {
            addMessage({
              role: "assistant",
              content: data.finalResponseText || data.textReply,
              timestamp: Date.now(),
            } as any);
          }
        } else {
          setStatusText("Response received (no audio path)");
          setStatusKind("error");
        }
      });

      socket.on("play-audio", (data: any) => {
        // older / alternative event
        if (data.audioUrl) {
          playIncomingAudio(data.audioUrl + `?t=${Date.now()}`);
        }
        if (data.text) {
          addMessage({
            role: "assistant",
            content: data.text,
            timestamp: Date.now(),
          } as any);
        }
      });

      socket.on("disconnect", (reason: any) => {
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

  // -------------------------
  // Play incoming audio
  // -------------------------
  const playIncomingAudio = (url: string) => {
    const player = audioPlayerRef.current;
    if (!player) return;
    player.src = url;
    player.load();
    player
      .play()
      .then(() => setStatusText("Playing audio response."))
      .catch((err) => {
        console.warn("Autoplay blocked:", err);
        setStatusText("Audio received. Press play on the player.");
      });
  };

  // -------------------------
  // Recording helpers
  // -------------------------
  const getApiBase = () => `http://${serverIP || "localhost"}:3000`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // stop tracks so mic light goes off
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatusText("Recording...");
    } catch (err) {
      console.error("startRecording failed", err);
      toast.error("Cannot access microphone");
      setStatusText("Mic access error");
    }
  };

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // stop and wait a tick for ondataavailable to fire
    recorder.stop();
    setRecording(false);
    setStatusText("Processing...");

    // small delay to ensure chunks received
    await new Promise((r) => setTimeout(r, 150));

    const chunks = audioChunksRef.current;
    if (!chunks || chunks.length === 0) {
      setStatusText("No audio captured");
      toast.error("No audio captured");
      return;
    }

    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    // send to backend
    await sendAudioToBackend(audioBlob);

    // cleanup
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", audioBlob, "voice.webm");

      const res = await fetch(`${getApiBase()}/api/audio/voice-command`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("Voice response:", data);

      if (data.transcription) {
        addMessage({
          role: "user",
          content: data.transcription,
          timestamp: Date.now(),
        } as any);
      }

      if (data.textReply || data.finalResponseText) {
        addMessage({
          role: "assistant",
          content: data.textReply || data.finalResponseText,
          timestamp: Date.now(),
        } as any);
      }

      // server may return playAudioUrl (full url) or relative audioFilePath
      if (data.playAudioUrl) {
        playIncomingAudio(data.playAudioUrl + `?t=${Date.now()}`);
      } else if (data.audioFilePath) {
        const url = `${getApiBase()}/${data.audioFilePath.replace(/\\/g, "/")}?t=${Date.now()}`;
        playIncomingAudio(url);
      }

      setStatusText("Ready");
    } catch (err) {
      console.error("sendAudioToBackend error:", err);
      toast.error("Failed to send audio");
      setStatusText("Error sending audio");
    }
  };

  // -------------------------
  // Text submit / TTS
  // -------------------------
  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = textInput.trim();
    if (!msg) return;

    // Add user message
    addMessage({
      role: "user",
      content: msg,
      timestamp: Date.now(),
    } as any);

    setTextInput("");

    // Placeholder: send message to backend via socket or HTTP if desired
    // Example: socketRef.current?.emit('user-utterance', { text: msg });
    // For demo we'll simulate assistant reply:
    setTimeout(() => {
      const reply = `Echo: ${msg}`;
      addMessage({
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      } as any);
      // optionally speak
      setIsSpeaking(true);
      const ut = new SpeechSynthesisUtterance(reply);
      ut.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(ut);
    }, 700);
  };

  // -------------------------
  // SpeechRecognition (optional)
  // -------------------------
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (ev: any) => {
      const idx = ev.resultIndex;
      const transcript = ev.results[idx][0].transcript;
      setCurrentTranscript(transcript);
      if (ev.results[idx].isFinal) {
        // send final transcript as message
        addMessage({
          role: "user",
          content: transcript,
          timestamp: Date.now(),
        } as any);
        setCurrentTranscript("");
      }
    };

    rec.onerror = (err: any) => {
      console.error("SpeechRecognition error:", err);
      toast.error("Speech recognition error");
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("SpeechRecognition not supported");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening started");
      } catch (err) {
        console.error("start recognition failed", err);
        toast.error("Failed to start listener");
      }
    }
  };

  // -------------------------
  // JSX
  // -------------------------
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl h-[calc(100vh-8rem)]">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Left: Device + Connection */}
          <div className="lg:w-72 flex-shrink-0 space-y-4">
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Device Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Thermometer className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="text-lg font-semibold">
                        {deviceTemp.toFixed(1)}°C
                      </p>
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
                          <div
                            className="bg-gradient-to-r from-primary to-tech-glow-secondary h-2 rounded-full transition-all"
                            style={{ width: `${signalStrength}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {signalStrength.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            socketConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            socketConnected ? "text-green-500" : "text-muted-foreground"
                          }`}
                        >
                          {socketConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection / Audio Receiver Card */}
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Receiver / Connection
                </h3>

                <div className="space-y-3">
                  <label className="text-xs">PC Local IP</label>
                  <Input
                    value={serverIP}
                    onChange={(e) => setServerIP(e.target.value)}
                    placeholder="e.g. 192.168.1.10"
                  />

                  <div className="flex gap-2 mt-2">
                    {!socketConnected ? (
                      <Button onClick={() => connectToServer(serverIP)} className="flex-1">
                        Connect
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={disconnectFromServer} className="flex-1">
                        Disconnect
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setStatusText("Checking...");
                        connectToServer(serverIP);
                      }}
                      variant="outline"
                    >
                      Quick
                    </Button>
                  </div>

                  <div className="mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusKind === "connected"
                            ? "bg-green-500"
                            : statusKind === "error"
                            ? "bg-red-500"
                            : "bg-gray-300"
                        }`}
                      />
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
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Recent Captures
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {state.messages.filter((m: any) => m.imageUrl).slice(0, 4).map((m: any) => (
                    <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={m.imageUrl} alt="Capture" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {state.messages.filter((m: any) => m.imageUrl).length === 0 && (
                    <div className="col-span-2 aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4 text-center lg:text-left">
              <h1 className="text-3xl font-bold gradient-text">LifeOS Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isListening ? "Listening..." : "Voice and text assistant"}
              </p>
            </div>

            <Card className="glass-card border-0 flex-1 mb-4 overflow-hidden">
              <ScrollArea className="h-full p-6">
                <div className="space-y-4">
                  {state.messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                      <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation by typing or speaking</p>
                    </div>
                  )}

                  {state.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gradient-to-br from-primary to-tech-glow-secondary text-white"
                        }`}
                      >
                        {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className={`flex-1 ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                        {message.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden max-w-xs">
                            <img src={message.imageUrl} alt="Shared" className="w-full" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-2">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
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

            {/* Chat input with integrated voice recording */}
            <div className="flex gap-2">
              <form onSubmit={(e) => { e.preventDefault(); handleTextSubmit(); }} className="flex-1 flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e: any) => setTextInput(e.target.value)}
                  placeholder="Type or speak..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              {/* Mic button - start/stop recording */}
              <Button
                onClick={() => (recording ? stopRecordingAndSend() : startRecording())}
                size="icon"
                variant={recording ? "default" : "secondary"}
                className={recording ? "tech-glow animate-pulse-glow" : ""}
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Optional: speech recognition toggle */}
              <Button onClick={toggleListening} size="icon" variant={isListening ? "default" : "secondary"}>
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
