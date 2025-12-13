// Rapport.js 23.11.2025

const WOCHENTAGE_KUERZEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

//-----------------------------------------------
async function tagesRapportOeffnen() {
//-----------------------------------------------
    const Anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];
    const titel = "Tagesrapport für " + aktTermin;

    // 1. Das Overlay öffnen und die Scrollbox laden
    document.getElementById("preview-toggle").checked = false;
    toggleRapportView();
    loadRapportScrollbox(titel, Anmeldungen);
    // Öffnet das Overlay
    document.getElementById("overlayRapport").style.display = "flex";

    // 2. *WICHTIG:* Warten Sie, bis das Rapport-Blatt aktualisiert wurde
    // (die Promise-Kette von createRapport() ist beendet).
    try {
        await createRapport();
        console.log("createRapport ist abgeschlossen, lade Preview...");

        // 3. Erst wenn createRapport() fertig ist, wird die Preview geladen
        loadRapportPreview();

    } catch (error) {
        console.error("Rapport-Erstellung oder Preview-Laden fehlgeschlagen:", error);
        // Hier könnten Sie dem Benutzer eine Fehlermeldung anzeigen
        const meldungElement = document.getElementById(`export_meldung`);
        meldungElement.textContent = `Fehler beim Erstellen des Rapports: ${error.message || error}`;
        // Sicherstellen, dass die Lade-Anzeige für die Preview bei einem Fehler nicht hängen bleibt
        document.getElementById(`export_meldung`).textContent = " ";
    }
}
//-----------------------------------------------
function loadRapportScrollbox(titel, anmeldungenArray) {
//-----------------------------------------------
  document.getElementById("overlayRapport-title").textContent = titel;
  document.getElementById(`export_meldung`).textContent =  " ";

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

      console.log("loadRapportScrollbox: Anzahl namentlicheAbmeldungenCache:", aktTerminIndex, anzAbmeldungen );
      console.log("loadRapportScrollbox:", aktTerminIndex, abmeldeFunktionen);

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

//-----------------------------------------------
function createRapport() {
//-----------------------------------------------
// "createRapport()" gibt jetzt das Promise des apiCall zurück!
    const abmeldeListen = buildAbmeldeListe(namentlicheAbmeldungenCache[aktTerminIndex]);
    console.log("createRapport, abmeldeListen:", abmeldeListen);
    const anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];

    const geburtstagsliste = buildGeburtstagsListe(aktTermin, alleGeburtstageCache);
    console.log("geburtstagsliste: ", geburtstagsliste);

    apiCall('updateSheetRapportMeldungen', {
    termin: aktTermin,
    anmeldungen: anmeldungen,
    abmeldungen: abmeldeListen,
    geburtstage: geburtstagsliste
  })
  .then(response => {
    console.log("Rapport erfolgreich erstellt:", response);
    return response; // Gib die Antwort weiter
  })
  .catch(error => {
    console.error("Fehler beim Erstellen des Rapports:", error);
    throw error;
  });
}

