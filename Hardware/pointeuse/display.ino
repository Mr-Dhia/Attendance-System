// ======================================================================
// DESIGN CORPORATE / PROFESSIONNEL — palette bleu marine sobre
// (les constantes COULEUR_* et la macro RGB565 sont definies dans pointeuse.ino,
//  car ce fichier doit rester le premier compile par l'IDE Arduino)
// ======================================================================

// Forward prototypes pour les fonctions de dessin
void dessinerBadge(int cx, int cy, int r, uint16_t couleurBadge);
void dessinerCheck(int cx, int cy, int r);
void dessinerCroix(int cx, int cy, int r);
void dessinerHorloge(int cx, int cy, int r);
void dessinerEmpreinte(int cx, int cy, int taille);
void texteCentre(String texte, int y, uint16_t coul, int taille);
void texteMultiLignesMots(String texte, int yDepart, uint16_t couleur, uint8_t tailleText, int maxCarParLigne);
void dessinerEntete(String titre, int type);
void dessinerBarreAide(String texte);
void afficherStatutConnexion();

// Flags globaux
bool ecranErreurActif = false;
bool setupTermine = false; // Devient true a la fin de setup() : bloque les ecrans de connexion apres le demarrage

void mettreAJourBarreProgression(int etape, int total) {
  if (setupTermine) return; // Uniquement au demarrage
  const int X = 20, Y = 185, W = tft.width() - 40, H = 8, R = 4;
  tft.fillRoundRect(X, Y, W, H, R, COULEUR_CARTE);
  tft.drawRoundRect(X, Y, W, H, R, COULEUR_ACCENT);
  if (total > 0 && etape > 0) {
    int filled = (W - 2) * etape / total;
    if (filled > 0) {
      if (filled < 6) {
        tft.fillRect(X + 1, Y + 1, filled, H - 2, COULEUR_ACCENT);
      } else {
        tft.fillRoundRect(X + 1, Y + 1, filled, H - 2, 2, COULEUR_ACCENT);
      }
    }
  }
  int pct = (total > 0) ? (etape * 100 / total) : 0;
  char buf[8];
  snprintf(buf, sizeof(buf), "%d%%", pct);
  tft.fillRect(X, Y + H + 4, W, 12, COULEUR_FOND);
  texteCentre(String(buf), Y + H + 5, COULEUR_TEXTE_2, 1);
}

// Ecran connexion Ethernet (s'affiche UNIQUEMENT au demarrage)
void afficherEcranConnexionEthernet() {
  if (setupTermine) return; // Ne s'affiche qu'au demarrage !
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("CONNEXION RESEAU", 2);
  int cx = tft.width() / 2, cy = 105;
  tft.fillRoundRect(cx - 22, cy - 18, 44, 30, 4, COULEUR_CARTE);
  tft.drawRoundRect(cx - 22, cy - 18, 44, 30, 4, COULEUR_ACCENT);
  for (int i = -1; i <= 1; i++)
    tft.drawFastVLine(cx + i * 10, cy + 12, 16, COULEUR_ACCENT);
  tft.drawFastHLine(cx - 10, cy + 28, 21, COULEUR_ACCENT);
  tft.drawCircle(cx, cy, 38, RGB565(30, 60, 100));
  texteCentre("CONNEXION ETHERNET", 155, COULEUR_TEXTE, 2);
  texteCentre("W5500 - Detection en cours...", 172, COULEUR_TEXTE_2, 1);
  mettreAJourBarreProgression(0, 20);
  dessinerBarreAide("Initialisation Ethernet...");
}

