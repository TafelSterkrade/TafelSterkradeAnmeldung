// Helferliste.js 24.10.2025

// Globale Variablen 
let currentSortColumn = 'Name'; // Standardmäßig nach Name (Nachname) sortieren
let sortDirection = 'asc'; // Standardmäßig aufsteigend

// -----------------------------------------------
function helferlisteOeffnen() {
//-----------------------------------------------
  const daten = helferListeCache;

  showOverlayHelferliste(daten);
  
}

//-----------------------------------------------
function showOverlayHelferliste(helferArray) {
//-----------------------------------------------
  const titel = "Helferliste Tafel Sterkrade";
  document.getElementById("overlayHelferliste-title").textContent = titel;

  // Tabelle: Helferliste
  const tableTitle = document.getElementById("scrollboxHelferliste-title");
  tableTitle.textContent = `Helfer: ${helferArray.length}`;

  const tableBody = document.getElementById("scrollboxHelferliste-table");
  tableBody.innerHTML = "";

  helferArray.forEach(eintrag => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${eintrag.Name}</td><td>${eintrag.Vorname}</td><td>${eintrag.Status}</td><td>${eintrag.Mobil}</td>`;
    tableBody.appendChild(row);
  });
  
  updateHelferlisteHeader(); 

  document.getElementById("overlayHelferliste").style.display = "flex";
}

//-----------------------------------------------
function updateHelferlisteHeader() {
//-----------------------------------------------
  // Mappe die internen Sortierspalten-Namen zu den Header-IDs
  const columnMap = {
    'Name': 'header-name',
    'Vorname': 'header-vorname',
    'Status': 'header-status',
    'Mobil': 'header-mobil' // Oder 'Tel', je nach letzter Anpassung
  };

  // Setze das Sortier-Symbol (⮝ oder ⮟)
  const sortSymbol = sortDirection === 'asc' ? ' ▲' : ' ▼';
  
  // Setze alle Pfeile zurück und füge das Symbol zur aktiven Spalte hinzu
  Object.keys(columnMap).forEach(key => {
    const element = document.getElementById(columnMap[key]);
    if (element) {
      // Nur den Text-Content ohne das Sortiersymbol speichern
      const originalText = element.textContent.replace(' ▲', '').replace(' ▼', '').trim();
      
      if (key === currentSortColumn) {
        element.textContent = originalText + sortSymbol;
      } else {
        element.textContent = originalText;
      }
    }
  });
}

//---------------------------------------------------------------------------------------------
function closeOverlayHelferliste() {
//---------------------------------------------------------------------------------------------
  document.getElementById("overlayHelferliste").style.display = "none";
}

//-----------------------------------------------
function sortHelferListe(column) {
//-----------------------------------------------
  // 1. Sortierrichtung bestimmen
  if (currentSortColumn === column) {
    // Spalte ist dieselbe: Richtung wechseln
    sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
  } else {
    // Neue Spalte: Aufsteigend starten
    currentSortColumn = column;
    sortDirection = 'asc';
  }

  // 2. Sortierung anwenden
  helferListeCache.sort((a, b) => {
    const valA = a[column].toLowerCase() || ''; // Fange leere/null Werte ab
    const valB = b[column].toLowerCase() || '';
    
    let comparison = 0;
    if (valA > valB) {
      comparison = 1;
    } else if (valA < valB) {
      comparison = -1;
    }
    
    // Sortierrichtung umkehren, falls 'desc'
    return (sortDirection === 'desc') ? (comparison * -1) : comparison;
  });

  // 3. Overlay mit den sortierten Daten neu rendern
  showOverlayHelferliste(helferListeCache);
}

// Helferliste.js (Geänderte Funktionen)


//-----------------------------------------------
async function downloadLinkHelferliste() {
//-----------------------------------------------
  const spinnerId = 'downloadLink_Helferliste';

  const sheetHelferliste = "$Helferliste";
  const pdfname = "$Helferliste.pdf";
console.log("downloadLinkHelferlistePDF:", pdfname);


  try {
        // 1. Daten auf das GAS-Sheet schreiben
        showLoadingSpinner(spinnerId, "PDF-Export wird vorbereitet.. ");
        const payload = { helferDaten: helferListeCache };
        await apiCall('updateSheetHelferListe', payload);

        // 2. PDF über die bestehende GAS-Funktion exportieren
        showLoadingSpinner(spinnerId, "Download-Link wird erstellt...");

        const downloadUrl = await apiCall('exportSheetToPdfAndGetLink', {
            sheetName: sheetHelferliste,
            options: {headline: true}
        });

        showDownloadLink(spinnerId, pdfname, downloadUrl);


  } catch (error) {
      handleApiError(error, spinnerId, "Fehler beim Erstellen des Download-Links");

  }
}

// ----------------------------------
async function sendmailXLSHelferliste() {
// ----------------------------------
  const aktdatum = new Date().toLocaleDateString('de-DE');

  const spinnerId = 'sendMailXLS_Helferliste'; 
  const sheetName = "$Helferliste";
  const filename = "Helferliste " + aktdatum + ".xlsx";

  console.log("sendmailXLSRapport:", sheetName, filename, formUsername);

  try {
    // 1. Daten auf das GAS-Sheet schreiben
    showLoadingSpinner(spinnerId, "XLS-Export wird vorbereitet.. ");
    const payload = { helferDaten: helferListeCache };
console.log("downloadLinkHelferlistePDF: apiCall('updateSheetHelferListe)");
    await apiCall('updateSheetHelferListe', payload);

    // 2. PDF über die bestehende GAS-Funktion exportieren 
    showLoadingSpinner(spinnerId, "XLSX-Datei wird per E-Mail gesendet...");
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

