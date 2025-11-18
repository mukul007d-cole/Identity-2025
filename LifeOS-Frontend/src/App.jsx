/*
NOTE: This demo bundles multiple components in one file for easy preview. For production split into files.
*/

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  BatteryCharging,
  Camera,
  Settings,
  Moon,
  Sun,
  Zap,
  Menu,
  X,
  Search,
  Trash,
  Cloud,
  Download,
  Play,
  Pause,
  Check,
  User,
  Image,
  Eye,
} from "lucide-react";

/* -----------------------------
   Context: Global UI + Streams
   ----------------------------- */
const AppContext = createContext(null);

function useApp() {
  return useContext(AppContext);
}

function AppProvider({ children }) {
  
  const [theme, setTheme] = useState("cyber");
  const [connected, setConnected] = useState(false);
  const [battery, setBattery] = useState(87);
  const [health, setHealth] = useState("Nominal");
  const [logs, setLogs] = useState([]); // terminal logs
  const [recognized, setRecognized] = useState([]); // dynamic cards
  const [saved, setSaved] = useState([]); // neural vault
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [hudOpacity, setHudOpacity] = useState(0.8);
  const [aiPersonality, setAiPersonality] = useState({ curiosity: 0.6, empathy: 0.4, bluntness: 0.2 });

  // simulate incoming data stream
  useEffect(() => {
    if (!connected) return;
    const logInterval = setInterval(() => {
      setLogs((l) => {
        const now = new Date().toLocaleTimeString();
        const messages = [
          `[${now}] ANALYZE: scanning scene for faces & objects...`,
          `[${now}] SENSES: captured frame #${Math.floor(Math.random() * 99999)}`,
          `[${now}] INFER: probable object: drone (confidence ${Math.floor(70 + Math.random() * 29)}%)`,
          `[${now}] MEMORY: storing snapshot to Neural Vault`,
          `[${now}] DECIDE: recommending action 'Record & Tag'`,
        ];
        const text = messages[Math.floor(Math.random() * messages.length)];
        const next = [...l, text].slice(-200);
        return next;
      });
    }, 2100);

    const faceInterval = setInterval(() => {
      setRecognized((r) => {
        if (Math.random() < 0.5) return r; // sometimes nothing
        const names = ["Alex", "Rina", "Dr. Kohli", "Unknown", "S. Patel"];
        const objNames = ["Bottle", "Drone", "Car", "Wallet", "Laptop"];
        const isFace = Math.random() < 0.6;
        const item = isFace
          ? {
              id: Date.now() + Math.random(),
              type: "face",
              name: names[Math.floor(Math.random() * names.length)],
              confidence: Math.floor(65 + Math.random() * 34),
              timestamp: new Date().toISOString(),
            }
          : {
              id: Date.now() + Math.random(),
              type: "object",
              name: objNames[Math.floor(Math.random() * objNames.length)],
              confidence: Math.floor(60 + Math.random() * 39),
              timestamp: new Date().toISOString(),
            };
        const next = [item, ...r].slice(0, 6);
        return next;
      });
    }, 3800);

    const batteryInterval = setInterval(() => {
      setBattery((b) => Math.max(5, b - Math.floor(Math.random() * 2)));
    }, 12000);

    return () => {
      clearInterval(logInterval);
      clearInterval(faceInterval);
      clearInterval(batteryInterval);
    };
  }, [connected]);

  // Expose a few helpers
  const addLog = (msg) => setLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-500));
  const saveToVault = (item) => setSaved((s) => [{ ...item, id: Date.now() }, ...s]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      connected,
      setConnected,
      battery,
      health,
      logs,
      recognized,
      saved,
      micEnabled,
      camEnabled,
      hudOpacity,
      setHudOpacity,
      aiPersonality,
      setAiPersonality,
      addLog,
      saveToVault,
      setMicEnabled,
      setCamEnabled,
      setBattery,
    }),
    [theme, connected, battery, health, logs, recognized, saved, micEnabled, camEnabled, hudOpacity, aiPersonality]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* -----------------------------
   Helper: Theme classes
   ----------------------------- */