// Ecran connexion WiFi (s'affiche UNIQUEMENT au demarrage)
void afficherEcranConnexionWiFi(String ssid) {
  if (setupTermine) return; // Ne s'affiche qu'au demarrage !
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("CONNEXION RESEAU", 2);
  int cx = tft.width() / 2, cy = 108;
  tft.fillCircle(cx, cy + 14, 5, COULEUR_ACCENT);
  for (int r = 14; r <= 34; r += 10) {
    int x0 = cx - r * 7 / 10;
    int x1 = cx + r * 7 / 10;
    tft.drawFastHLine(x0, cy + 14 - r / 2, x1 - x0, COULEUR_ACCENT);
  }
  tft.drawCircle(cx, cy, 40, RGB565(30, 60, 100));
  texteCentre("CONNEXION WI-FI", 155, COULEUR_TEXTE, 2);
  if (ssid.length() > 0)
    texteCentre("SSID: " + ssid, 172, COULEUR_ACCENT, 1);
  else
    texteCentre("Portail AP: Pointeuse-Config", 172, COULEUR_ATTENTE, 1);
  mettreAJourBarreProgression(0, 15);
  dessinerBarreAide("Connexion WiFi en cours...");
}

// Traduit une couleur "standard" (celle passee par pointeuse.ino) vers la palette corporate
uint16_t mapCouleur(uint16_t c) {
  if (c == ILI9341_GREEN)  return COULEUR_SUCCES;
  if (c == ILI9341_RED)    return COULEUR_ERREUR;
  if (c == ILI9341_ORANGE || c == ILI9341_YELLOW) return COULEUR_ATTENTE;
  if (c == ILI9341_CYAN || c == ILI9341_BLUE) return COULEUR_ACCENT;
  if (c == ILI9341_WHITE)  return COULEUR_TEXTE;
  if (c == ILI9341_LIGHTGREY) return COULEUR_TEXTE_2;
  if (c == ILI9341_NAVY)   return COULEUR_ENTETE_HAUT;
  return c;
}

void degradeVertical(int x, int y, int w, int h, uint16_t couleurHaut, uint16_t couleurBas) {
  uint8_t r1 = (couleurHaut >> 11) & 0x1F, g1 = (couleurHaut >> 5) & 0x3F, b1 = couleurHaut & 0x1F;
  uint8_t r2 = (couleurBas  >> 11) & 0x1F, g2 = (couleurBas  >> 5) & 0x3F, b2 = couleurBas  & 0x1F;
  for (int i = 0; i < h; i++) {
    uint8_t r = r1 + ((int)(r2 - r1) * i) / h;
    uint8_t g = g1 + ((int)(g2 - g1) * i) / h;
    uint8_t b = b1 + ((int)(b2 - b1) * i) / h;
    tft.drawFastHLine(x, y + i, w, (uint16_t)((r << 11) | (g << 5) | b));
  }
}

void afficherMessage(String msg, uint16_t couleur) {
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("SYSTEME POINTAGE", 2);

  uint16_t coul = mapCouleur(couleur);
  int cy = 108;

  if (msg.indexOf("doigt") >= 0 && couleur != ILI9341_RED) {
    dessinerEmpreinte(tft.width() / 2, cy, 55);
  } else if (couleur == ILI9341_GREEN) {
    dessinerCheck(tft.width() / 2, cy, 26);
  } else if (couleur == ILI9341_RED) {
    dessinerCroix(tft.width() / 2, cy, 26);
  } else if (couleur == ILI9341_ORANGE || couleur == ILI9341_YELLOW) {
    dessinerHorloge(tft.width() / 2, cy, 26);
  }

  texteCentre(msg, 168, coul, 2);
}

