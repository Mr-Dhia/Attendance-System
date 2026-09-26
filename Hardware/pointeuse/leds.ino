// ============================================================
// GESTION DES LEDS DE STATUT ET DE POINTAGE
// ============================================================

#define LED_JAUNE -1  // Desactive (-1) si non cablee
#define LED_VERT  -1  // Desactive (-1) pour eviter tout conflit avec Serial RX0 (GPIO 3)
#define LED_ROUGE -1  // Desactive (-1) pour eviter tout conflit avec Serial TX0 (GPIO 1)
#define BUZZER_PIN -1 // Desactive (-1) pour eviter tout conflit avec FINGER_TX (GPIO 12) et Serial TX0 (GPIO 1)

void ledInit() {
  if (LED_JAUNE >= 0) { pinMode(LED_JAUNE, OUTPUT); digitalWrite(LED_JAUNE, LOW); }
  if (LED_VERT >= 0)  { pinMode(LED_VERT, OUTPUT);  digitalWrite(LED_VERT, LOW); }
  if (LED_ROUGE >= 0) { pinMode(LED_ROUGE, OUTPUT); digitalWrite(LED_ROUGE, LOW); }

  if (BUZZER_PIN >= 0) {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void ledVert(bool state) {
  if (LED_VERT >= 0) digitalWrite(LED_VERT, state ? HIGH : LOW);
}

void ledRouge(bool state) {
  if (LED_ROUGE >= 0) digitalWrite(LED_ROUGE, state ? HIGH : LOW);
}

void ledJaune(bool state) {
  if (LED_JAUNE >= 0) digitalWrite(LED_JAUNE, state ? HIGH : LOW);
}

void ledOff() {
  ledJaune(false);
  ledVert(false);
  ledRouge(false);
}

void ledConnexion(bool state) {
  ledJaune(state);
  if (state) {
    ledVert(false);
    ledRouge(false);
  }
}

void buzzerInit() {
  if (BUZZER_PIN >= 0) {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

// Bip court lors de l'appui sur une touche du clavier (Frequence de resonance optimale 2750Hz)
void bipTouche() {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, 2750, 35);
  delay(40);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Bip double aigu ultra-net lors d'un pointage valide (2700Hz -> 3300Hz)
void bipSucces() {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, 2700, 100);
  delay(120);
  tone(BUZZER_PIN, 3300, 180);
  delay(190);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Bip d'erreur alarme (Alternance 900Hz / 1200Hz pour puissance sonore maximale)
void bipErreur() {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, 900, 200);
  delay(210);
  tone(BUZZER_PIN, 1200, 250);
  delay(260);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Melodie de bienvenue au demarrage du systeme (Octave superieure C7-E7-G7 pour volume max)
void bipDemarrage() {
  if (BUZZER_PIN < 0) return;
  tone(BUZZER_PIN, 2093, 90); delay(110); // C7 (Do)
  tone(BUZZER_PIN, 2637, 90); delay(110); // E7 (Mi)
  tone(BUZZER_PIN, 3136, 180); delay(190); // G7 (Sol)
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}