// ----------------------------------
async function downloadLinkRapport() {
// ----------------------------------
  const spinnerId = 'export_meldung'; 
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
  const spinnerId = 'export_meldung'; 
  const sheetName = "Tagesrapport";
  const rapportname = createRapportName(aktTermin);
  const filename = rapportname + ".xlsx";

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

//-----------------------------------------------
function createRapportName(dateStringDE) {
//-----------------------------------------------
    dateStringISO = changeDateDEtoISO(dateStringDE);
    dateStringKW = changeDateISOtoKW(dateStringISO);
    return `Rapport ${dateStringKW} (${dateStringDE})`
}
//----------------------------------
function getWeekAndDay(dateString) {
//----------------------------------
/**
 * Berechnet die ISO-Kalenderwoche (KW) und den Wochentag (als Kürzel)
 * für ein gegebenes Datum.
 * @param {string} dateString Datum im Format JJJJ-MM-TT.
 * @returns {{year: number, weekNo: string, dayKuerzel: string} | null}
 */
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;

    // --- Wochentag (Kürzel) ---
    const dayIndex = d.getDay(); // JS standard: 0=So, 1=Mo, 2=Di, ...
    const dayKuerzel = WOCHENTAGE_KUERZEL[dayIndex];

    // --- KW Calculation (ISO 8601 standard: Woche beginnt Mo) ---
    const date = new Date(d.valueOf());
    // Anchor auf den nächsten Donnerstag setzen (ISO Standard)
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));

    // Ersten Tag des Jahres holen
    const yearStart = new Date(date.getFullYear(), 0, 1);
    
    // KW berechnen (Millisekunden in Tage umrechnen)
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    
    // Das Jahr (kann sich durch KW-Berechnung ändern)
    const year = date.getFullYear();

    return { 
        year, 
        weekNo: String(weekNo).padStart(2, '0'), // Zweistellig formatieren
        dayIndex, // 0 bis 6
        dayKuerzel // NEU: Kürzel (So, Mo, Di, ...)
    };
}

//----------------------------------
function changeDateISOtoKW(dateStringISO) {
//----------------------------------
/**
 * Generiert die das Datum im KW-Format JJJJ-KW-Wochentag (z.B. 2025-47.4).
 * @param {string} dateStringISO Datum im ISO Format JJJJ-MM-TT.
 * @returns {string} Datum im KW-Format JJJJ-KW-Wochentag (z.B. 2025-47.4).
 */
    const result = getWeekAndDay(dateStringISO);
    if (!result) return 'INVALID_ID';
    
    return `${result.year}-${result.weekNo}.${result.dayIndex}`;
}


//----------------------------------
function changeDateDEtoISO(dateStringDE) {
//----------------------------------
/**
 * Konvertiert einen Datum-String vom deutschen Format (TT.MM.JJJJ) 
 * in das ISO-Format (JJJJ-MM-TT).
 * * @param {string} dateStringDE Datum im Format TT.MM.JJJJ (z.B. "25.12.2025").
 * @returns {string | null} Das Datum im Format JJJJ-MM-TT (z.B. "2025-12-25") 
 * oder null, falls das Format ungültig ist.
 */

    if (!dateStringDE || typeof dateStringDE !== 'string') {
        return null;
    }
    
    // Regulärer Ausdruck, um TT, MM und JJJJ zu extrahieren
    // Erwartet: Ziffern.Ziffern.Ziffern (mind. 1, 1, 4)
    const parts = dateStringDE.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

    if (!parts) {
        // Ungültiges Format (z.B. fehlende Punkte, falsche Reihenfolge)
        console.error("Ungültiges deutsches Datumsformat. Erwartet: TT.MM.JJJJ");
        return null;
    }

    // parts[1] = Tag (TT)
    // parts[2] = Monat (MM)
    // parts[3] = Jahr (JJJJ)
    
    const day = parts[1].padStart(2, '0');    // Sicherstellen, dass der Tag zweistellig ist (z.B. "1" -> "01")
    const month = parts[2].padStart(2, '0');  // Sicherstellen, dass der Monat zweistellig ist
    const year = parts[3];

    // Neu zusammensetzen im Format JJJJ-MM-TT
    return `${year}-${month}-${day}`;
}


