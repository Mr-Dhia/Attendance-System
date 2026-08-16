#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Adafruit_Fingerprint.h>
#include <WiFi.h>
// HTTPClient.h supprime : ArduinoHttpClient gere les requetes HTTP
// pour Ethernet ET WiFi via un Client* generique
#include <Keypad.h>
#include <ArduinoJson.h>
#define MAX_SOCK_NUM 2  // Limite le W5500 a 2 sockets (au lieu de 8) -> ~6KB RAM economisee
#include <Ethernet.h>
#include <ArduinoHttpClient.h>
#include <WiFiManager.h>
#include <EthernetUdp.h>
#include <WiFiUdp.h>
#include <Preferences.h>

// Prototypes de fonctions
extern bool ecranErreurActif;
extern bool setupTermine;
void afficherErreurWiFiDetaillee(wl_status_t st);
void modeConfigCallback(WiFiManager *monWm);
void sauvegarderParamsCallback();
String genererPageLoginHTML(bool erreur = false);
String genererPagePortailHTML();
String genererPageParamHTML();
String genererPageInfoHTML();
void gererServeurWebEthernet();
void afficherEcranIPs();
void connecterWiFiSTA();
void afficherMessage(String msg, uint16_t couleur);
void afficherEcranErreurReseau(String titre, String raison);
void afficherAccueil();
bool decouvrirServeurUDP();
bool synchroniserHeure();
void verifierBasculeReseau();
void mettreAJourHorloge(bool forcer);
void verifierSuppressions();
int reconnaitreEmpreinte();
void afficherResultatReconnaissance(String jsonReponse);
void afficherResultatReconnaissance(bool succes, String nom, String type, String heure, String msg);
bool demarrerEthernet();
void ledInit();
void ledVert(bool state);
void ledRouge(bool state);
void ledJaune(bool state);
void ledConnexion(bool state);
void ledPointage(bool succes);
void ledOff();
void buzzerInit();
void bipTouche();
void bipSucces();
void bipErreur();
void bipDemarrage();
bool reseauDisponible();
void attendreConnexionServeur();
void chargerParametresNVS();
void attendreReseauEtServeur();
bool testerConnexionServeur();
void verifierServeurEnContinu();
void mettreAJourBarreProgression(int etape, int total);
void afficherEcranConnexionEthernet();
void afficherEcranConnexionWiFi(String ssid);
String envoyerMongo(int id, const char* action);
String envoyerMongo(int id, String action);
void envoyerEnroll(int fingerId, String employeeId);
void envoyerEnroll(uint8_t fingerId, String employeeId);
bool enregistrerEmpreinte(uint8_t id, String employeeId);
void supprimerEmpreinte();
void supprimerEmployeComplet();
bool demanderPin();
int selectionnerEmploye(const char* type);
int selectionnerEmploye(String filtre);
uint8_t trouverIDLibre();
bool creerEmployeRapide(String matricule, String &outId, String &outNom);
bool creerEmployeRapide(String matricule, String &outId, String &outNom, bool &dejaExistant);
int afficherMenuSuppression();
void reconfigurerWiFi();
bool obtenirHeureActuelle(struct tm &infoTemps);
void dessinerEntete(String titre, int type);
void dessinerEmpreinte(int cx, int cy, int size);
void dessinerBarreAide(String texte);
void dessinerChampSaisie(String label, String valeur, bool masquer, uint16_t couleurBord);
void dessinerCroix(int cx, int cy, int size);
void texteCentre(String texte, int y, uint16_t coul, uint8_t taille);
void texteCentre(String texte, int y, uint16_t coul, int taille);
void dessinerCorbeille(int cx, int cy, int size, uint16_t coul);
String httpPostJSON(const char* endpoint, String body);

// ======================================================================
// PALETTE DE DESIGN CORPORATE (doit rester ici, dans le fichier principal,
// pour etre visible par tous les autres .ino : capteur, display, reseau)
// ======================================================================
#define RGB565(r, g, b) ((uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)))

const uint16_t COULEUR_FOND         = ILI9341_BLACK;
const uint16_t COULEUR_ENTETE_HAUT  = RGB565(8, 28, 54);     // bleu marine profond
const uint16_t COULEUR_ENTETE_BAS   = RGB565(16, 44, 82);    // bleu marine legerement plus clair
const uint16_t COULEUR_LIGNE_ACCENT = RGB565(58, 110, 165);  // ligne d'accent sous l'entete
const uint16_t COULEUR_ACCENT       = RGB565(70, 130, 190);  // bleu acier (accent general)
const uint16_t COULEUR_CARTE        = RGB565(16, 22, 32);    // fond des badges/cartes
const uint16_t COULEUR_TEXTE        = RGB565(236, 240, 244); // blanc casse
const uint16_t COULEUR_TEXTE_2      = RGB565(148, 163, 184); // gris bleute (texte secondaire)
const uint16_t COULEUR_SUCCES       = RGB565(46, 158, 110);  // vert sobre
const uint16_t COULEUR_ERREUR       = RGB565(196, 68, 62);   // rouge brique
const uint16_t COULEUR_ATTENTE      = RGB565(196, 143, 60);  // ambre sobre


