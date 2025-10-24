// Rapport.js 21.10.2025

//-----------------------------------------------
function tagesRapport() {
//-----------------------------------------------
  const Anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];
  const titel =  "Tagesrapport für " + aktTermin ;

  showOverlayRapport(titel, Anmeldungen);
  createRapport();
}

//-----------------------------------------------
function showOverlayRapport(titel, anmeldungenArray) {
//-----------------------------------------------
  document.getElementById("overlayRapport-title").textContent = titel;

// Tabelle: Anmeldungen
  const anmeldungenTitle = document.getElementById("scrollboxAnmeldungen-title");
  anmeldungenTitle.textContent = `Anmeldungen: ${anmeldungenArray.length}`;

  const anmeldungenInfo = document.getElementById("scrollboxAnmeldungenInfoFunc");
  anmeldungenInfo.textContent = anmeldeFunktionen;

  const anmeldungenTable = document.getElementById("scrollboxAnmeldungen-table");
  anmeldungenTable.innerHTML = "";
  anmeldungenArray.forEach(eintrag => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${eintrag.name}</td><td>${eintrag.funktion}</td>`;
    anmeldungenTable.appendChild(row);
  });


// Tabelle: ohne Anmeldung
  const Abmeldungen = namentlicheAbmeldungenCache[aktTerminIndex]
  const anzAbmeldungen = Abmeldungen.length
  const abmeldeFunktionen = buildAbmeldeInfo(Abmeldungen)

      console.log("showOverlayRapport: Anzahl namentlicheAbmeldungenCache:", aktTerminIndex, anzAbmeldungen );
      console.log("showOverlayRapport:", aktTerminIndex, abmeldeFunktionen);

  const abmeldungenTitle = document.getElementById("scrollboxAbmeldungen-title");
  abmeldungenTitle.textContent = `ohne Anmeldung: ${anzAbmeldungen}`;

  const abmeldungenInfo = document.getElementById("scrollboxAbmeldungenInfoFunc");
  abmeldungenInfo.textContent = abmeldeFunktionen;

  const abmeldungenTable = document.getElementById("scrollboxAbmeldungen-table");
  abmeldungenTable.innerHTML = "";
  namentlicheAbmeldungenCache [aktTerminIndex].forEach(eintrag => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${eintrag.name}</td><td>${eintrag.funktion}</td>`;
    abmeldungenTable.appendChild(row);
  });
      

  document.getElementById("overlayRapport").style.display = "flex";
}

//---------------------------------------------------------------------------------------------
function closeOverlayRapport() {
//---------------------------------------------------------------------------------------------
  document.getElementById("overlayRapport").style.display = "none";
}

//-----------------------------------------------
function createRapport() {
//-----------------------------------------------

    const abmeldeListen = buildAbmeldeListe(namentlicheAbmeldungenCache[aktTerminIndex]);
    console.log("createRapport, abmeldeListen:", abmeldeListen);
    const anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];

    apiCall('updateSheetRapportMeldungen', {
    termin: aktTermin,
    anmeldungen: anmeldungen,
    abmeldungen: abmeldeListen
  })
  .then(response => {
    console.log("Rapport erfolgreich erstellt:", response);
  })
  .catch(error => {
    console.error("Fehler beim Erstellen des Rapports:", error);
  });
}

// ----------------------------------
async function downloadLinkRapport() {
// ----------------------------------
  const spinnerId = 'downloadLink_Tagesrapport'; // Die ID des Download-Status-Containers
  const sheetRapport = "Tagesrapport";
  const pdfname = "Rapport " + aktTermin + ".pdf";
  const rapportoptions = { hideGridlines: true };

console.log("downloadLinkRapport:", pdfname);

  showLoadingSpinner(spinnerId, "Download-Link wird erstellt...");

  try {
    const downloadUrl = await apiCall('exportSheetToPdfAndGetLink', {
      sheetName: sheetRapport,
      options: {file: pdfname, options: rapportoptions}
    });

    showDownloadLink(spinnerId, pdfname, downloadUrl);

  } catch (error) {
    handleApiError(error, spinnerId, "Fehler beim Erstellen des PDF-Rapports.");
  }
}