String nettoyerAccents(String str) {
  String out = "";
  for (size_t i = 0; i < str.length(); i++) {
    unsigned char c = str[i];

    if (c == 0xC3 && i + 1 < str.length()) {
      unsigned char c2 = str[i + 1];
      i++;
      if (c2 >= 0xA0 && c2 <= 0xA5) out += 'a';
      else if (c2 >= 0xA8 && c2 <= 0xAB) out += 'e';
      else if (c2 >= 0xAC && c2 <= 0xAF) out += 'i';
      else if (c2 >= 0xB2 && c2 <= 0xB6) out += 'o';
      else if (c2 >= 0xB9 && c2 <= 0xBC) out += 'u';
      else if (c2 == 0xA7) out += 'c';
      else if (c2 >= 0x80 && c2 <= 0x85) out += 'A';
      else if (c2 >= 0x88 && c2 <= 0x8B) out += 'E';
      else if (c2 >= 0x8C && c2 <= 0x8F) out += 'I';
      else if (c2 >= 0x92 && c2 <= 0x96) out += 'O';
      else if (c2 >= 0x99 && c2 <= 0x9C) out += 'U';
      else if (c2 == 0x87) out += 'C';
      else out += ' ';
    } else if (c == 0xE2 && i + 2 < str.length()) {
      i += 2;
      out += '\'';
    } else if (c >= 32 && c <= 126) {
      out += (char)c;
    } else {
      out += ' ';
    }
  }
  return out;
}

void texteCentre(String texteBrut, int y, uint16_t couleur, int taille) {
  texteCentre(texteBrut, y, couleur, (uint8_t)taille);
}

void texteCentre(String texteBrut, int y, uint16_t couleur, uint8_t taille) {
  String texte = nettoyerAccents(texteBrut);
  tft.setTextSize(taille);
  tft.setTextColor(couleur);
  int16_t x1, y1;
  uint16_t w, h;
  tft.getTextBounds(texte, 0, 0, &x1, &y1, &w, &h);
  int x = (tft.width() - (int)w) / 2;
  if (x < 0) x = 0;
  tft.setCursor(x, y);
  tft.println(texte);
}