String empId[8];
String empName[8];
String empMatricule[8];
int empCount = 0;

String matriculeSaisi = "";

//---------Ethernet (DHCP Dynamique)-------------
#define ETH_CS 22
#define ETH_RST_PIN 15  // A CABLER sur la broche RST du module W5500
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0x01 };

bool ethernetActif = false;
bool configValideeWebPortal = false;
bool portailActif = false;
EthernetClient ethClient;
WiFiClient wifiClient;

char SERVER_HOST_NAME[64] = "";
char ETH_STATIC_IP[32] = "";
char ETH_STATIC_GATEWAY[32] = "";
char ETH_STATIC_SUBNET[32] = "";
char ETH_STATIC_DNS[32] = "";
char WEB_PORTAL_PASSWORD[32] = "admin2026";
char WIFI_CONFIG_SSID[64] = "";
char WIFI_CONFIG_PASS[64] = "";
const int SERVER_PORT = 5000;

// WiFiManager Global & Parametre IP Serveur
WiFiManager wm;
char htmlStatusBadge[256] = "<div style='text-align:center;color:#94a3b8;'>Chargement...</div>";
WiFiManagerParameter custom_status_badge(htmlStatusBadge);
WiFiManagerParameter custom_server_ip("server_ip", "IP du Serveur Backend", SERVER_HOST_NAME, 60);
WiFiManagerParameter custom_portal_pass("portal_pass", "Mot de Passe Portail Admin", WEB_PORTAL_PASSWORD, 30);
WiFiManagerParameter custom_eth_ip("eth_ip", "IP Statique ESP32 (vide = DHCP)", ETH_STATIC_IP, 30);
WiFiManagerParameter custom_eth_gw("eth_gw", "Passerelle (Gateway)", ETH_STATIC_GATEWAY, 30);
WiFiManagerParameter custom_eth_sn("eth_sn", "Masque (Subnet)", ETH_STATIC_SUBNET, 30);
WiFiManagerParameter custom_eth_dns("eth_dns", "Serveur DNS", ETH_STATIC_DNS, 30);

EthernetUDP ntpUDPEthernet;
WiFiUDP ntpUDPWifi;
const int NTP_PORT_LOCAL = 8888;
const char* NTP_SERVEUR = "pool.ntp.org";
long decalageEpoch = 0;  // difference entre millis() et l'heure reelle, en secondes
int decalageAjustementSec = 25; // Ajustement de +25s pour un alignement parfait de l'horloge
bool heureInitialisee = false;

unsigned long dernierEssaiSyncHeure = 0;
const unsigned long INTERVALLE_RESYNC_HEURE = 60000; // 1 min si echec, puis toutes les 6h si ok

//-----------------------------
bool ecranAccueil = false;
unsigned long dernierMajHorloge = 0;
//--------Device--------
const char* DEVICE_ID = "ESP32_001";
const char* DEVICE_KEY = "maBorneEsp32Secrete2026";

const char* NOM_ENTREPRISE = "Kernel Solutions & Innovations";
//--------Keypad--------
const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};

byte rowPins[ROWS] = { 32, 33, 25, 26 };
byte colPins[COLS] = { 27, 14, 13, 34 }; // Broche D34 (Entree seule) attribuee a la Colonne 4 du clavier

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);


// -------- TFT --------
#define TFT_CS 5
#define TFT_DC 2
#define TFT_RST 4

Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);


// -------- CAPTEUR EMPREINTE --------
#define FINGER_RX 16
#define FINGER_TX 17

HardwareSerial fingerSerial(2);
Adafruit_Fingerprint finger(&fingerSerial);

unsigned long dernierePollDeletion = 0;
const unsigned long INTERVALLE_POLL_DELETION = 5000;

// ID automatique
uint8_t nouvelID;

//const char* ssid = "DESKTOP-R8V5BKN 4837";
//const char* password = "o+190H06";

unsigned long dernierEssaiReconnexion = 0;
const unsigned long INTERVALLE_RECONNEXION = 10000;

unsigned long debutAppuiDiese = 0;
bool appuiDieseEnCours = false;
const unsigned long DUREE_APPUI_LONG = 3000;  // 3 secondes