//-----------------------------------------------
function buildGeburtstagsListe(terminString, alleGeburtstage) {
//-----------------------------------------------
/**
 * Erstellt eine formatierte Liste bevorstehender Geburtstage (max. 4 pro Zeile)
 * innerhalb des Fensters von 2 Wochen ZURÜCK bis 4 Wochen VORAUS ab dem Termin.
 *
 * @param {string} terminString - Der zentrale Termin (z.B. "01.01.2026") als String (dd.MM.yyyy).
 * @param {Array<Object>} alleGeburtstage - Liste von Geburtstagsobjekten aus getAllGeburtstage().
 * @returns {Array<Array<string>>} Ein 2D-Array von Strings für setValues.
 */

    const NAMES_PER_LINE = 3;
    const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
    
    // 1. Definiere das Filterfenster (2 Wochen zurück, 4 Wochen voraus)
    const terminParts = terminString.split('.');
    if (terminParts.length !== 3) {
        Logger.log("FEHLER: Ungültiges Terminformat (erwartet: dd.MM.yyyy).");
        return [];
    }

    // Zentrales Datum
    const centralDate = new Date(terminParts[2], parseInt(terminParts[1]) - 1, terminParts[0]);
    if (isNaN(centralDate.getTime())) {
        Logger.log("HINWEIS: Ungültiger Termin.");
        return [];
    }
    
    // Startdatum des Fensters (INKLUSIVE): 14 Tage vor dem centralDate
    const windowStartDate = new Date(centralDate.getTime() - (14 * MILLISECONDS_IN_DAY)); 
    // Enddatum des Fensters (EXKLUSIVE): 28 Tage nach dem centralDate
    const windowEndDate = new Date(centralDate.getTime() + (28 * MILLISECONDS_IN_DAY));

    if (!alleGeburtstage || alleGeburtstage.length === 0) {
        Logger.log("HINWEIS: Leere Geburtstagsliste.");
        return [];
    }

    // 2. Filtern und Sortieren der relevanten Geburtstage
    const relevanteGeburtstage = [];

    alleGeburtstage.forEach(geburtstag => {
        // Geburtsdatum parsen (wir verwenden nur Tag und Monat)
        const datumParts = geburtstag.GeburtsmonatTag.split('.'); // tt.mm.
        const tag = parseInt(datumParts[0]);
        const monat = parseInt(datumParts[1]) - 1; // 0-basiert
        
        if (isNaN(tag) || isNaN(monat)) return;

        // Wir müssen prüfen, ob der Geburtstag in EINEM der letzten/nächsten Jahre in unser Fenster fällt.
        // Wir prüfen das aktuelle Jahr (centralDate.getFullYear()), das Jahr davor und das Jahr danach.

        for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
            const geburtstagJahr = centralDate.getFullYear() + yearOffset;
            let geburtstagDatum = new Date(geburtstagJahr, monat, tag);

            // Prüfen, ob das Datum in unser 6-Wochen-Fenster fällt [windowStartDate, windowEndDate)
            if (geburtstagDatum >= windowStartDate && geburtstagDatum < windowEndDate) {
                // Füge den Geburtstag nur einmal hinzu und wähle die korrekte Jahreszahl für die Sortierung
                // Da der Geburtstag im Spreadsheet nur Tag/Monat enthält, speichern wir den Namen 
                // mit dem Datum, das innerhalb des Fensters liegt.
                relevanteGeburtstage.push({
                    Name: geburtstag.Name,
                    Datum: `${String(tag).padStart(2, '0')}.${String(monat + 1).padStart(2, '0')}`,
                    Sortierdatum: geburtstagDatum.getTime() // Zeitstempel für die Sortierung
                });
                break; // Datum gefunden, Schleife beenden
            }
        }
    });

    // Sortiere die Geburtstage chronologisch nach dem Datum
    relevanteGeburtstage.sort((a, b) => a.Sortierdatum - b.Sortierdatum);

    // 3. Gruppierung in Zeilen (max. 4 pro Zeile)
    const resultLists = [];
    let currentList = [];
    
    relevanteGeburtstage.forEach((geburtstag, index) => {
        // Format: "Vorname Nachname (TT.MM)"
        const formattedName = `${geburtstag.Name} (${geburtstag.Datum})`;
        currentList.push(formattedName);
        
        // Wenn NAMES_PER_LINE erreicht ist ODER es das letzte Element ist
        if (currentList.length === NAMES_PER_LINE || index === relevanteGeburtstage.length - 1) {
            resultLists.push([currentList.join(', ')]);
            currentList = [];
        }
    });

    // 4. Rückgabe des 2D-Arrays
    return resultLists;
}