void texteMultiLignesMots(String texteBrut, int startY, uint16_t couleur, uint8_t taille, int lineSpacing) {
  String text = nettoyerAccents(texteBrut);
  tft.setTextSize(taille);
  tft.setTextColor(couleur);

  int maxWidth = tft.width() - 20;
  String currentLine = "";
  int currentY = startY;

  while (text.length() > 0) {
    int spaceIndex = text.indexOf(' ');
    String word = "";
    if (spaceIndex >= 0) {
      word = text.substring(0, spaceIndex);
      text = text.substring(spaceIndex + 1);
    } else {
      word = text;
      text = "";
    }

    if (word.length() == 0) continue;

    String testLine = currentLine.length() > 0 ? (currentLine + " " + word) : word;
    int16_t x1, y1;
    uint16_t w, h;
    tft.getTextBounds(testLine, 0, 0, &x1, &y1, &w, &h);

    if (w > maxWidth && currentLine.length() > 0) {
      texteCentre(currentLine, currentY, couleur, taille);
      currentY += lineSpacing;
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length() > 0) {
    texteCentre(currentLine, currentY, couleur, taille);
  }
}

void dessinerEntete(String titre, int taille) {
  int hauteur = 36;
  degradeVertical(0, 0, tft.width(), hauteur, COULEUR_ENTETE_HAUT, COULEUR_ENTETE_BAS);
  texteCentre(titre, 9, COULEUR_TEXTE, taille);
  tft.drawFastHLine(0, hauteur, tft.width(), COULEUR_LIGNE_ACCENT);
  tft.drawFastHLine(0, hauteur + 1, tft.width(), RGB565(20, 20, 24));
}

// Fond circulaire "badge" derriere chaque icone (effet carte sobre)
void dessinerBadge(int cx, int cy, int rExt, uint16_t couleurAnneau) {
  tft.fillCircle(cx, cy, rExt, COULEUR_CARTE);
  tft.drawCircle(cx, cy, rExt, couleurAnneau);
  tft.drawCircle(cx, cy, rExt - 1, couleurAnneau);
}

void dessinerCheck(int cx, int cy, int r) {
  dessinerBadge(cx, cy, r + 16, COULEUR_SUCCES);
  for (int i = 0; i < 2; i++) {
    tft.drawLine(cx - r / 2, cy + i, cx - r / 6, cy + r / 2 + i, COULEUR_SUCCES);
    tft.drawLine(cx - r / 6, cy + r / 2 + i, cx + r / 2, cy - r / 3 + i, COULEUR_SUCCES);
  }
}

void dessinerCroix(int cx, int cy, int r) {
  dessinerBadge(cx, cy, r + 16, COULEUR_ERREUR);
  for (int i = 0; i < 2; i++) {
    tft.drawLine(cx - r / 2, cy - r / 2 + i, cx + r / 2, cy + r / 2 + i, COULEUR_ERREUR);
    tft.drawLine(cx + r / 2, cy - r / 2 + i, cx - r / 2, cy + r / 2 + i, COULEUR_ERREUR);
  }
}

void dessinerHorloge(int cx, int cy, int r) {
  dessinerBadge(cx, cy, r + 16, COULEUR_ATTENTE);
  tft.drawCircle(cx, cy, r - 4, COULEUR_ATTENTE);
  tft.drawLine(cx, cy, cx, cy - r + 8, COULEUR_ATTENTE);
  tft.drawLine(cx, cy, cx + r / 2 - 2, cy, COULEUR_ATTENTE);
}

void dessinerEmpreinte(int cx, int cy, int taille) {
  int rBadge = taille / 2 + 14;
  dessinerBadge(cx, cy, rBadge, COULEUR_ACCENT);
  for (int i = 0; i < 5; i++) {
    tft.drawRoundRect(cx - taille / 2 + i * 2, cy - taille / 2 - i * 2, taille - i * 4, taille + i * 3, taille / 3, COULEUR_ACCENT);
  }
}

// Centre un texte a l'interieur d'une zone horizontale donnee (utile pour des cartes cote a cote)
void texteCentreZone(String texte, int xZone, int wZone, int y, uint16_t couleur, uint8_t taille) {
  tft.setTextSize(taille);
  tft.setTextColor(couleur);
  int16_t x1, y1;
  uint16_t w, h;
  tft.getTextBounds(texte, 0, 0, &x1, &y1, &w, &h);
  int x = xZone + (wZone - (int)w) / 2;
  if (x < xZone) x = xZone;
  tft.setCursor(x, y);
  tft.println(texte);
}

// Icone silhouette humaine (employe)
void dessinerPersonne(int cx, int cy, int taille, uint16_t couleur) {
  int rTete = taille / 3;
  tft.fillCircle(cx, cy - taille / 2, rTete, couleur);
  tft.fillRoundRect(cx - taille / 2, cy - taille / 8, taille, taille * 2 / 3, taille / 4, couleur);
}

// Icone corbeille (suppression)
void dessinerCorbeille(int cx, int cy, int taille, uint16_t couleur) {
  int x = cx - taille / 2;
  int y = cy - taille / 2 + 6;

  tft.fillRect(x - 5, y - 9, taille + 10, 6, couleur);       // couvercle
  tft.fillRect(cx - taille / 6, y - 16, taille / 3, 8, couleur); // poignee
  tft.fillRoundRect(x, y, taille, taille, 4, couleur);        // corps

  for (int i = 1; i <= 3; i++) {
    int lx = x + (taille * i) / 4;
    tft.drawFastVLine(lx, y + 6, taille - 12, COULEUR_CARTE);
  }
}

// Triangle d'alerte, avec un anneau qui "respire" quand pulse == true (appelee en boucle)
void dessinerAvertissement(int cx, int cy, int taille, uint16_t couleur, bool pulse) {
  int rEffacement = taille + 20;
  tft.fillCircle(cx, cy, rEffacement, COULEUR_CARTE);

  int rAnneau = taille + 16 + (pulse ? 4 : 0);
  tft.drawCircle(cx, cy, rAnneau, couleur);
  tft.drawCircle(cx, cy, rAnneau - 1, couleur);

  int x0 = cx,          y0 = cy - taille;
  int x1 = cx - taille,  y1 = cy + taille / 2;
  int x2 = cx + taille,  y2 = cy + taille / 2;

  tft.fillTriangle(x0, y0, x1, y1, x2, y2, couleur);
  tft.fillTriangle(x0, y0 + 4, x1 + 3, y1 - 2, x2 - 3, y2 - 2, COULEUR_CARTE);

  tft.fillRect(cx - 2, cy - taille / 4, 4, taille / 2, couleur);
  tft.fillCircle(cx, cy + taille / 2 - 3, 2, couleur);
}

// Carte de saisie reutilisable (PIN, matricule, ID a supprimer...)
void dessinerChampSaisie(String titre, String valeur, bool masquer, uint16_t couleurValeur) {
  tft.fillRect(0, 44, tft.width(), 110, COULEUR_FOND);
  texteCentre(titre, 54, COULEUR_TEXTE_2, 2);

  String affichage = valeur;
  if (masquer) {
    affichage = "";
    for (unsigned int i = 0; i < valeur.length(); i++) affichage += "*";
  }
  if (affichage.length() == 0) affichage = "_";

  int larg = 210;
  int x = (tft.width() - larg) / 2;
  int y = 90;
  int haut = 46;
  tft.fillRoundRect(x, y, larg, haut, 8, COULEUR_CARTE);
  tft.drawRoundRect(x, y, larg, haut, 8, COULEUR_ACCENT);
  texteCentre(affichage, y + 12, couleurValeur, 3);
}

// Barre d'aide sobre en bas d'ecran (raccourcis clavier)
void dessinerBarreAide(String texte) {
  int y = tft.height() - 24;
  tft.fillRect(0, y, tft.width(), 24, COULEUR_ENTETE_HAUT);
  tft.drawFastHLine(0, y, tft.width(), COULEUR_LIGNE_ACCENT);
  texteCentre(texte, y + 7, COULEUR_TEXTE_2, 1);
}

// Menu de suppression (touche D) : deux cartes avec badges numerotes qui "respirent"
// jusqu'a ce qu'une touche soit pressee. Renvoie 1, 2 ou 0 (annulation).
int afficherMenuSuppression() {
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("SUPPRESSION", 2);

  int marge = 12;
  int cw = (tft.width() - marge * 3) / 2;
  int cx1 = marge;
  int cx2 = marge * 2 + cw;
  int cy = 54;
  int ch = 130;

  tft.fillRoundRect(cx1, cy, cw, ch, 10, COULEUR_CARTE);
  tft.drawRoundRect(cx1, cy, cw, ch, 10, COULEUR_ACCENT);
  dessinerPersonne(cx1 + cw / 2, cy + 60, 30, COULEUR_ACCENT);
  texteCentreZone("Employe", cx1, cw, cy + 92, COULEUR_TEXTE, 1);
  texteCentreZone("complet", cx1, cw, cy + 106, COULEUR_TEXTE, 1);

  tft.fillRoundRect(cx2, cy, cw, ch, 10, COULEUR_CARTE);
  tft.drawRoundRect(cx2, cy, cw, ch, 10, COULEUR_ATTENTE);
  dessinerEmpreinte(cx2 + cw / 2, cy + 60, 26);
  texteCentreZone("Empreinte", cx2, cw, cy + 92, COULEUR_TEXTE, 1);
  texteCentreZone("/ ID", cx2, cw, cy + 106, COULEUR_TEXTE, 1);

  dessinerBarreAide("1=Employe   2=Empreinte   *=Annuler");

  unsigned long dernierFrame = 0;
  bool grand = false;

  while (true) {
    char touche = keypad.getKey();
    if (touche == '1') return 1;
    if (touche == '2') return 2;
    if (touche == '*') return 0;

    if (millis() - dernierFrame > 450) {
      dernierFrame = millis();
      grand = !grand;
      int r = grand ? 11 : 9;

      tft.fillCircle(cx1 + 20, cy + 18, 13, COULEUR_CARTE);
      tft.fillCircle(cx1 + 20, cy + 18, r, COULEUR_ACCENT);
      texteCentreZone("1", cx1 + 8, 24, cy + 11, COULEUR_FOND, 1);

      tft.fillCircle(cx2 + 20, cy + 18, 13, COULEUR_CARTE);
      tft.fillCircle(cx2 + 20, cy + 18, r, COULEUR_ATTENTE);
      texteCentreZone("2", cx2 + 8, 24, cy + 11, COULEUR_FOND, 1);
    }
  }
}

String derniereHeureAffichee = "";
bool dateAffichee = false;

void mettreAJourHorloge(bool forcer) {
  if (!ecranAccueil) return;
  if (!forcer && millis() - dernierMajHorloge < 1000) return;
  dernierMajHorloge = millis();

  struct tm timeinfo;
  bool ok = obtenirHeureActuelle(timeinfo);
  if (!ok) return;

  char bufHeure[9];
  strftime(bufHeure, sizeof(bufHeure), "%H:%M:%S", &timeinfo);
  String nouvelleHeure = String(bufHeure);

  // Ne redessine que si l'heure affichee a reellement change
  if (nouvelleHeure == derniereHeureAffichee && !forcer) return;

  tft.setTextSize(4);
  int16_t x1, y1;
  uint16_t w, h;

  // Efface uniquement l'ancien texte (pas toute la largeur de l'ecran)
  if (derniereHeureAffichee.length() > 0) {
    tft.getTextBounds(derniereHeureAffichee, 0, 0, &x1, &y1, &w, &h);
    int xAncien = (tft.width() - (int)w) / 2;
    tft.fillRect(xAncien - 2, 46, w + 4, h + 4, COULEUR_FOND);
  }

  texteCentre(nouvelleHeure, 50, COULEUR_TEXTE, 4);
  derniereHeureAffichee = nouvelleHeure;

  // La date ne se dessine qu'une seule fois (elle ne change pas seconde par seconde)
  if (!dateAffichee || forcer) {
    char bufDate[11];
    strftime(bufDate, sizeof(bufDate), "%d/%m/%Y", &timeinfo);
    tft.fillRect(0, 92, tft.width(), 16, COULEUR_FOND);
    texteCentre(String(bufDate), 92, COULEUR_TEXTE_2, 1);
    dateAffichee = true;
  }
}

void afficherAccueil() {
  // Ne pas ecraser l'ecran erreur si une erreur est encore active
  if (ecranErreurActif) return;

  ledOff(); // Eteint toutes les LEDs une fois de retour sur l'ecran d'accueil
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete(NOM_ENTREPRISE, 1);
  dessinerEmpreinte(tft.width() / 2, 155, 46);
  texteCentre("POSEZ VOTRE DOIGT", 218, COULEUR_TEXTE_2, 2);

  ecranAccueil = true;
  derniereHeureAffichee = "";
  dateAffichee = false;
  mettreAJourHorloge(true);
}

void afficherStatutConnexion() {
  // Statut masque de l'ecran d'accueil selon la demande utilisateur
  return;
}

void afficherEcranIPs() {
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("ADRESSES DE CONNEXION", 2);

  // 1. Carte Point d'Acces AP (192.168.4.1)
  tft.fillRoundRect(10, 42, tft.width() - 20, 54, 10, COULEUR_CARTE);
  tft.drawRoundRect(10, 42, tft.width() - 20, 54, 10, COULEUR_ATTENTE);
  tft.setTextColor(COULEUR_ATTENTE);
  tft.setTextSize(1);
  tft.setCursor(20, 50);
  tft.println("POINT D'ACCES AP (Pointeuse-Config) :");

  tft.setTextColor(COULEUR_TEXTE);
  tft.setTextSize(2);
  tft.setCursor(20, 68);
  tft.println("192.168.4.1");

  // 2. Carte IP Wi-Fi STA
  tft.fillRoundRect(10, 102, tft.width() - 20, 54, 10, COULEUR_CARTE);
  tft.drawRoundRect(10, 102, tft.width() - 20, 54, 10, COULEUR_ACCENT);
  tft.setTextColor(COULEUR_ACCENT);
  tft.setTextSize(1);
  tft.setCursor(20, 110);
  tft.println("IP RESEAU WI-FI (STA) :");

  String ipWifiStr = (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString() : "Non connecte";
  tft.setTextColor(COULEUR_TEXTE);
  tft.setTextSize(2);
  tft.setCursor(20, 128);
  tft.println(ipWifiStr);

  // 3. Carte IP Ethernet
  tft.fillRoundRect(10, 162, tft.width() - 20, 54, 10, COULEUR_CARTE);
  tft.drawRoundRect(10, 162, tft.width() - 20, 54, 10, COULEUR_SUCCES);
  tft.setTextColor(COULEUR_SUCCES);
  tft.setTextSize(1);
  tft.setCursor(20, 170);
  tft.println("IP CABLE ETHERNET (RJ45) :");

  String ipEthStr = (ethernetActif && Ethernet.linkStatus() == LinkON) ? Ethernet.localIP().toString() : "Non connecte";
  tft.setTextColor(COULEUR_TEXTE);
  tft.setTextSize(2);
  tft.setCursor(20, 188);
  tft.println(ipEthStr);

  dessinerBarreAide("Touche = Quitter / Retour");

  unsigned long start = millis();
  while (millis() - start < 15000) {
    wm.process();
    gererServeurWebEthernet();
    char k = keypad.getKey();
    if (k) break;
    yield();
    delay(20);
  }

  afficherAccueil();
}

void afficherEcranErreurReseau(String titre, String raison) {
  ecranAccueil = false;
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete(titre, 2);

  int cy = 85;
  dessinerCroix(tft.width() / 2, cy, 26);

  texteCentre("CONNEXION IMPOSSIBLE", 138, COULEUR_ERREUR, 2);
  texteMultiLignesMots(raison, 172, COULEUR_TEXTE_2, 1, 16);

  dessinerBarreAide("#=Reconfigurer WiFi   *=Reessayer");
}

void afficherResultatReconnaissance(String jsonReponse) {
  ecranAccueil = false;
  DynamicJsonDocument doc(1024);
  DeserializationError err = deserializeJson(doc, jsonReponse);

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("POINTAGE", 2);

  if (err) {
    dessinerCroix(tft.width() / 2, 95, 20);
    texteCentre("ERREUR SERVEUR", 148, COULEUR_ERREUR, 2);
    texteCentre("Reponse invalide", 178, COULEUR_TEXTE_2, 1);
    return;
  }

  String nom = doc.containsKey("name") ? doc["name"].as<String>() : "";

  // 1. Si le serveur renvoie une erreur ou un message de refus (Pointage refuse, Hors contrat, Trop tot, etc.)
  if (doc.containsKey("error") || doc.containsKey("err")) {
    String msgErreur = doc.containsKey("error") ? doc["error"].as<String>() : doc["err"].as<String>();
    dessinerCroix(tft.width() / 2, 95, 20);

    if (nom.length() > 0) {
      texteCentre(nom, 142, COULEUR_TEXTE, 2);
      if (msgErreur.indexOf("hors contrat") >= 0 || msgErreur.indexOf("Hors contrat") >= 0) {
        texteCentre("HORS CONTRAT", 168, COULEUR_ERREUR, 2);
      } else {
        texteCentre("POINTAGE REFUSE", 168, COULEUR_ERREUR, 2);
      }
      texteMultiLignesMots(msgErreur, 194, COULEUR_TEXTE_2, 1, 16);
    } else {
      if (msgErreur.indexOf("hors contrat") >= 0 || msgErreur.indexOf("Hors contrat") >= 0) {
        texteCentre("HORS CONTRAT", 146, COULEUR_ERREUR, 2);
      } else {
        texteCentre("POINTAGE REFUSE", 146, COULEUR_ERREUR, 2);
      }
      texteMultiLignesMots(msgErreur, 178, COULEUR_TEXTE_2, 1, 16);
    }
    return;
  }

  if (nom.length() == 0) {
    dessinerCroix(tft.width() / 2, 95, 20);
    texteCentre("EMPREINTE INCONNUE", 146, COULEUR_ERREUR, 2);
    texteCentre("Aucun employe lie", 178, COULEUR_TEXTE_2, 1);
    return;
  }

  // 2. Si le serveur valide le pointage
  String type = doc["type"] | "entree";
  String label = doc["label"] | "";
  String heure = doc["heure"] | "";
  String statutServeur = doc["statut"] | "";
  String msgServeur = doc["message"] | "";

  uint16_t couleur = COULEUR_SUCCES;
  String statutTxte = "ENTREE";

  if (type == "sortie") {
    couleur = COULEUR_ACCENT;
    statutTxte = "SORTIE";
  } else if (type == "entree") {
    statutTxte = "ENTREE";
  }

  // Si le serveur fournit un label d'événement (ex: Entrée Début Service, Sortie Repas, etc.)
  if (label.length() > 0) {
    statutTxte = label;
    statutTxte.toUpperCase();
  }

  if (type == "deja_complet") {
    dessinerHorloge(tft.width() / 2, 92, 20);
    couleur = COULEUR_ATTENTE;
    statutTxte = "COMPLET";
  } else {
    dessinerCheck(tft.width() / 2, 92, 20);
  }

  // Affichage du Nom de l'employe (Centre)
  texteCentre(nom, 142, COULEUR_TEXTE, 2);

  // Badge/pill de statut dynamique avec taille adaptée pour libellés longs
  uint8_t taillePill = 2;
  tft.setTextSize(2);
  int16_t x1, y1;
  uint16_t w, h;
  tft.getTextBounds(statutTxte, 0, 0, &x1, &y1, &w, &h);

  if (w > 260) {
    taillePill = 1;
    tft.setTextSize(1);
    tft.getTextBounds(statutTxte, 0, 0, &x1, &y1, &w, &h);
  }

  int pillW = w + 24;
  int pillH = h + 10;
  int pillX = (tft.width() - pillW) / 2;
  int pillY = 172;
  tft.fillRoundRect(pillX, pillY, pillW, pillH, pillH / 2, couleur);
  texteCentre(statutTxte, pillY + (taillePill == 2 ? 5 : 6), COULEUR_FOND, taillePill);

  // Heure + Statut / Message exact (Pas de statut À l'heure/Retard sur les sorties)
  String ligneAide = "";
  if (heure.length() > 0) ligneAide += heure;
  if (statutServeur.length() > 0) ligneAide += " (" + statutServeur + ")";
  else if (msgServeur.length() > 0 && msgServeur != label) ligneAide += " - " + msgServeur;

  if (ligneAide.length() > 0) {
    texteCentre(ligneAide, pillY + pillH + 6, COULEUR_TEXTE_2, 1);
  }
}

void modeConfigCallback(WiFiManager *monWm) {
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("CONFIGURATION WIFI", 1);

  int x0 = 14;
  int y = 52;

  auto etape = [&](const char* num, const char* ligne1, const char* ligne2, uint16_t couleurLigne2) {
    tft.fillCircle(x0 + 8, y + 6, 9, COULEUR_ACCENT);
    tft.setTextSize(1);
    tft.setTextColor(COULEUR_FOND);
    tft.setCursor(x0 + 5, y + 2);
    tft.println(num);

    tft.setTextColor(COULEUR_TEXTE);
    tft.setCursor(x0 + 26, y);
    tft.println(ligne1);

    if (ligne2 != nullptr) {
      tft.setTextSize(1);
      tft.setTextColor(couleurLigne2);
      tft.setCursor(x0 + 26, y + 15);
      tft.println(ligne2);
      y += 40;
    } else {
      y += 25;
    }
  };

  etape("1", "Connectez-vous au reseau :", "Pointeuse-Config", COULEUR_ACCENT);
  etape("2", "Ouvrez un navigateur", "puis choisissez votre WiFi", COULEUR_TEXTE_2);
}