void mettreAJourBadgeReseauWebPortal() {
  // Evite les allocations heap dynamiques (String) en ecrivant directement
  // dans le buffer statique de 256 octets.
  if (ethernetActif && Ethernet.linkStatus() == LinkON) {
    snprintf(htmlStatusBadge, sizeof(htmlStatusBadge),
      "<b style='color:#2e9e6e'>ETH OK</b> IP: %s", Ethernet.localIP().toString().c_str());
  } else if (WiFi.status() == WL_CONNECTED) {
    snprintf(htmlStatusBadge, sizeof(htmlStatusBadge),
      "<b style='color:#4682b4'>WiFi OK</b> SSID: %s IP: %s",
      WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
  } else {
    snprintf(htmlStatusBadge, sizeof(htmlStatusBadge),
      "<b style='color:#c4443e'>Non connecte</b> (Mode AP)");
  }
}

String genererPageLoginHTML(bool erreur) {
  String html = F("<!DOCTYPE html><html><head>"
    "<meta name='viewport' content='width=device-width, initial-scale=1'>"
    "<title>BioPulse OS - Connexion</title>"
    "<style>"
    "body { background-color:#090d16 !important; color:#f8fafc !important; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif !important; display:flex !important; align-items:center !important; justify-content:center !important; min-height:100vh !important; margin:0 !important; }"
    ".bp-card { background:#0f172a !important; border:1px solid #1e293b !important; border-radius:16px !important; padding:28px 24px !important; width:90% !important; max-width:340px !important; box-shadow:0 15px 35px rgba(0,0,0,0.6) !important; text-align:center !important; margin:auto !important; display:block !important; }"
    ".bp-icon { width:54px !important; height:54px !important; border-radius:16px !important; background:linear-gradient(135deg, #0284c7, #6366f1) !important; margin:0 auto 16px !important; line-height:54px !important; font-size:24px !important; color:#fff !important; text-align:center !important; box-shadow:0 0 20px rgba(56,189,248,0.4) !important; display:block !important; }"
    ".bp-title { color:#ffffff !important; margin:0 0 4px 0 !important; font-size:20px !important; font-weight:800 !important; letter-spacing:-0.5px !important; display:block !important; }"
    ".bp-sub { color:#38bdf8 !important; font-size:11px !important; font-weight:800 !important; letter-spacing:1px !important; margin-bottom:20px !important; display:block !important; }"
    ".bp-input { width:100% !important; padding:12px !important; border:1px solid #334155 !important; border-radius:8px !important; background:#1e293b !important; color:#fff !important; font-size:14px !important; box-sizing:border-box !important; margin-bottom:16px !important; text-align:center !important; outline:none !important; display:block !important; }"
    ".bp-input:focus { border-color:#38bdf8 !important; }"
    ".bp-btn { width:100% !important; padding:12px !important; border:none !important; border-radius:8px !important; background:linear-gradient(135deg, #0284c7, #0369a1) !important; color:#fff !important; font-size:14px !important; font-weight:700 !important; cursor:pointer !important; box-shadow:0 4px 12px rgba(2,132,199,0.3) !important; display:block !important; }"
    ".bp-btn:hover { background:#0284c7 !important; }"
    ".bp-err { background:rgba(244,63,94,0.15) !important; color:#fb7185 !important; border:1px solid rgba(244,63,94,0.4) !important; padding:10px !important; border-radius:8px !important; font-size:12px !important; font-weight:600 !important; margin-bottom:16px !important; display:block !important; }"
    "</style></head><body>"
    "<div class='bp-card'>"
    "<div class='bp-icon'>&#128274;</div>"
    "<div class='bp-title'>BIOPULSE OS</div>"
    "<div class='bp-sub'>PORTAIL DE CONFIGURATION</div>");

  if (erreur) {
    html += F("<div class='bp-err'>&#9888; Mot de passe incorrect</div>");
  }

  html += F("<form method='POST' action='/login'>"
    "<input class='bp-input' type='password' name='password' placeholder='Mot de passe d&#39;accès' required autofocus />"
    "<button class='bp-btn' type='submit'>Se connecter</button>"
    "</form></div></body></html>");

  return html;
}

// -------- SETUP --------
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true); // Active TOUS les logs serie systeme ESP32 (WiFi, DHCP, WPA)
  delay(300);
  // ── DIAGNOSTIC RAM (a lire dans le moniteur serie) ──────────────
  Serial.printf("\n\n=== DIAGNOSTIC RAM ===\n");
  Serial.printf("Heap libre au demarrage : %d octets\n", ESP.getFreeHeap());
  Serial.printf("Heap min libre (ever)   : %d octets\n", ESP.getMinFreeHeap());
  Serial.printf("Heap max bloc libre     : %d octets\n", ESP.getMaxAllocHeap());
  Serial.printf("Raison reset            : %d\n", esp_reset_reason());
  Serial.printf("======================\n");
  Serial.flush();
  chargerParametresNVS();
  ledInit();
  buzzerInit();
  ledJaune(true); // Allume la LED Jaune du debut du demarrage/connexion jusqu'a la fin
  WiFi.setAutoReconnect(true);

  // Écouteur d'événements Wi-Fi avec affichage des étapes 4/5 et 5/5
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
    if (event == ARDUINO_EVENT_WIFI_STA_CONNECTED) {
      Serial.println("[ETAPE 4/5] [WiFi EVENT] Association au routeur Wi-Fi reussie ! Attente attribution IP (DHCP)...");
      Serial.flush();
    } else if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
      Serial.print("[ETAPE 5/5] [WiFi EVENT] Succes ! Adresse IP Wi-Fi attribuee : ");
      Serial.println(IPAddress(info.got_ip.ip_info.ip.addr));
      Serial.flush();
    } else if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
      Serial.print("[WiFi EVENT] Deconnexion / Echec d'association. Code de raison (Reason) : ");
      Serial.println(info.wifi_sta_disconnected.reason);
      Serial.flush();
    }
  });

  Serial.println("DEBUT SETUP");
  Serial.flush();

  // ── Etape 1 : Isolation des CS avant tout ──────────────────────
  // Les deux puces partagent le bus SPI. Il FAUT forcer leurs CS a HIGH
  // avant d'initialiser quoi que ce soit, sinon elles ecoutent toutes
  // les deux en meme temps et se corrompent mutuellement.
  pinMode(TFT_CS, OUTPUT);  digitalWrite(TFT_CS, HIGH);
  pinMode(ETH_CS, OUTPUT);  digitalWrite(ETH_CS, HIGH);

  // ── Etape 2 : Reset W5500 ──────────────────────────────────────
  Serial.println("[SETUP] Reset W5500...");
  pinMode(ETH_RST_PIN, OUTPUT);
  digitalWrite(ETH_RST_PIN, LOW);
  delay(200);
  digitalWrite(ETH_RST_PIN, HIGH);

  // Delai adaptatif : au cold boot (branchement USB/alim), le W5500 a besoin
  // de ~2s pour que sa 3.3V se stabilise et son oscillateur demarre.
  // Apres un software reset, la puce est deja chaude -> 500ms suffisent.
  esp_reset_reason_t resetRaison = esp_reset_reason();
  bool coldBoot = (resetRaison == ESP_RST_POWERON || resetRaison == ESP_RST_BROWNOUT);
  int delaiStabilisation = coldBoot ? 2500 : 500;
  Serial.println("[SETUP] Type reset=" + String(resetRaison) +
                 (coldBoot ? " (cold boot)" : " (soft reset)") +
                 " -> attente " + String(delaiStabilisation) + "ms");
  delay(delaiStabilisation);

  // ── Etape 3 : Init SPI + Init TFT (bus SPI prêt) ──────────
  SPI.begin(18, 19, 23, TFT_CS);
  tft.begin();
  tft.setRotation(1);
  tft.fillScreen(COULEUR_FOND);
  digitalWrite(TFT_CS, HIGH); // Libérer le bus SPI TFT

  Ethernet.init(ETH_CS);

  // ── TEST SPI BRUT (diagnostic cablage W5500) ──────────────────
  Serial.println("[DIAG] === Test SPI brut W5500 ===");
  Serial.println("[DIAG] Pins: SCK=18 MISO=19 MOSI=23 CS=22 RST=15");

  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
  digitalWrite(ETH_CS, LOW);
  delayMicroseconds(10);
  SPI.transfer(0x00);
  SPI.transfer(0x39);
  SPI.transfer(0x00);
  uint8_t vMode0 = SPI.transfer(0x00);
  digitalWrite(ETH_CS, HIGH);
  SPI.endTransaction();
  Serial.printf("[DIAG] Mode0 VERSIONR = 0x%02X (attendu 0x04)\n", vMode0);

  delay(10);
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE3));
  digitalWrite(ETH_CS, LOW);
  delayMicroseconds(10);
  SPI.transfer(0x00);
  SPI.transfer(0x39);
  SPI.transfer(0x00);
  uint8_t vMode3 = SPI.transfer(0x00);
  digitalWrite(ETH_CS, HIGH);
  SPI.endTransaction();
  Serial.printf("[DIAG] Mode3 VERSIONR = 0x%02X (attendu 0x04)\n", vMode3);
  Serial.println("[DIAG] ===============================");
  Serial.flush();

  // ── Etape 4 : Demarrage Ethernet (avec affichage TFT) ──────────
  ethernetActif = demarrerEthernet();

  if (ethernetActif) {
    afficherMessage("Ethernet OK\n" + Ethernet.localIP().toString(), ILI9341_GREEN);
    delay(800);
  }

  // Configuration du Portail Web BioPulse (Ethernet & Wi-Fi)
  wm.setTitle("BioPulse OS — Portail Cyber-Biométrique");
  wm.setCustomHeadElement(
    "<style>"
    "body { background: #060913 radial-gradient(circle at 50% 20%, rgba(2,132,199,0.2) 0%, transparent 60%) !important; color: #f8fafc !important; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important; padding: 20px 10px; margin: 0; min-height: 100vh; box-sizing: border-box; }"
    "h1, h2 { color: #ffffff !important; text-align: center !important; font-size: 22px !important; font-weight: 800 !important; margin: 10px 0 !important; }"
    "div.wrap, div.btn { max-width: 450px !important; margin: 0 auto !important; font-family: inherit !important; }"
    ".q, div.btn { background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%) !important; border: 1px solid rgba(56, 189, 248, 0.35) !important; border-radius: 20px !important; padding: 24px !important; box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 0 25px rgba(2,132,199,0.2) !important; margin-bottom: 20px !important; }"
    "label { color: #38bdf8 !important; font-weight: 800 !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.8px !important; display: block !important; margin-top: 14px !important; margin-bottom: 4px !important; }"
    "input, select { width: 100% !important; padding: 13px 16px !important; margin-bottom: 12px !important; border-radius: 12px !important; border: 1px solid rgba(56, 189, 248, 0.3) !important; background-color: #0f172a !important; color: #ffffff !important; font-size: 14px !important; font-weight: 600 !important; box-sizing: border-box !important; outline: none !important; transition: all 0.25s ease !important; }"
    "input:focus, select:focus { border-color: #38bdf8 !important; box-shadow: 0 0 14px rgba(56, 189, 248, 0.4) !important; background-color: #1e293b !important; }"
    "button, input[type='submit'] { width: 100% !important; padding: 14px !important; margin-top: 20px !important; border-radius: 14px !important; border: none !important; background: linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #6366f1 100%) !important; color: #ffffff !important; font-weight: 800 !important; font-size: 15px !important; text-transform: uppercase !important; letter-spacing: 1px !important; cursor: pointer !important; box-shadow: 0 6px 20px rgba(2, 132, 199, 0.4) !important; transition: all 0.3s ease !important; }"
    "button:hover, input[type='submit']:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(56, 189, 248, 0.55) !important; }"
    "a { color: #38bdf8 !important; text-decoration: none !important; font-weight: 700 !important; display: inline-block !important; margin-top: 10px !important; text-align: center !important; width: 100% !important; }"
    "a:hover { text-decoration: underline !important; color: #60a5fa !important; }"
    "</style>"
    "<div style='text-align:center;padding:20px 0 15px 0;'>"
    "<div style='display:inline-block;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg, #0284c7, #6366f1);box-shadow:0 0 25px rgba(56,189,248,0.5);line-height:54px;font-size:26px;color:#fff;'>&#128274;</div>"
    "<h2 style='color:#ffffff;margin:12px 0 4px 0;font-size:24px;font-weight:900;letter-spacing:-0.5px;'>BIOPULSE OS</h2>"
    "<div style='color:#38bdf8;font-size:11px;font-weight:800;letter-spacing:1.2px;'>PORTAIL CYBER-BIOMÉTRIQUE ESP32</div>"
    "<div style='background:rgba(2,132,199,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:10px;padding:10px;margin-top:12px;color:#34d399;font-size:11px;'>&#9888; Note OTA : Seuls les fichiers compilés <b>.bin</b> sont acceptés. (Croquis > Exporter les binaire compilés)</div>"
    "</div>"
  );
  // Configurations d'optimisation de vitesse pour WiFiManager
  wm.setRemoveDuplicateAPs(true);     // Ne pas envoyer les SSIDs dupliques sur le reseau
  wm.setMinimumSignalQuality(10);     // Ignorer les APs tres faibles pour accelerer le scan
  wm.setAPCallback(modeConfigCallback);
  wm.setSaveParamsCallback(sauvegarderParamsCallback);
  wm.setConfigPortalBlocking(false);
  wm.setConfigPortalTimeout(0);
  wm.setCaptivePortalEnable(false);   // Permet l'acces direct via l'IP locale (Ethernet / WiFi STA) sans redirection AP

  // Authentification HTML dynamique & Routage prioritaire (Intercepte avant WiFiManager handleNotFound)
  wm.setWebServerCallback([]() {
    if (!wm.server) return;

    // Collecter le header Cookie
    const char* headerKeys[] = { "Cookie" };
    wm.server->collectHeaders(headerKeys, 1);

    // Route GET /login : Page de connexion HTML
    wm.server->on("/login", HTTP_GET, []() {
      wm.server->send(200, "text/html", genererPageLoginHTML(false));
    });

    // Route POST /login : Verification du mot de passe
    wm.server->on("/login", HTTP_POST, []() {
      String passSaisi = wm.server->arg("password");
      passSaisi.trim();
      if (passSaisi == String(WEB_PORTAL_PASSWORD)) {
        wm.server->sendHeader("Set-Cookie", "ESPSESSIONID=biopulse_authenticated_2026; Path=/");
        wm.server->sendHeader("Location", "/");
        wm.server->send(302, "text/plain", "Redirection...");
      } else {
        wm.server->send(200, "text/html", genererPageLoginHTML(true));
      }
    });

    // Route POST /save : Enregistrement de la configuration
    wm.server->on("/save", HTTP_POST, []() {
      String sIP = wm.server->arg("server_ip");
      String pPass = wm.server->arg("portal_pass");
      String wSSID = wm.server->arg("wifi_ssid");
      String wPass = wm.server->arg("wifi_pass");
      String eIP = wm.server->arg("eth_ip");
      String eGW = wm.server->arg("eth_gw");
      String eSN = wm.server->arg("eth_sn");
      String eDNS = wm.server->arg("eth_dns");

      Preferences prefs;
      prefs.begin("pointeuse", false);
      prefs.putBool("config_saved", true);

      if (sIP.length() > 0) {
        strncpy(SERVER_HOST_NAME, sIP.c_str(), sizeof(SERVER_HOST_NAME) - 1);
        prefs.putString("server_ip", SERVER_HOST_NAME);
      }
      if (pPass.length() > 0) {
        strncpy(WEB_PORTAL_PASSWORD, pPass.c_str(), sizeof(WEB_PORTAL_PASSWORD) - 1);
        prefs.putString("portal_pass", WEB_PORTAL_PASSWORD);
      }
      if (wSSID.length() > 0) {
        strncpy(WIFI_CONFIG_SSID, wSSID.c_str(), sizeof(WIFI_CONFIG_SSID) - 1);
        prefs.putString("wifi_ssid", WIFI_CONFIG_SSID);
      }
      if (wPass.length() > 0) {
        strncpy(WIFI_CONFIG_PASS, wPass.c_str(), sizeof(WIFI_CONFIG_PASS) - 1);
        prefs.putString("wifi_pass", WIFI_CONFIG_PASS);
      }
      strncpy(ETH_STATIC_IP, eIP.c_str(), sizeof(ETH_STATIC_IP) - 1);
      prefs.putString("eth_ip", ETH_STATIC_IP);
      strncpy(ETH_STATIC_GATEWAY, eGW.c_str(), sizeof(ETH_STATIC_GATEWAY) - 1);
      prefs.putString("eth_gw", ETH_STATIC_GATEWAY);
      strncpy(ETH_STATIC_SUBNET, eSN.c_str(), sizeof(ETH_STATIC_SUBNET) - 1);
      prefs.putString("eth_sn", ETH_STATIC_SUBNET);
      strncpy(ETH_STATIC_DNS, eDNS.c_str(), sizeof(ETH_STATIC_DNS) - 1);
      prefs.putString("eth_dns", ETH_STATIC_DNS);
      prefs.end();

      String html = F("<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'><style>body{background:#060913;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;}</style></head><body>"
                      "<h2 style='color:#34d399;'>&#10004; Configuration Enregistr&eacute;e !</h2>"
                      "<p>Red&eacute;marrage de la pointeuse en cours...</p></body></html>");
      wm.server->send(200, "text/html", html);
      delay(1500);
      ESP.restart();
    });

    // Middleware prioritaire : intercepte TOUTES les requetes et supprime definitivement "File not found"
    wm.server->addMiddleware([](WebServer &server, Middleware::Callback next) {
      String uri = server.uri();

      if (uri == "/login") {
        return next();
      }

      bool estAuthentifie = false;
      if (server.hasHeader("Cookie")) {
        String cookieHeader = server.header("Cookie");
        if (cookieHeader.indexOf("ESPSESSIONID=biopulse_authenticated_2026") >= 0) {
          estAuthentifie = true;
        }
      }

      if (!estAuthentifie) {
        server.send(200, "text/html", genererPageLoginHTML(false));
        return false;
      }

      if (uri == "/param") {
        server.send(200, "text/html", genererPageParamHTML());
        return false;
      } else if (uri == "/info") {
        server.send(200, "text/html", genererPageInfoHTML());
        return false;
      } else if (uri == "/save" || uri == "/wifi" || uri == "/wifisave") {
        return next();
      } else {
        // Redirige /, et toutes les URL captibles vers la page d'accueil du portail !
        server.send(200, "text/html", genererPagePortailHTML());
        return false;
      }
    });
  });

  mettreAJourBadgeReseauWebPortal();
  wm.addParameter(&custom_status_badge);
  wm.addParameter(&custom_server_ip);
  wm.addParameter(&custom_portal_pass);
  wm.addParameter(&custom_eth_ip);
  wm.addParameter(&custom_eth_gw);
  wm.addParameter(&custom_eth_sn);
  wm.addParameter(&custom_eth_dns);

  // ethernetActif est deja defini par demarrerEthernet() plus haut.
  Serial.println("[SETUP] ethernetActif=" + String(ethernetActif));

  if (ethernetActif) {
    Serial.println("Ethernet connecte - IP: " + Ethernet.localIP().toString());

    // Demarrer le point d'acces AP et le serveur web 24/7 en arriere-plan
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP("Pointeuse-Config", "12345678");
    wm.setConfigPortalTimeout(0);
    wm.startWebPortal();

    // Lancer la connexion WiFi STA en arriere-plan
    connecterWiFiSTA();

    // Si aucune config serveur n'est enregistree, demander la saisie
    Preferences checkPrefs;
    checkPrefs.begin("pointeuse", true);
    bool hasSavedConfig = checkPrefs.getBool("config_saved", false)
                       || checkPrefs.getString("server_ip", "").length() > 0;
    checkPrefs.end();

    if (!hasSavedConfig) {
      Serial.println("[ETH] Aucune config serveur -> attente WebPortal");
      reconfigurerWiFi();
    }

  } else {
    Serial.println("\n==================================================");
    Serial.println("[WiFi] Tentative de connexion Wi-Fi au demarrage...");
    Serial.println("==================================================");

    afficherEcranConnexionWiFi(strlen(WIFI_CONFIG_SSID) > 0 ? WIFI_CONFIG_SSID : WiFi.SSID().c_str());

    connecterWiFiSTA();

    // Attendre jusqu'a 12 secondes l'établissement de la connexion Wi-Fi
    unsigned long startWait = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startWait < 12000) {
      delay(250);
      Serial.print(".");
      Serial.flush();
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WiFi] Connexion Wi-Fi reussie ! IP ESP32 : " + WiFi.localIP().toString());
      afficherMessage("WiFi Connecte !\n" + WiFi.SSID() + "\n" + WiFi.localIP().toString(), ILI9341_GREEN);
      delay(1200);
    } else {
      Serial.println("[WiFi] Echec de connexion Wi-Fi. Lancement du portail de configuration...");
      reconfigurerWiFi();
    }
  }



  afficherMessage("Recherche serveur...", ILI9341_WHITE);
  if (decouvrirServeurUDP()) {
    afficherMessage("Serveur detecte :\n" + String(SERVER_HOST_NAME), ILI9341_GREEN);
    delay(1200);
  }

  afficherMessage("Synchro heure...", ILI9341_WHITE);

  bool heureOk = synchroniserHeure();

  if (heureOk) {
    Serial.println("Heure synchronisee");
  } else {
    Serial.println("NTP indisponible, poursuite sans heure exacte");
  }

  if (!ethernetActif) {
    Serial.print("IP ESP32 (WiFi) : ");
    Serial.println(WiFi.localIP());
  }


  Serial.println("=== SYSTEME EMPREINTE ===");
  Serial.println("A : Ajouter empreinte");
  Serial.println("D : Supprimer empreinte");

  afficherMessage("Demarrage...", ILI9341_WHITE);

  fingerSerial.begin(57600, SERIAL_8N1, FINGER_RX, FINGER_TX);

  delay(500);



  if (finger.verifyPassword()) {
    Serial.println("Capteur OK");
    afficherMessage("Capteur OK", ILI9341_GREEN);
  } else {
    Serial.println("Erreur capteur");
    afficherMessage("Erreur capteur", ILI9341_RED);

    while (1)
      ;
  }



  finger.getTemplateCount();


  Serial.print("Empreintes presentes : ");
  Serial.println(finger.templateCount);



  delay(500);
  afficherMessage("Verif reseau & serveur...", ILI9341_WHITE);
  attendreReseauEtServeur();

  afficherAccueil();
  bipDemarrage();
  setupTermine = true; // Verrouille les ecrans de connexion reseau (ils ne re-apparaitront plus apres le demarrage)
}