// ----------------------------------
async function sendmailXLSRapport() {
// ----------------------------------
  const spinnerId = 'sendMailXLS_Tagesrapport'; 
  const sheetName = "Tagesrapport";
  const filename = "Rapport " + aktTermin + ".xlsx";

  console.log("sendmailXLSRapport:", sheetName, filename, formUsername);

  showLoadingSpinner(spinnerId, "XLSX-Datei wird per E-Mail gesendet...");

  try {
    const result = await apiCall('exportSheetToXlsxAndSendMail', { sheetName, filename, Anmelde: formUsername });

    if (result.success) {
        document.getElementById(spinnerId).innerHTML = result.message

} else {
        handleApiError({ message: "Senden fehlgeschlagen" }, spinnerId, "XLSX-Versand konnte nicht abgeschlossen werden.");
    }
  } catch (error) {
    handleApiError(error, spinnerId, "Fehler beim Erstellen/Senden der XLSX-Datei.");
  }
}


// ----------------------------------
function buildAbmeldeInfo(Abmeldungen) {
// ----------------------------------
    // Sicherstellen, dass der Cache und der Index gültig sind
    if (!Abmeldungen) {
        console.error("Cache oder Terminindex für Abmeldungen ungültig.");
        return "Keine Abmeldungsdaten verfügbar";
    }

    const terminAbmeldungen = Abmeldungen;
    let countAbwesend = 0;
    let countOhneMeldung = 0;

    terminAbmeldungen.forEach(meldung => {
        // Die Funktion ist "abwesend" (explizite Abmeldung)
        if (meldung.funktion.toLowerCase() === "abwesend") {
            countAbwesend++;
        } 
        // Die Funktion ist "" (leer, implizite Abmeldung)
        else if (meldung.funktion === "") {
            countOhneMeldung++;
        }
    });

    // Erstelle die Infostücke
    const abwesendText = `${countAbwesend} Abmeldung${countAbwesend !== 1 ? 'en' : ''}`;
    const ohneMeldungText = `${countOhneMeldung} ohne Meldung`;

    return `${abwesendText}, ${ohneMeldungText}`;
}

//-----------------------------------------------
function formatName(name) {
//-----------------------------------------------
/**
 * Formatiert den Namen von "Nachname, Vorname" zu "Vorname Nachname".
 * @param {string} name - Der Name im Format "Nachname, Vorname".
 * @returns {string} Der Name im Format "Vorname Nachname".
 */

if (!name || name.indexOf(',') === -1) {
        return name; // Rückgabe wie erhalten, falls Format unbekannt
    }
    const parts = name.split(',').map(s => s.trim());
    // Das erste Element ist Nachname (parts[0]), das zweite Vorname (parts[1])
    return `${parts[1]} ${parts[0]}`;
}
// Rapport.js (Geänderte Funktion)

//-----------------------------------------------
function buildAbmeldeListe(Abmeldungen) {
//-----------------------------------------------
    if (!Abmeldungen || Abmeldungen.length === 0) {
        return []; // Wichtig: Leeres Array zurückgeben
    }

    const abwesendeNamen = Abmeldungen
        .filter(meldung => meldung.funktion.toLowerCase() === "abwesend")
        .map(meldung => formatName(meldung.name));
    
    // Konfigurierbare Anzahl von Namen pro Zeile
    const NAMES_PER_LINE = 4; 
    const resultLists = []; // Das neue Array von Strings

    let currentList = [];
    
    // Durchlaufe alle formatierten Namen
    abwesendeNamen.forEach((name, index) => {
        currentList.push(name);
        
        // Wenn wir NAMES_PER_LINE erreicht haben ODER der letzte Name erreicht ist
        if (currentList.length === NAMES_PER_LINE || index === abwesendeNamen.length - 1) {
            // Füge die aktuelle Liste als kommaseparierten String dem Ergebnis-Array hinzu
            resultLists.push([currentList.join(', ')]); // Muss ein 2D-Array [["Liste"]] sein für setValues
            currentList = []; // Liste für die nächste Zeile zurücksetzen
        }
    });

    // Wir geben nun ein 2D-Array von Listen zurück: [["Name1, Name2, Name3, Name4"], ["Name5, Name6", ...]]
    return resultLists; 
}
