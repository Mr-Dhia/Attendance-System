int reconnaitreEmpreinte() {
  keypad.poll();
  uint8_t p = finger.getImage();
  keypad.poll();

  if (p == FINGERPRINT_NOFINGER || p == FINGERPRINT_TIMEOUT || p == FINGERPRINT_PACKETRECIEVEERR)
    return -2;

  if (p != FINGERPRINT_OK) {
    Serial.printf("[RECON] getImage err: 0x%02X\n", p);
    return -1;
  }

  p = finger.image2Tz(1);
  keypad.poll();
  if (p != FINGERPRINT_OK) {
    Serial.printf("[RECON] image2Tz err: 0x%02X\n", p);
    return -1;
  }

  p = finger.fingerFastSearch();
  keypad.poll();
  if (p == FINGERPRINT_NOTFOUND) {
    Serial.println("[RECON] Empreinte posee mais non trouvee en base (NOTFOUND)");
    return -3;
  }

  if (p != FINGERPRINT_OK) {
    Serial.printf("[RECON] fingerFastSearch err: 0x%02X\n", p);
    return -1;
  }

  Serial.printf("[RECON] SUCCES ! ID Empreinte: %d (Confiance: %d)\n", finger.fingerID, finger.confidence);
  return finger.fingerID;
}

bool attendreDoigt(bool present) {
  unsigned long start = millis();
  while (true) {
    keypad.poll();
    char touche = keypad.getKey();
    if (touche == '*') return false;

    uint8_t p = finger.getImage();
    if (present && p == FINGERPRINT_OK) {
      Serial.println("[attendreDoigt] Doigt detecte (FINGERPRINT_OK) !");
      return true;
    }
    if (!present && (p == FINGERPRINT_NOFINGER || p == FINGERPRINT_TIMEOUT || p == FINGERPRINT_PACKETRECIEVEERR)) {
      return true;
    }
    yield();
    delay(10);
  }
}

bool enregistrerEmpreinte(uint8_t id, String employeeId) {
  int p = -1;

  afficherMessage("Placez doigt", ILI9341_BLUE);
  Serial.println("Placez votre doigt");

  // -------- PREMIERE IMAGE --------
  if (!attendreDoigt(true)) {
    afficherMessage("Annule", ILI9341_YELLOW);
    delay(1200);
    return false;
  }

  p = finger.image2Tz(1);

  if (p != FINGERPRINT_OK) {
    afficherMessage("Erreur image", ILI9341_RED);
    delay(1500);
    return false;
  }

  // -------- VERIFICATION EXISTENCE --------
  Serial.println("Verification empreinte...");

  p = finger.fingerFastSearch();

  if (p == FINGERPRINT_OK) {
    Serial.print("Empreinte deja presente ID : ");
    Serial.println(finger.fingerID);

    afficherMessage("Existe ID:" + String(finger.fingerID), ILI9341_RED);
    delay(3500);
    return false;
  }

  Serial.println("Nouvelle empreinte");

  // -------- SUITE ENREGISTREMENT --------
  afficherMessage("Retirez doigt", ILI9341_WHITE);
  delay(1000);

  if (!attendreDoigt(false)) {
    afficherMessage("Annule", ILI9341_YELLOW);
    delay(1200);
    return false;
  }

  afficherMessage("Reposez doigt", ILI9341_BLUE);

  // Deuxieme image
  if (!attendreDoigt(true)) {
    afficherMessage("Annule", ILI9341_YELLOW);
    delay(1200);
    return false;
  }

  p = finger.image2Tz(2);

  if (p != FINGERPRINT_OK) {
    afficherMessage("Erreur image 2", ILI9341_RED);
    delay(1500);
    return false;
  }

  p = finger.createModel();

  if (p != FINGERPRINT_OK) {
    Serial.println("Les deux images sont differentes");

    afficherMessage("Doigts differents", ILI9341_RED);
    delay(2000);

    // Recommencer l'enregistrement
    return enregistrerEmpreinte(id, employeeId);
  }

  p = finger.storeModel(id);

  if (p == FINGERPRINT_OK) {

    Serial.print("Empreinte sauvegardee ID : ");
    Serial.println(id);

    delay(1000);

    envoyerEnroll(id, employeeId);

    afficherMessage("Empreinte OK", ILI9341_GREEN);
    delay(3500);

    return true;

  } else {

    Serial.print("Erreur sauvegarde : ");
    Serial.println(p);

    afficherMessage("Erreur", ILI9341_RED);
    delay(1500);

    return false;
  }
}