//---------------------------------------------------------------------------------------------
function loadRapportPreview() {
//---------------------------------------------------------------------------------------------
    console.log(" --> loadRapportPreview");
    // 1. Lade-Anzeige im Container setzen
    const container = document.getElementById("previewContainer");
    container.innerHTML = "<p>Lade Rapport-Daten...</p>";

    const spinnerId = 'export_meldung'; 
    showLoadingSpinner(spinnerId, "Previewdaten werden geladen...");


    // 2. API-Aufruf starten
    apiCall('getSheetDataForRapportPreview', {}) 
        .then(result => {
            if (result) {
//                document.getElementById('overlayRapportPreview-title').textContent = `Vorschau: ${result.sheetName}`;
                console.log(`loadRapportPreview-Vorschau: ${result.sheetName}`);

                renderSheetData (result);
            } else {
                container.innerHTML = "<p>FEHLER: Die erwarteten Daten wurden nicht empfangen.</p>";
                console.log("FEHLER: Die erwarteten Daten wurden nicht empfangen.");

            }
        })
        .catch(error => {
            console.error("Fehler beim Laden der Rapport-Vorschau:", error);
            container.innerHTML = `<p class="error">FEHLER: ${error.message}</p>`;
            document.getElementById(`export_meldung`).textContent =  " ";

        });
}

//---------------------------------------------------------------------------------------------
function renderSheetData(result) {
//---------------------------------------------------------------------------------------------
    console.log(" --> renderSheetData");
    const spinnerId = 'export_meldung'; 
    showLoadingSpinner(spinnerId, "Previewdaten werden gerendert...");

    // 1. Daten entpacken und Konfiguration vorbereiten
    const { 
        data, mergedCells, percentageWidth,
        backgrounds, fontWeights, fontSizes, fontFamilies, horizontalAlignments 
    } = result;
    
    // Prüfen, ob Daten vorhanden sind
    if (!data || data.length === 0) {
        document.getElementById('previewContainer').innerHTML = "<p>Keine Daten für die Vorschau gefunden.</p>";
        return;
    }

    const container = document.getElementById('previewContainer');
    container.innerHTML = ''; 
    
    const table = document.createElement('table');
    table.classList.add('preview-table');
    
    // Hilfs-Array, um überdeckte Zellen zu markieren (1-basiert)
    const coveredCells = {}; 
    
    // 2. Erstellen der Colgroup für Spaltenbreiten (Strategie B)
    const colgroup = document.createElement('colgroup');

    percentageWidth.forEach(width => {
        const col = document.createElement('col');
        // Breite in Prozent setzen
        const pW = width;
        col.style.width = `${pW.toFixed(2)}%`; 
        colgroup.appendChild(col);
    });
    table.appendChild(colgroup);

    // 3. Tabellenzellen iterieren
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        // Zeilennummer (1-basiert)
        const sheetRowIndex = rowIndex + 1; 
        
        row.forEach((cellValue, cellIndex) => {
            // Spaltennummer (1-basiert)
            const sheetColIndex = cellIndex + 1; 

            // 3a. Prüfen, ob die Zelle übersprungen werden muss
            if (coveredCells[`${sheetRowIndex}-${sheetColIndex}`]) {
                return;
            }

            let cellElement;
            const isHeader = rowIndex === 0;
            
            // Standardmäßig TD verwenden, TH nur für die erste Zeile
            cellElement = isHeader ? document.createElement('th') : document.createElement('td');

            // 3b. Merged Cells (Verbundene Zellen) Logik
            const mergedRange = mergedCells.find(mr => 
                mr.startRow === sheetRowIndex && mr.startCol === sheetColIndex
            );

            if (mergedRange) {
                // Setze colspan/rowspan und markiere überdeckte Zellen
                cellElement.setAttribute('colspan', mergedRange.numCols);
                cellElement.setAttribute('rowspan', mergedRange.numRows);

                for (let r = 0; r < mergedRange.numRows; r++) {
                    for (let c = 0; c < mergedRange.numCols; c++) {
                        if (r !== 0 || c !== 0) {
                            coveredCells[`${sheetRowIndex + r}-${sheetColIndex + c}`] = true;
                        }
                    }
                }
            }
            
            // 3c. Formatierungen (Inline-Styles) anwenden
            const cellStyle = cellElement.style;
            
            // 1. Hintergrundfarbe
            cellStyle.backgroundColor = backgrounds[rowIndex][cellIndex];
            
            // 2. Schriftgröße und -stil
            const originalSize = parseFloat(fontSizes[rowIndex][cellIndex]);
            if (!isNaN(originalSize)) {
                // Skalierung: 52% Reduzierung => Faktor 0.48)
                const scaledSize = originalSize * 0.48; 
                cellStyle.fontSize = scaledSize.toFixed(1) + 'pt'; 
            }
            
            cellStyle.fontWeight = fontWeights[rowIndex][cellIndex];    
            cellStyle.fontFamily = fontFamilies[rowIndex][cellIndex];
            
            // 3. Ausrichtung
            cellStyle.textAlign = horizontalAlignments[rowIndex][cellIndex].toLowerCase();
            
            // 4. Textinhalt setzen und an die Zeile anhängen
            let displayValue = cellValue;
            
            if (cellValue === null || cellValue === undefined) {
                displayValue = '';
            }
            cellElement.textContent = displayValue; // Der formatierte Wert wird zugewiesen
            tr.appendChild(cellElement);

        });
        
        table.appendChild(tr);
    });

    // 4. Tabelle in den Container einfügen
    container.appendChild(table);

    console.log(" --> renderSheetData beendet");
    document.getElementById(`export_meldung`).textContent =  " ";

}