const themeMap = {
  cyber: {
    name: "Cyberpunk Neon",
    bg: "bg-gradient-to-br from-[#0f172a] via-[#071233] to-[#0b1020]",
    accent: "text-[#7c3aed]",
    glass: "bg-white/6 border-white/6",
  },
  space: {
    name: "Deep Space",
    bg: "bg-gradient-to-br from-[#06070a] via-[#081226] to-[#08142a]",
    accent: "text-[#38bdf8]",
    glass: "bg-white/4 border-white/4",
  },
  clean: {
    name: "Clean Corporate",
    bg: "bg-gradient-to-br from-[#0b1221] via-[#0b1533] to-[#061025]",
    accent: "text-[#60a5fa]",
    glass: "bg-white/5 border-white/5",
  },
};

/* -----------------------------
   Component: Handshake / Entry
   ----------------------------- */
function Entry() {
  const { setConnected, addLog, theme } = useApp();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let t0;
    if (stage === 1) {
      addLog("Pairing initiated...");
      t0 = setTimeout(() => setStage(2), 1500);
    }
    if (stage === 2) {
      addLog("Authenticating device certificate...");
      t0 = setTimeout(() => setStage(3), 1700);
    }
    if (stage === 3) {
      addLog("Establishing secure channel...");
      t0 = setTimeout(() => {
        addLog("Pairing successful. Welcome, Operator.");
        setConnected(true);
      }, 1800);
    }
    return () => clearTimeout(t0);
  }, [stage]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${themeMap[theme].bg}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-3xl w-full ${themeMap[theme].glass} backdrop-blur-lg border rounded-2xl p-8 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">NovaLink — Smart Glass Pairing</h1>
            <p className="text-sm opacity-70 mt-1">Simulated secure handshake for demo devices</p>
          </div>
          <div className="flex items-center gap-3">
            <Zap />
            <div className="text-xs text-slate-300">v0.9-demo</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 p-4 rounded-xl border border-dashed border-white/6">
            <div className="mb-4">Connection Status</div>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-xl flex items-center justify-center flex-col bg-white/3">
                <div className="text-xs opacity-70">Device</div>
                <div className="mt-2 text-lg font-mono">SG-AX7</div>
              </div>
              <div className="flex-1">
                <div className="mb-2 text-sm">Pairing Sequence</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStage(1)}
                    className="px-3 py-2 rounded-md bg-gradient-to-r from-[#7928CA] to-[#FF0080] text-white shadow"
                  >
                    Start Pairing
                  </button>
                  <button
                    onClick={() => {
                      setStage(0);
                    }}
                    className="px-3 py-2 rounded-md border"
                  >
                    Reset
                  </button>
                </div>
                <div className="mt-4 text-xs opacity-70">
                  {stage === 0 && "Idle — waiting to start pairing"}
                  {stage === 1 && "Scanning nearby devices..."}
                  {stage === 2 && "Validating certificate"}
                  {stage === 3 && "Finalizing secure link"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl ${themeMap[theme].glass} border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">System Snapshot</div>
              <div className="text-xs opacity-60">Healthy</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-xs">Battery</div>
              <div className="h-2 rounded bg-white/6 overflow-hidden">
                <div className="h-full rounded bg-gradient-to-r from-green-400 to-blue-500" style={{ width: `78%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Wifi /> <div className="text-xs opacity-70">Wi‑Fi: Connected</div>
            </div>
            <div className="flex items-center gap-2">
              <Cloud /> <div className="text-xs opacity-70">Cloud Sync: Idle</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm opacity-70">
          This entry screen simulates a high-tech handshake with clear steps and informative logs. Press <span className="font-semibold">Start Pairing</span> to see the demo proceed.
        </div>
      </motion.div>
    </div>
  );
}

/* -----------------------------
   Component: Command Dashboard
   ----------------------------- */
function Dashboard() {
  const { battery, recognized, saved, logs, addLog, theme } = useApp();

  return (
    <div className={`min-h-screen p-6 ${themeMap[theme].bg}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Command Dashboard</h2>
            <p className="text-sm opacity-70">Overview · Usage · System Health</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border ${themeMap[theme].glass}">
              <BatteryCharging />
              <div className="text-sm">{battery}%</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border ${themeMap[theme].glass}">
              <Wifi />
              <div className="text-sm">Wi‑Fi</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="p-4 rounded-2xl ${themeMap[theme].glass} border">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">Today's Summary</div>
                <div className="text-xs opacity-60">Updated — {new Date().toLocaleTimeString()}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Images" value={Math.floor(5 + Math.random() * 40)} icon={<Image />} />
                <StatCard title="Notes" value={Math.floor(2 + Math.random() * 20)} icon={<User />} />
                <StatCard title="Recognitions" value={recognized.length} icon={<Eye />} />
                <StatCard title="Saved" value={saved.length} icon={<Cloud />} />
              </div>

              <div className="mt-6">
                <div className="text-sm mb-2">Quick Actions</div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7928CA] to-[#FF0080] text-white">Start Recording</button>
                  <button className="px-4 py-2 rounded-lg border">Snapshot Now</button>
                  <button className="px-4 py-2 rounded-lg border" onClick={() => addLog("Manual snapshot triggered")}>
                    Force Log
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl ${themeMap[theme].glass} border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">System Health</div>
                <div className="text-xs opacity-60">Realtime</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <HealthItem title="CPU" value={`22%`} />
                <HealthItem title="GPU" value={`11%`} />
                <HealthItem title="Thermal" value={`45°C`} />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl ${themeMap[theme].glass} border">
              <div className="text-sm font-medium mb-3">Recent Logs</div>
              <div className="h-40 overflow-y-auto bg-black/10 rounded p-3 font-mono text-xs">
                {logs.slice(-60).map((l, idx) => (
                  <div key={idx} className="mb-1 text-[13px] opacity-80">
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className="p-4 rounded-2xl ${themeMap[theme].glass} border mb-4">
              <div className="text-sm font-medium mb-2">Recognitions</div>
              <div className="flex flex-col gap-2">
                {recognized.map((r) => (
                  <motion.div key={r.id} layout className="p-2 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs opacity-60">{r.type} • {r.confidence}%</div>
                    </div>
                    <div className="text-xs opacity-60">{new Date(r.timestamp).toLocaleTimeString()}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl ${themeMap[theme].glass} border">
              <div className="text-sm font-medium mb-2">Neural Vault Snapshot</div>
              <div className="h-40 overflow-y-auto flex flex-col gap-2">
                {saved.length === 0 && <div className="text-xs opacity-60">No items saved yet.</div>}
                {saved.slice(0, 8).map((s) => (
                  <div key={s.id} className="p-2 rounded flex items-center gap-3 border">
                    <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center">Img</div>
                    <div className="text-xs">
                      <div className="font-medium">{s.title || s.name || 'Item'}</div>
                      <div className="opacity-60 text-[12px]">{new Date(s?.timestamp || s.id).toLocaleString()}</div>
                    </div>
                    <div className="ml-auto text-sm opacity-60">{s.type || 'misc'}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="p-3 rounded-xl border flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-white/6 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs opacity-60">{title}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function HealthItem({ title, value }) {
  return (
    <div className="p-3 rounded-lg border flex items-center justify-between">
      <div className="text-sm">{title}</div>
      <div className="text-sm font-mono">{value}</div>
    </div>
  );
}

/* -----------------------------
   Component: Live HUD
   ----------------------------- */
function LiveHUD() {
  const { logs, recognized, addLog, micEnabled, camEnabled, saveToVault, setMicEnabled, setCamEnabled, hudOpacity, setHudOpacity, theme } = useApp();
  const [inputText, setInputText] = useState("");
  const [listening, setListening] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);

  // Setup SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = "en-IN";

    recog.onresult = (e) => {
      const last = e.results[e.resultIndex];
      const text = Array.from(last).map((r) => r[0].transcript).join("");
      setInputText(text);
      if (last.isFinal) {
        addLog(`VOICE IN: ${text}`);
        // simulate AI response
        speakOut(`Command received: ${text}`);
      }
    };

    recog.onend = () => setListening(false);
    recognitionRef.current = recog;
  }, []);

  function toggleListen() {
    if (!recognitionRef.current) return alert("SpeechRecognition not supported in this browser (demo mode)");
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  function speakOut(text) {
    if (!synthRef.current) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "en-US";
    ut.rate = 1;
    synthRef.current.cancel();
    synthRef.current.speak(ut);
    addLog(`VOICE OUT: ${text}`);
  }

  function snapshot() {
    const item = { title: `Snapshot ${new Date().toLocaleTimeString()}`, type: "image", timestamp: new Date().toISOString() };
    saveToVault(item);
    addLog("Snapshot saved to Neural Vault");
  }

  return (
    <div className={`min-h-screen p-6 ${themeMap[theme].bg}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <main className="lg:col-span-3 p-4 rounded-2xl ${themeMap[theme].glass} border" style={{ opacity: hudOpacity }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium">Live HUD</div>
              <div className="text-xs opacity-60">Real-time stream & AI terminal</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs opacity-60">Mic: {micEnabled ? "On" : "Off"}</div>
              <div className="text-xs opacity-60">Cam: {camEnabled ? "On" : "Off"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="bg-black/10 p-3 rounded-lg h-64 overflow-y-auto font-mono text-sm">
                {logs.slice(-120).map((l, idx) => (
                  <div key={idx} className="mb-1">{l}</div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a command or use voice"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/3"
                />
                <button onClick={() => { addLog(`TEXT IN: ${inputText}`); speakOut(`Acknowledged: ${inputText}`); setInputText(""); }} className="px-3 py-2 rounded-lg border">Send</button>
                <button onClick={toggleListen} className={`px-3 py-2 rounded-lg ${listening ? "bg-red-600 text-white" : "border"}`}>
                  {listening ? "Stop" : "Voice"}
                </button>
                <button onClick={snapshot} className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#16a34a] to-[#06b6d4] text-white">Snapshot</button>
              </div>
            </div>

            <aside>
              <div className="p-3 rounded-lg border mb-3">
                <div className="text-xs opacity-70 mb-2">Recognized</div>
                <div className="flex flex-col gap-2">
                  {recognized.map((r) => (
                    <div key={r.id} className="p-2 rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm">{r.name}</div>
                        <div className="text-xs opacity-60">{r.confidence}%</div>
                      </div>
                      <div className="text-xs opacity-60">{r.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <div className="text-xs opacity-70 mb-2">Quick Toggles</div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMicEnabled((v) => !v)} className="px-2 py-2 rounded border">Toggle Mic</button>
                  <button onClick={() => setCamEnabled((v) => !v)} className="px-2 py-2 rounded border">Toggle Cam</button>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <div className="p-4 rounded-2xl ${themeMap[theme].glass} border">
          <div className="text-sm font-medium mb-2">HUD Controls</div>
          <div className="text-xs opacity-70 mb-2">Opacity</div>
          <input type="range" min={0.2} max={1} step={0.05} value={hudOpacity} onChange={(e) => setHudOpacity(parseFloat(e.target.value))} />

          <div className="mt-4 text-sm font-medium">Voice Output</div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => speakOut("Hello operator. Systems nominal.")} className="px-3 py-2 rounded-lg border">Play Sample</button>
            <button onClick={() => { window.speechSynthesis.cancel(); }} className="px-3 py-2 rounded-lg border">Stop</button>
          </div>

          <div className="mt-4 text-sm font-medium">Save/Export</div>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-2 rounded-lg border">Export Logs</button>
            <button className="px-3 py-2 rounded-lg border">Export Vault</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Component: Neural Vault
   ----------------------------- */
function NeuralVault() {
  const { saved, theme } = useApp();
  return (
    <div className={`min-h-screen p-6 ${themeMap[theme].bg}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Neural Vault</h2>
            <p className="text-sm opacity-70">Saved imagery, notes and recognized identities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {saved.length === 0 && <div className="text-xs opacity-60">Vault is empty. Use Live HUD to save snapshots.</div>}
          {saved.map((s) => (
            <motion.div key={s.id} layout className="p-3 rounded-xl border ${themeMap[theme].glass}">
              <div className="w-full h-40 bg-white/4 rounded-md flex items-center justify-center">Preview</div>
              <div className="mt-2">
                <div className="font-medium">{s.title || s.name || 'Saved Item'}</div>
                <div className="text-xs opacity-60">{new Date(s.timestamp || s.id).toLocaleString()}</div>
                <div className="mt-2 flex gap-2">
                  <button className="px-2 py-1 rounded border text-xs">View</button>
                  <button className="px-2 py-1 rounded border text-xs">Download</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Component: Cortex (Settings)
   ----------------------------- */
function Cortex() {
  const { micEnabled, camEnabled, setMicEnabled, setCamEnabled, aiPersonality, setAiPersonality, theme, setTheme } = useApp();

  return (
    <div className={`min-h-screen p-6 ${themeMap[theme].bg}`}>
      <div className="max-w-4xl mx-auto p-4 rounded-2xl ${themeMap[theme].glass} border">
        <h2 className="text-xl font-semibold mb-2">Cortex — Settings & Permissions</h2>
        <p className="text-sm opacity-70 mb-4">Fine-grained controls for privacy, AI behavior, and HUD appearance</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded border">
            <div className="text-sm font-medium mb-2">Privacy</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between">
                <div>
                  <div>Camera</div>
                  <div className="text-xs opacity-60">Allow device camera access</div>
                </div>
                <input type="checkbox" checked={camEnabled} onChange={(e) => setCamEnabled(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <div>Microphone</div>
                  <div className="text-xs opacity-60">Allow microphone access</div>
                </div>
                <input type="checkbox" checked={micEnabled} onChange={(e) => setMicEnabled(e.target.checked)} />
              </label>
            </div>
          </div>

          <div className="p-3 rounded border">
            <div className="text-sm font-medium mb-2">Appearance</div>
            <div className="flex flex-col gap-2">
              <label className="text-xs">Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="p-2 rounded bg-white/3">
                <option value="cyber">Cyberpunk Neon</option>
                <option value="space">Deep Space</option>
                <option value="clean">Clean Corporate</option>
              </select>

              <div className="mt-2">
                <div className="text-xs">HUD Opacity</div>
                {/* controlled elsewhere */}
              </div>
            </div>
          </div>

          <div className="p-3 rounded border md:col-span-2">
            <div className="text-sm font-medium mb-2">AI Personality</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Slider label="Curiosity" value={aiPersonality.curiosity} onChange={(v) => setAiPersonality((p) => ({ ...p, curiosity: v }))} />
              <Slider label="Empathy" value={aiPersonality.empathy} onChange={(v) => setAiPersonality((p) => ({ ...p, empathy: v }))} />
              <Slider label="Bluntness" value={aiPersonality.bluntness} onChange={(v) => setAiPersonality((p) => ({ ...p, bluntness: v }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      <div className="text-xs mt-1">{Math.round(value * 100)}%</div>
    </div>
  );
}

/* -----------------------------
   Shell: Top-level app router + nav
   ----------------------------- */
function Shell() {
  const { connected, setConnected, theme, setTheme } = useApp();
  const [route, setRoute] = useState(connected ? "dashboard" : "entry");

  useEffect(() => {
    setRoute(connected ? "dashboard" : "entry");
  }, [connected]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav route={route} setRoute={setRoute} />
      <AnimatePresence mode="wait">
        {route === "entry" && !connected && (
          <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Entry />
          </motion.div>
        )}

        {route === "dashboard" && connected && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard />
          </motion.div>
        )}

        {route === "live" && connected && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LiveHUD />
          </motion.div>
        )}

        {route === "vault" && connected && (
          <motion.div key="vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NeuralVault />
          </motion.div>
        )}

        {route === "cortex" && connected && (
          <motion.div key="cortex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Cortex />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopNav({ route, setRoute }) {
  const { connected, setConnected, theme, setTheme } = useApp();

  return (
    <header className={`px-4 py-3 flex items-center justify-between border-b ${themeMap[theme].glass}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md border flex items-center gap-2">
          <Menu />
          <div className="font-semibold">NovaLink</div>
        </div>
        <nav className="hidden md:flex gap-2">
          <NavButton active={route === "dashboard"} onClick={() => setRoute("dashboard")} label="Dashboard" />
          <NavButton active={route === "live"} onClick={() => setRoute("live")} label="Live HUD" />
          <NavButton active={route === "vault"} onClick={() => setRoute("vault")} label="Neural Vault" />
          <NavButton active={route === "cortex"} onClick={() => setRoute("cortex")} label="Cortex" />
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="p-2 rounded bg-white/3 hidden sm:block">
          <option value="cyber">Cyberpunk</option>
          <option value="space">Deep Space</option>
          <option value="clean">Clean</option>
        </select>

        <button
          onClick={() => setConnected((c) => !c)}
          className={`px-3 py-2 rounded ${connected ? "bg-red-600 text-white" : "border"}`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>
    </header>
  );
}

function NavButton({ label, onClick, active }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded ${active ? "bg-white/6" : "hover:bg-white/2"}`}>
      {label}
    </button>
  );
}

/* -----------------------------
   App: root
   ----------------------------- */
export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