void supprimerEmpreinte() {
  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("SUPPRIMER EMPREINTE", 1);
  dessinerEmpreinte(tft.width() / 2, 95, 40);
  dessinerBarreAide("Posez le doigt, ou tapez l'ID + #");

  int id = -1;
  String saisie = "";
  bool modeSaisie = false;

  // Attendre soit une empreinte posee, soit un ID tape au clavier (ou annulation)
  while (id < 0) {
    char touche = keypad.getKey();

    if (touche == '*') {
      afficherMessage("Annule", ILI9341_YELLOW);
      delay(1200);
      return;
    }

    if (touche >= '0' && touche <= '9') {
      modeSaisie = true;
      if (saisie.length() < 3) saisie += touche;
      dessinerChampSaisie("ID a supprimer", saisie, false, COULEUR_ERREUR);
      dessinerBarreAide("#=Valider   *=Annuler   D=Effacer");
    } else if (touche == 'D' && saisie.length() > 0) {
      saisie.remove(saisie.length() - 1);
      dessinerChampSaisie("ID a supprimer", saisie, false, COULEUR_ERREUR);
      dessinerBarreAide("#=Valider   *=Annuler   D=Effacer");
    } else if (touche == '#' && saisie.length() > 0) {
      id = saisie.toInt();
      break;
    }

    if (!modeSaisie) id = reconnaitreEmpreinte();
    delay(100);
  }

  Serial.print("Empreinte trouvee ID : ");
  Serial.println(id);

  tft.fillScreen(COULEUR_FOND);
  dessinerEntete("SUPPRESSION", 2);

  // Verification d'existence : le capteur peut repondre OK a deleteModel()
  // meme sur un slot vide, donc on verifie d'abord qu'un modele y est charge
  if (id < 1 || id > 127 || finger.loadModel(id) != FINGERPRINT_OK) {
    Serial.print("ID inexistant : ");
    Serial.println(id);

    dessinerCroix(tft.width() / 2, 100, 24);
    texteCentre("ID " + String(id), 165, COULEUR_ERREUR, 2);
    texteCentre("inexistant", 190, COULEUR_ERREUR, 2);
    delay(2000);
    return;
  }

  uint8_t p = finger.deleteModel(id);

  if (p == FINGERPRINT_OK) {
    Serial.print("Empreinte ID ");
    Serial.print(id);
    Serial.println(" supprimee");

    String reponse = envoyerMongo(id, "delete");
    bool dissocie = reponse.indexOf("\"dissocie\"") >= 0;

    if (!dissocie) {
      Serial.println("ATTENTION : desassociation serveur non confirmee");
    }

    uint16_t couleurStatut = dissocie ? COULEUR_SUCCES : COULEUR_ATTENTE;
    dessinerCorbeille(tft.width() / 2, 100, 38, couleurStatut);
    texteCentre("Empreinte ID " + String(id), 165, couleurStatut, 2);
    texteCentre(dissocie ? "supprimee" : "capteur seul (verif. reseau)", 190, couleurStatut, 1);
  } else {
    Serial.print("Erreur suppression code : ");
    Serial.println(p);

    dessinerCroix(tft.width() / 2, 100, 24);
    texteCentre("Erreur suppression", 165, COULEUR_ERREUR, 2);
  }

  delay(3500);
}

uint8_t trouverIDLibre() {
  for (uint8_t id = 1; id < 128; id++) {
    uint8_t p = finger.loadModel(id);

    if (p != FINGERPRINT_OK) {
      return id;  // ID disponible trouvé
    }
  }

  return 0;  // mémoire pleine
}