//-----------------------------------------------
function toggleRapportView() {
//-----------------------------------------------
// Schaltet zwischen der Scrollbox- und der Vorschau-Ansicht um.

  const previewToggle = document.getElementById("preview-toggle");
  const scrollboxView = document.getElementById("scrollbox-view");
  const previewView = document.getElementById("preview-view");

  if (previewToggle.checked) {
    scrollboxView.classList.add("hidden");
    previewView.classList.remove("hidden");

  } else {
    scrollboxView.classList.remove("hidden");
    previewView.classList.add("hidden");
  }
}

//-----------------------------------------------
function xxxtagesRapport() {
//-----------------------------------------------
  const Anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];
  const titel =  "Tagesrapport für " + aktTermin ;

  document.getElementById("preview-toggle").checked = false;
  
  toggleRapportView();
  createRapport();
  loadRapportScrollbox(titel, Anmeldungen);
  loadRapportPreview ();
}

//-----------------------------------------------
function xxxcreateRapport() {
//-----------------------------------------------

    const abmeldeListen = buildAbmeldeListe(namentlicheAbmeldungenCache[aktTerminIndex]);
    console.log("createRapport, abmeldeListen:", abmeldeListen);
    const anmeldungen = namentlicheAnmeldungenCache [aktTerminIndex];

    const geburtstagsliste = buildGeburtstagsListe(aktTermin, alleGeburtstageCache);
    console.log("geburtstagsliste: ", geburtstagsliste);

    apiCall('updateSheetRapportMeldungen', {
    termin: aktTermin,
    anmeldungen: anmeldungen,
    abmeldungen: abmeldeListen,
    geburtstage: geburtstagsliste
  })
  .then(response => {
    console.log("Rapport erfolgreich erstellt:", response);
  })
  .catch(error => {
    console.error("Fehler beim Erstellen des Rapports:", error);
  });
}

