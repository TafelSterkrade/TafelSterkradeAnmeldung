// Rapport.js 15.08.2025

//-----------------------------------------------
function tagesRapport() {
//-----------------------------------------------
  const daten = namentlicheDatenCache[aktTerminIndex];
  const titel =  "Tagesrapport für " + aktTermin ;

  showOverlayRapport(titel, daten, bevorstehendeGeburtstage);
  createRapport();
}

//-----------------------------------------------
function showOverlayRapport(titel, anmeldungenArray, geburtstageArray) {
//-----------------------------------------------
  document.getElementById("overlayRapport-title").textContent = titel;
//  document.getElementById(`downloadLink_Tagesrapport`).textContent =  " ";

// Tabelle: Anmeldungen
  const anmeldungenTitle = document.getElementById("scrollboxAnmeldungen-title");
  anmeldungenTitle.textContent = `Anmeldungen: ${anmeldungenArray.length}`;

  const anmeldungenTable = document.getElementById("scrollboxAnmeldungen-table");
  anmeldungenTable.innerHTML = "";
  anmeldungenArray.forEach(eintrag => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${eintrag.name}</td><td>${eintrag.funktion}</td>`;
    anmeldungenTable.appendChild(row);
  });

// Tabelle: Geburtstage
  const geburtstageTitle = document.getElementById("scrollboxGeburtstage-title");
  geburtstageTitle.textContent = `anstehende Geburtstage: ${geburtstageArray.length}`;

  const geburtstageTable = document.getElementById("scrollboxGeburtstage-table");
  geburtstageTable.innerHTML = "";
  geburtstageArray.forEach(eintrag => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${eintrag.Name}</td><td>${eintrag.Geburtstag}</td>`;
    geburtstageTable.appendChild(row);
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
  const daten = namentlicheDatenCache[aktTerminIndex];
  apiCall('updateSheetRapport', {
    termin: aktTermin,
    rapportDaten: daten,
    bevorstehendeGeburtstage: bevorstehendeGeburtstage
  })
  .then(response => {
    console.log("Rapport erfolgreich erstellt:", response);
  })
  .catch(error => {
    console.error("Fehler beim Erstellen des Rapports:", error);
  });
}

// ----------------------------------
function downloadLinkRapport() {
// ----------------------------------
  const downloadLinkElement = document.getElementById('downloadLink_Tagesrapport');
  const downloadSpinnerContainer = document.getElementById('download-spinner-container');
  const downloadSpinner = downloadSpinnerContainer.querySelector('.spinner');
  const downloadSpinnerText = document.getElementById('download-spinner-text');

  downloadLinkElement.innerHTML = '';
  downloadSpinnerContainer.classList.remove('hidden');
  downloadSpinnerText.textContent = "Download-Link wird erstellt...";
  downloadSpinner.style.display = 'inline-block';

  const sheetRapport = "Tagesrapport";
  const pdfname = "Rapport " + aktTermin + ".pdf";
  const rapportoptions = { hideGridlines: true };

  apiCall('exportSheetToPdfAndGetLink', {
    sheetName: sheetRapport,
    file: pdfname,
    options: rapportoptions
  })
  .then(function(downloadUrl) {
    downloadSpinnerContainer.classList.add('hidden');
    downloadSpinner.style.display = 'none';

    if (downloadUrl.startsWith("http")) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.textContent = `Klicken zum Herunterladen: "` + pdfname + `"`;
      link.target = '_blank';
      downloadLinkElement.appendChild(link);
    } else {
      downloadLinkElement.textContent = downloadUrl;
    }
  })
  .catch(function(error) {
    downloadSpinnerContainer.classList.add('hidden');
    downloadSpinner.style.display = 'none';
    downloadLinkElement.textContent = "Fehler beim Erstellen des Download-Links.";
    console.error(`Fehler beim Abrufen des Download-Links für ${sheetRapport}:`, error);
  });
}

// ----------------------------------
function downloadLinkXLSRapport() {
// ----------------------------------
  const downloadLinkElement = document.getElementById('downloadLinkXLS_Tagesrapport');
  const downloadSpinnerContainer = document.getElementById('download-spinner-container');
  const downloadSpinner = downloadSpinnerContainer.querySelector('.spinner');
  const downloadSpinnerText = document.getElementById('download-spinner-text');

  downloadLinkElement.innerHTML = '';
  downloadSpinnerContainer.classList.remove('hidden');
  downloadSpinnerText.textContent = "XLSX-Link wird erstellt...";
  downloadSpinner.style.display = 'inline-block';

  const sheetName = "Tagesrapport";
  const filename = "Rapport " + aktTermin + ".xlsx";

  apiCall('exportSheetToXlsxAndGetLink', { sheetName, filename })
  .then(function(downloadUrl) {
    downloadSpinnerContainer.classList.add('hidden');
    downloadSpinner.style.display = 'none';

    if (downloadUrl.startsWith("http")) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.textContent = `Klicken zum Herunterladen: "` + filename + `"`;
      link.target = '_blank';
      downloadLinkElement.appendChild(link);
    } else {
      downloadLinkElement.textContent = downloadUrl;
    }
  })
  .catch(function(error) {
    downloadSpinnerContainer.classList.add('hidden');
    downloadSpinner.style.display = 'none';
    downloadLinkElement.textContent = "Fehler beim Erstellen des XLSX-Links.";
    console.error(`Fehler beim XLSX-Export von ${sheetName}:`, error);
  });
}



