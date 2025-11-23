// Geburtstage.js 23.10.2025


//-----------------------------------------------
function geburtstageOeffnen() {
//-----------------------------------------------
    // 1. Ansicht initialisieren und filtern
    updateGeburtstageView();

    // 2. Overlay anzeigen
    document.getElementById("overlayGeburtstage").style.display = "flex";
}

//-----------------------------------------------
function updateGeburtstageView() {
//-----------------------------------------------
    const titel = "Geburtstage der Tafel-Helfer";
    // Umrechnung der Wochen in Tage
    const GeburtsdatumTagevoraus = GeburtsdatumWochenvoraus * 7;
    
    // 1. Daten filtern
    const gefilterteDaten = filterGeburtstageByTageVoraus(alleGeburtstageCache, GeburtsdatumTagevoraus);

    // 2. Liste rendern
    showOverlayGeburtstage(titel, gefilterteDaten);
}


//---------------------------------------------------------------------------------------------
function filterGeburtstageByTageVoraus(alleGeburtstage, tageVoraus) {
//---------------------------------------------------------------------------------------------
/**
 * Filtert die Liste aller Geburtstage auf diejenigen, die in den nächsten tageVoraus Tagen anstehen, 
 * und fasst sie monatsweise zusammen. 
 * Gibt eine FLACHE Liste zurück, in die Monats-Header-Objekte zur Darstellung injiziert wurden.
 * * @param {Array<Object>} alleGeburtstage Die ungefilterte Liste aller Helfer-Geburtstage.
 * @param {number} tageVoraus Die Anzahl der Tage, die in die Zukunft geblickt werden soll.
 * @returns {Array<Object>} Eine flache Liste von Objekten, die entweder ein Header-Objekt ({ isHeader: true, ... })
 * oder ein Geburtstags-Objekt ({ Name: '...', Geburtstag: '...' }) sind.
 */
    const heute = new Date();
    // Setze die Uhrzeit auf 00:00:00, um Rundungsfehler zu vermeiden
    heute.setHours(0, 0, 0, 0); 

    // Temporäre Liste, die alle benötigten Daten (inkl. _sortDatum) speichert
    const gefilterteListe = [];

    alleGeburtstage.forEach(eintrag => {
        // Geburtsdatum aus dem String holen (ohne Jahr)
        const parts = eintrag.GeburtsmonatTag.split('.'); // Erwartet tt.mm.

        // Das Jahr vom heutigen Datum nehmen
        const aktuellesJahr = heute.getFullYear();
        
        // Datum für das aktuelle Jahr erstellen
        // Wichtig: Monate sind 0-basiert!
        let geburtstagDiesesJahr = new Date(aktuellesJahr, parseInt(parts[1]) - 1, parseInt(parts[0]));
        
        // Wenn das Datum ungültig ist, überspringen
        if (isNaN(geburtstagDiesesJahr.getTime())) return;
        
        // Wenn der Geburtstag dieses Jahr schon VOR heute liegt, nimm das nächste Jahr
        // (Vergleicht nur Datum, da beide auf 00:00:00 gesetzt sind)
        if (geburtstagDiesesJahr < heute) {
            geburtstagDiesesJahr.setFullYear(aktuellesJahr + 1);
        }
        
        // Berechne die Differenz in Tagen (Aufrunden auf den nächsten vollen Tag)
        const msInDay = 1000 * 60 * 60 * 24;
        // Die Differenz zwischen den beiden 00:00:00 Daten berechnen
        const differenzTage = Math.ceil((geburtstagDiesesJahr.getTime() - heute.getTime()) / msInDay);

        // Filter anwenden: Muss heute (0) oder in den nächsten 'tageVoraus' Tagen sein
        if (differenzTage >= 0 && differenzTage <= tageVoraus) {
            
            // Formatierung (optional: nur Tag und Monat)
            const formatierterGeburtstag = eintrag.GeburtsmonatTag.slice(0, 5); // tt.mm.
            
            gefilterteListe.push({
                Name: eintrag.Name,
                Geburtstag: formatierterGeburtstag, // tt.mm.
                _sortDatum: geburtstagDiesesJahr // Zum Sortieren und Gruppieren
            });
        }
    });

    // 1. Nach Datum sortieren (damit die Geburtstage innerhalb des Monats chronologisch sind)
    gefilterteListe.sort((a, b) => a._sortDatum.getTime() - b._sortDatum.getTime());

    // 2. Gruppieren nach Monat (temporär)
    const monatsNamen = [
        "Januar", "Februar", "März", "April", "Mai", "Juni", 
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    const gruppierteGeburtstageMap = new Map(); // Map<Monatsname, Array<BirthdayObject>>

    gefilterteListe.forEach(eintrag => {
        // Monatsindex (0-11) aus dem sortierten Datum
        const monatsIndex = eintrag._sortDatum.getMonth(); 
        const monatsName = monatsNamen[monatsIndex];

        // Finales Objekt für die Liste (ohne das temporäre Sortierfeld)
        const geburtstagsEintrag = {
            Name: eintrag.Name,
            Geburtstag: eintrag.Geburtstag, // tt.mm.
        };

        if (!gruppierteGeburtstageMap.has(monatsName)) {
            gruppierteGeburtstageMap.set(monatsName, []);
        }
        gruppierteGeburtstageMap.get(monatsName).push(geburtstagsEintrag);
    });

    // 3. Konvertiere die Map in das finale, abgeflachte Array-Format mit Headern
    const ergebnisArrayMitHeadern = [];
    for (const [monatName, geburtstage] of gruppierteGeburtstageMap.entries()) {
        
        // Header-Objekt einfügen
        ergebnisArrayMitHeadern.push({
            isHeader: true,
            MonatsName: monatName,
            Anzahl: geburtstage.length
        });

        // Geburtstage einfügen
        geburtstage.forEach(geburtstag => {
            ergebnisArrayMitHeadern.push({
                Name: geburtstag.Name,
                Geburtstag: geburtstag.Geburtstag
            });
        });
    }

    return ergebnisArrayMitHeadern;
}


//-----------------------------------------------
function showOverlayGeburtstage(titel, geburtstageArray) {
//-----------------------------------------------
/**
 * Rendert die Geburtstage in die Tabelle, kann jetzt auch Header-Zeilen verarbeiten.
 * HINWEIS: Im realen Code muss sichergestellt werden, dass die HTML-Elemente existieren.
 */
    // Dummy-Elemente für die Konsolenausgabe im Beispiel
    const doc = (typeof document !== 'undefined') ? document : { getElementById: () => ({ textContent: '', innerHTML: '', appendChild: () => {} }), createElement: (tag) => ({ tag: tag, innerHTML: '', className: '' }) };
    
    doc.getElementById("overlayGeburtstage-title").textContent = titel;

    const geburtstageTable = doc.getElementById("scrollboxGeburtstage-table");
    geburtstageTable.innerHTML = "";

    geburtstageArray.forEach(eintrag => {
        const row = doc.createElement("tr");

        if (eintrag.isHeader) {
            // Header-Zeile: Monatsname, der beide Spalten überspannt
            row.className = "month-header"; // Für besseres Styling im CSS
            row.innerHTML = `<td colspan="2"><strong>${eintrag.MonatsName} (${eintrag.Anzahl}):</strong></td>`;
        } else {
            // Reguläre Geburtstags-Zeile
            row.innerHTML = `<td>${eintrag.Name}</td><td>${eintrag.Geburtstag}</td>`;
        }
        geburtstageTable.appendChild(row);
    });
}

