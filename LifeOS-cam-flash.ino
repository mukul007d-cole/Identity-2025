// ESP32-CAM + GPS Webserver with flash pulse on capture

#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <TinyGPSPlus.h>

// --- WiFi credentials ---
const char* WIFI_SSID = "IQOOZ6";
const char* WIFI_PASS = "12345678";

// --- Camera model: AI-Thinker pins ---
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_GPIO 4  // onboard flash/LED

WebServer server(80);

// --- GPS ---
TinyGPSPlus gps;
HardwareSerial SerialGPS(2);

const int GPS_RX_PIN = 13; // GPS TX -> ESP32
const int GPS_TX_PIN = 12; // GPS RX <- ESP32

// -------------------------------
// Print server URLs
// -------------------------------
void printServerURLs() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("======================================");
    Serial.println("ESP32-CAM Web Server Running At:");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
    Serial.println("PORT: 80");

    Serial.println("➤ Capture URL:   http://" + WiFi.localIP().toString() + "/capture");
    Serial.println("➤ Location URL:  http://" + WiFi.localIP().toString() + "/location");

    Serial.println("======================================");
  }
}


// -------------------------------
// Camera Init
// -------------------------------
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Use smaller frame size for faster loading
  if (psramFound()) {
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;  // 640x480
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }

  delay(2000);
  return true;
}

// -------------------------------
// HTTP /capture with flash pulse
// -------------------------------
void handleCapture() {
  // Flash for capture
  digitalWrite(FLASH_GPIO, HIGH);
  delay(50);  // short pulse
  camera_fb_t * fb = esp_camera_fb_get();
  digitalWrite(FLASH_GPIO, LOW);  // turn off immediately

  if (!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  WiFiClient client = server.client();
  if (!client) {
    esp_camera_fb_return(fb);
    return;
  }

  String header = "HTTP/1.1 200 OK\r\nContent-Type: image/jpeg\r\n";
  header += "Content-Length: " + String(fb->len) + "\r\nConnection: close\r\n\r\n";

  client.print(header);
  client.write(fb->buf, fb->len);

  esp_camera_fb_return(fb);

  unsigned long start = millis();
  while (client.connected() && millis() - start < 100) delay(1);
  client.stop();
}

// -------------------------------
// HTTP /location
// -------------------------------
void handleLocation() {
  if (!gps.location.isValid()) {
    server.send(500, "application/json", "{\"error\":\"no_fix\"}");
    return;
  }

  unsigned long age_ms = gps.location.age();
  const unsigned long STALE_MS = 10000;

  if (age_ms > STALE_MS) {
    String js = "{\"error\":\"stale_fix\",\"age_ms\":" + String(age_ms) + "}";
    server.send(500, "application/json", js);
    return;
  }

  String js = "{\"lat\":" + String(gps.location.lat(), 6) +
              ",\"lng\":" + String(gps.location.lng(), 6) +
              ",\"age_ms\":" + String(age_ms) + "}";
  server.send(200, "application/json", js);
}

// -------------------------------
// HTTP / (index)
// -------------------------------
void handleIndex() {
  String html = "<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head><body>";
  html += "<h2>ESP32-CAM</h2>";
  html += "<p><a href=\"/capture\">/capture (jpg)</a></p>";
  html += "<p><a href=\"/location\">/location (json)</a></p>";
  html += "<p>PSRAM: " + String(psramFound() ? "found" : "not found") + "</p></body></html>";
  server.send(200, "text/html", html);
}

// -------------------------------
// WiFi Auto-Reconnect
// -------------------------------
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL_MS = 5000;

void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastWiFiCheck < WIFI_CHECK_INTERVAL_MS) return;
  lastWiFiCheck = now;

  Serial.println("WiFi disconnected — attempting reconnect...");
  WiFi.disconnect(false, true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 3000) delay(50);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi reconnected!");
    printServerURLs();
  }
}

// -------------------------------
// Setup
// -------------------------------
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\nStarting ESP32-CAM + GPS webserver...");

  SerialGPS.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.printf("GPS UART started on RX=%d TX=%d\n", GPS_RX_PIN, GPS_TX_PIN);

  pinMode(FLASH_GPIO, OUTPUT);
  digitalWrite(FLASH_GPIO, LOW); // flash off initially

  if (!initCamera()) {
    Serial.println("Camera init failed. Halting.");
    while (true) delay(1000);
  }

  Serial.printf("Free heap: %d\n", ESP.getFreeHeap());
  Serial.printf("PSRAM found: %s\n", psramFound() ? "YES" : "NO");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);

  Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) delay(100);

  if (WiFi.status() == WL_CONNECTED) printServerURLs();

  server.on("/", HTTP_GET, handleIndex);
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/location", HTTP_GET, handleLocation);
  server.begin();

  Serial.println("HTTP server started on port 80");
}

// -------------------------------
// Loop
// -------------------------------
void loop() {
  server.handleClient();

  while (SerialGPS.available()) gps.encode(SerialGPS.read());

  ensureWiFiConnected();

  yield();
}