bool estPointageSucces(String jsonReponse) {
  if (jsonReponse.length() == 0) return false;
  DynamicJsonDocument doc(512);
  DeserializationError err = deserializeJson(doc, jsonReponse);
  if (err) return false;

  if (doc.containsKey("error") || doc.containsKey("err")) return false;
  if (doc.containsKey("name") || doc.containsKey("employee") || doc.containsKey("type")) return true;

  return false;
}

// -------- LOOP --------

void loop() {
  wm.process();
  gererServeurWebEthernet();

  // Ne pas executer de requetes HTTP d'arriere-plan pendant la configuration WebPortal
  if (!portailActif) {
    verifierBasculeReseau();
    verifierServeurEnContinu();

    if (!reseauDisponible() && !ecranErreurActif) {
      attendreReseauEtServeur();
      afficherAccueil();
    }

    if (millis() - dernierEssaiSyncHeure > 3600000UL) {
      dernierEssaiSyncHeure = millis();
      synchroniserHeure(); // heure serveur uniquement
    }

    mettreAJourHorloge(false);
    if (millis() - dernierePollDeletion > INTERVALLE_POLL_DELETION) {
      dernierePollDeletion = millis();
      verifierSuppressions();
    }
  }

  char c = keypad.getKey();
  if (c) {
    bipTouche();
  }

  // AJOUT
  if (c == 'A') {
    if (demanderPin()) {
      int index = selectionnerEmploye("none");

      if (index >= 0) {
        nouvelID = trouverIDLibre();

        if (nouvelID == 0) {
          Serial.println("Memoire pleine");
          afficherMessage("Memoire pleine", ILI9341_RED);
          delay(2000);
        } else {
          enregistrerEmpreinte(nouvelID, empId[index]);
          delay(2000);
        }
      }
    }
    afficherAccueil();
  }

  if (c == 'B') {
    if (demanderPin()) {
      int index = selectionnerEmploye("has");

      if (index >= 0) {
        nouvelID = trouverIDLibre();

        if (nouvelID == 0) {
          Serial.println("Memoire pleine");
          afficherMessage("Memoire pleine", ILI9341_RED);
          delay(2000);
        } else {
          enregistrerEmpreinte(nouvelID, empId[index]);
          delay(2000);
        }
      }
    }
    afficherAccueil();                                                   
  }

  if (c == 'C') {
    if (demanderPin()) {
      String matricule = saisirMatricule();

      if (matricule.length() > 0) {
        String employeId, nom;
        bool dejaExistant = false;
        afficherMessage("Recherche...", ILI9341_WHITE);

        if (creerEmployeRapide(matricule, employeId, nom, dejaExistant)) {
          if (dejaExistant) {
            afficherMessage(nom + "\n(Existe deja)", ILI9341_YELLOW);
          } else {
            afficherMessage("Cree : " + nom, ILI9341_GREEN);
          }
          delay(1500);

          afficherMessage("Enroler empreinte ?\n#=Oui *=Non", ILI9341_YELLOW);
          char confirm = 0;
          while (!confirm) confirm = keypad.getKey();

          if (confirm == '#') {
            nouvelID = trouverIDLibre();
            if (nouvelID == 0) {
              afficherMessage("Memoire pleine", ILI9341_RED);
              delay(2000);
            } else {
              enregistrerEmpreinte(nouvelID, employeId);
              delay(2000);
            }
          }
        } else {
          afficherMessage("Erreur creation", ILI9341_RED);
          delay(2000);
        }
      }
    }
    afficherAccueil();
  }

  if (c == 'D') {
    if (demanderPin()) {
      int choix = afficherMenuSuppression();

      if (choix == 1) {
        supprimerEmployeComplet();
      } else if (choix == 2) {
        supprimerEmpreinte();
      }
    }
    afficherAccueil();
  }

  if (c == '*') {
    afficherMessage("Re-essai...", ILI9341_WHITE);
    delay(500);
    if (reseauDisponible() && testerConnexionServeur()) {
      synchroniserHeure();
      afficherAccueil();
    } else {
      afficherEcranErreurReseau("ERREUR SERVEUR", "Impossible de joindre le serveur. Verifiez le reseau ou l'IP backend.");
    }
  }

  if (c == '#') {
    if (demanderPin()) {
    afficherEcranIPs();
  }
  }

  int id = reconnaitreEmpreinte();

  if (id >= 0) {
    Serial.print("Empreinte trouvee ID : ");
    Serial.println(id);

    ledOff();
    afficherMessage("Verification...", ILI9341_WHITE);

    String reponse = envoyerMongo(id, "recognize");

    // Determiner selon la reponse JSON du serveur si le pointage est accepte ou refuse
    bool pointageSucces = estPointageSucces(reponse);

    // 1. Afficher d'abord le resultat a l'ecran TFT
    afficherResultatReconnaissance(reponse);

    // 2. Allumer la LED Verte (GPIO 3) & Bip succes OU LED Rouge (GPIO 1) & Bip erreur
    if (pointageSucces) {
      ledVert(true);
      ledRouge(false);
      bipSucces();
    } else {
      ledVert(false);
      ledRouge(true);
      bipErreur();
    }

    // 3. Maintenir l'ecran et la LED pendant 3 secondes
    delay(3000);

    // 4. Eteindre les LEDs et retourner a l'accueil
    ledOff();
    afficherAccueil();

  } else if (id == -3) {
    // Empreinte inconnue -> Pointage refuse
    ledOff();
    afficherMessage("Empreinte inconnue", ILI9341_RED);

    // Allumer la LED Rouge (GPIO 1) & Bip sonore de refus
    ledRouge(true);
    bipErreur();

    delay(3000);

    ledOff();
    afficherAccueil();
  }
}

void afficherErreurWiFiDetaillee(wl_status_t st) {
  Serial.print("[WiFi DEBUG] Statut WiFi (" + String((int)st) + ") : ");
  switch (st) {
    case WL_NO_SSID_AVAIL:
      Serial.println("Erreur (1) - Reseau (SSID) introuvable ou hors de portee ! Verifiez le nom du WiFi.");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("Erreur (4) - Echec de connexion ! Mot de passe WiFi (WPA2) incorrect !");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("Erreur (5) - Connexion perdue avec le routeur Wi-Fi.");
      break;
    case WL_DISCONNECTED:
      Serial.println("Erreur (6) - Deconnecte du routeur (Echec attribution IP DHCP).");
      break;
    case WL_CONNECTED:
      Serial.println("Succes (3) - Connecte au routeur ! IP: " + WiFi.localIP().toString());
      break;
    case WL_IDLE_STATUS:
      Serial.println("Attente (0) - Negociation en cours...");
      break;
    default:
      Serial.println("Code statut: " + String((int)st));
      break;
  }
}
