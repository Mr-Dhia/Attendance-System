// ============================================================
// GESTION DES LEDS DE STATUT ET DE POINTAGE
// ============================================================

#define LED_JAUNE 12  // Broche D12 (Connexion / Attente)
#define LED_VERT  3   // Broche RX0 / GPIO 3 (Pointage Reussi - Verte)
#define LED_ROUGE 1   // Broche TX0 / GPIO 1 (Pointage Refuse - Rouge)
#define BUZZER_PIN 21 // Broche D21 / GPIO 21 (Dédiée au Buzzer sonore)

void ledInit() {
  pinMode(LED_JAUNE, OUTPUT);
  pinMode(LED_VERT, OUTPUT);
  pinMode(LED_ROUGE, OUTPUT);

  digitalWrite(LED_JAUNE, LOW);
  digitalWrite(LED_VERT, LOW);
  digitalWrite(LED_ROUGE, LOW);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void ledVert(bool state) {
  digitalWrite(LED_VERT, state ? HIGH : LOW);
}

void ledRouge(bool state) {
  digitalWrite(LED_ROUGE, state ? HIGH : LOW);
}

void ledJaune(bool state) {
  digitalWrite(LED_JAUNE, state ? HIGH : LOW);
}

void ledOff() {
  digitalWrite(LED_JAUNE, LOW);
  digitalWrite(LED_VERT, LOW);
  digitalWrite(LED_ROUGE, LOW);
}

void ledConnexion(bool state) {
  ledJaune(state);
  if (state) {
    ledVert(false);
    ledRouge(false);
  }
}

void buzzerInit() {
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

// Bip court lors de l'appui sur une touche du clavier (Frequence de resonance optimale 2750Hz)
void bipTouche() {
  tone(BUZZER_PIN, 2750, 35);
  delay(40);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Bip double aigu ultra-net lors d'un pointage valide (2700Hz -> 3300Hz)
void bipSucces() {
  tone(BUZZER_PIN, 2700, 100);
  delay(120);
  tone(BUZZER_PIN, 3300, 180);
  delay(190);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Bip d'erreur alarme (Alternance 900Hz / 1200Hz pour puissance sonore maximale)
void bipErreur() {
  tone(BUZZER_PIN, 900, 200);
  delay(210);
  tone(BUZZER_PIN, 1200, 250);
  delay(260);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

// Melodie de bienvenue au demarrage du systeme (Octave superieure C7-E7-G7 pour volume max)
void bipDemarrage() {
  tone(BUZZER_PIN, 2093, 90); delay(110); // C7 (Do)
  tone(BUZZER_PIN, 2637, 90); delay(110); // E7 (Mi)
  tone(BUZZER_PIN, 3136, 180); delay(190); // G7 (Sol)
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}
