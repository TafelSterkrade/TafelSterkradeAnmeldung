// Form.js 10.12.2025

let formUsername = ''; // Benutzernamen im Formularbereich (wird von der Login-Sektion übergeben)
let terminDaten = [];
let funktionDaten = [];
let alleAnmeldeInfosCache = {}; // Objekt zum Speichern der Anmeldeinformationen
let aktiverFMCButton = null; 
const keineAngabeText = "(keine Angabe)"; 
let namentlicheAnmeldungenCache  = [];
let namentlicheAbmeldungenCache  = [];
let helferListeCache = []; 

let aktTerminIndex = null;
let aktTermin = " ";
let anmeldeFunktionen

const funktiondeutsch = ["Fahrer", "Ausgabe", "Registratur", "abwesend", "(keine Angabe)"];
let TerminFMCIndex = [];

let GeburtsdatumWochenvoraus = 52;
let bevorstehendeGeburtstage = [];
let alleGeburtstageCache = [];


//---------------------------------------------------------------------------------------------
function initFormPage(usernameFromLogin) {
//---------------------------------------------------------------------------------------------

  formUsername = usernameFromLogin;
  console.log("CLIENT: initFormPage aufgerufen für Benutzer:", formUsername);
  document.getElementById("greeting").innerText = `Hallo ${loggedInVollername}`;

  if (GLOBAL_INFO_ABFRAGE_AKTIV) {
    getAdminInfoDecision(); 
  }


  // Schritt 0: Formular-Elemente ausblenden und Overlay anzeigen
  toggleOverlayForm(hide = true); 

  // --- Kritische, sequenzielle Schritte (müssen vor dem Popup abgeschlossen sein) ---
  
  // 1. Alle AnmeldeInfos cachen
  const infoPromise = new Promise((resolve, reject) => {
      setSpinnerState("spinner-infos", true);
      apiCall('getAlleAnmeldeInfos')
        .then(anmeldeInfos => {
          alleAnmeldeInfosCache = anmeldeInfos;
          setSpinnerState("spinner-infos", false);
          resolve();
        })
        .catch(err => {
          setSpinnerState("spinner-infos", false);
          reject(err);
        });
  });

  // 2. Formulardaten für den Benutzer laden und Formular bauen
  const formPromise = new Promise((resolve, reject) => {
      setSpinnerState("spinner-formdata", true);
      apiCall('getFormData', { Anmelde: formUsername })
        .then(formData => {
          setSpinnerState("spinner-formdata", false);
          buildForm(formData); // <--- Hier wird toggleOverlayForm(hide=false) aufgerufen!
          resolve();
        })
        .catch(err => {
          setSpinnerState("spinner-formdata", false);
          reject(err);
        });
  });

  // --- Zusätzliche Hintergrund-Caches (können parallel starten) ---
  
  // Schritt 3: Namentliche Anmeldungen cachen
  setSpinnerState("spinner-anmeldungen", true);
  apiCall('getAlleNamentlichenMeldungen')
    .then(daten => {
      namentlicheAnmeldungenCache = daten.anmeldungen;
      namentlicheAbmeldungenCache = daten.abmeldungen;
      setSpinnerState("spinner-anmeldungen", false);
    })
    .catch(err => {
      console.error("CLIENT FEHLER: Fehler beim Laden der namentlichen Anmeldungen:", err);
      setSpinnerState("spinner-anmeldungen", false);
      showError("⚠️ Fehler beim Laden der Anmeldungen.");
    });
    
  // Schritt 4 + 5: Geburtstage und Helferliste laden (optional, falls sie nicht das Hauptformular blockieren sollen)
  apiCall('getAllGeburtstage', {})
    .then(daten => { alleGeburtstageCache = daten; })
    .catch(err => { console.error("CLIENT FEHLER: Fehler beim Laden der Geburtstage:", err); });

  apiCall('getHelferListe')
    .then(daten => { helferListeCache = daten; })
    .catch(err => { console.error("CLIENT FEHLER: Fehler beim Laden der Helferliste:", err); });
    
  // *** Wichtig ***: Gib ein Promise zurück, das nur auflöst, wenn die KRITISCHEN Daten geladen sind
  return Promise.all([infoPromise, formPromise])
    .then(() => {
        // Wenn alle kritischen Promises erfolgreich waren, wird das Overlay in buildForm 
        // ausgeblendet und die Funktion ist abgeschlossen.
        console.log("CLIENT: initFormPage vollständig abgeschlossen.");
    })
    .catch(error => {
        // Fehlerbehandlung
        showError("⚠️ Kritischer Fehler beim Initialisieren des Formulars.");
        throw error; // Wichtig: Fehler weiterleiten
    });

}

//---------------------------------------------------------------------------------------------
function buildForm(data) {
//---------------------------------------------------------------------------------------------
    console.log("CLIENT: buildForm aufgerufen mit Daten:", data);

    toggleOverlayForm(hide = false)
    
    // Überprüfe, ob Daten vorhanden sind und ob sie Termine und Funktionen enthalten
    if (!data || !data.termine || !data.funktionen || data.termine.length === 0) {
      console.error("CLIENT FEHLER: Keine Termine oder Funktionen in den erhaltenen Daten:", data);
      document.getElementById("status").innerText = "⚠️ Keine Termine oder Funktionen verfügbar.";
      document.getElementById("status").classList.remove("hidden"); // Status anzeigen, falls leer
      return;
    }

    terminDaten = data.termine;
    funktionDaten = data.funktionen.filter(f => f.trim() !== "");

    console.log("CLIENT: Verarbeitete Termine:", terminDaten);
    console.log("CLIENT: Verarbeitete Funktionen:", funktionDaten);

    document.getElementById("termin-options").innerHTML = "";
    document.getElementById("funktion-label").innerText = "Funktion wählen";

    const terminContainer = document.getElementById("termin-options");
    terminDaten.forEach((t, i) => {
      const option = document.createElement("label");
      option.innerHTML = `<input type="radio" name="termin" value="${i}" ${i === 0 ? "checked" : ""} onchange="updateFMCFrage()"> ${t}`;
      terminContainer.appendChild(option);
      TerminFMCIndex[i] = -1
    });

    console.log("CLIENT: Termine im DOM erstellt.");

    updateFMCFrage();
    checkForChanges();
}

//---------------------------------------------------------------------------------------------
function toggleOverlayForm(hide = true) {
//---------------------------------------------------------------------------------------------
  [
    "hinweis-label", 
    "termin-options", 
    "funktion-label", 
    "fmc-options",
    "anmeldeInfo", 
    "anmeldeInfoTermin", 
    "anmeldeInfoFunc", 
    "rapport-button",
    "rapportpreview-button",
    "submit-button", 
    "helferliste-button", 
    "geburtstage-button", 
    "waiting-status", 
    "status", 
    "details"

  ].forEach(id => toggleHidden(id, hide));
  
  toggleHidden("loading-overlay", !hide);
}
//---------------------------------------------------------------------------------------------
function toggleHidden(id, hide) {
//---------------------------------------------------------------------------------------------
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden", hide);
}

//---------------------------------------------------------------------------------------------
function updateFMCFrage() {
//---------------------------------------------------------------------------------------------
// Diese Funktion wird von Index.html aufgerufen, wenn der Login erfolgreich ist
    console.log("CLIENT: updateFMCFrage:", funktionDaten.length);
      const terminIndex = document.querySelector('input[name="termin"]:checked')?.value;
      const terminText = terminDaten[terminIndex];
      const fmcContainer = document.getElementById("fmc-options");
      fmcContainer.innerHTML = "";
      document.getElementById("funktion-label").innerText = `Funktion wählen für ${terminText.split("–")[0].trim()}`;
      const enthalteneFunktion = terminText.includes("–") ? terminText.split("–")[1].trim() : "";
      
      funktionDaten.forEach((fmcText, i) => { // fmcText ist der Text der Funktion, i ist der Index
        if (fmcText.trim() === "") return;

        const fmcButton = document.createElement('fmc-button');
        fmcButton.textContent = fmcText;
        fmcButton.dataset.fmcIndex = i;
        fmcButton.classList.add('fmc-button');

        const isSelected =
          enthalteneFunktion
            ? fmcText.toLowerCase() === enthalteneFunktion.toLowerCase()
            : fmcText.toLowerCase() === keineAngabeText.toLowerCase()
        if (isSelected) {
          fmcButton.classList.add('aktiv');
          aktiverFMCButton = fmcButton; // Den aktiven Button merken
        }

        fmcContainer.appendChild(fmcButton);

        fmcButton.addEventListener('click', function() {
            // Alle Buttons deselektieren (aktiv-Klasse entfernen)
            fmcContainer.querySelectorAll(".fmc-button").forEach(btn => {
                btn.classList.remove('aktiv');
            });
            // Diesen Button selektieren (aktiv-Klasse hinzufügen)
            this.classList.add('aktiv');
            aktiverFMCButton = this; // Den aktuell aktiven Button merken

            updateTerminAntwort()
        });
      });    
      
      updateAnmeldeInfo(); 
}

//---------------------------------------------------------------------------------------------
function updateTerminAntwort() {
//---------------------------------------------------------------------------------------------
      const terminIndex = document.querySelector('input[name="termin"]:checked')?.value;
      const funktion = aktiverFMCButton.textContent

      if (terminIndex !== undefined && funktion !== undefined) {
        const terminContainer = document.getElementById("termin-options");
        const terminLabels = terminContainer.getElementsByTagName("label");
        const terminLabel = terminLabels[terminIndex];
        const terminText = terminDaten[terminIndex];
        const updatedTerminText = `${terminText.split("–")[0].trim()} – ${funktion}`;
        terminLabel.innerHTML = `<input type="radio" name="termin" value="${terminIndex}" checked onchange="updateFMCFrage()"> <span class="changed">${updatedTerminText}</span>`;
        TerminFMCIndex[terminIndex] = aktiverFMCButton.dataset.fmcIndex
//          console.log("**1 updateTerminAntwort terminLabel", terminIndex, terminLabel);
//          console.log("**2 updateTerminAntwort aktiverFMCButton", aktiverFMCButton.dataset.fmcIndex, aktiverFMCButton.textContent);
//          console.log("**3 updateTerminAntwort TerminFMCIndex", terminIndex, TerminFMCIndex[terminIndex], funktiondeutsch[TerminFMCIndex[terminIndex]]);
      }

      updateAnmeldeInfo();
      checkForChanges();
}

//---------------------------------------------------------------------------------------------
function updateAnmeldeInfo() {
//---------------------------------------------------------------------------------------------
    const terminIndex = parseInt(document.querySelector('input[name="termin"]:checked')?.value, 10);
    const terminText = terminDaten[terminIndex];
    const datum = terminText.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] || terminText;
    const anmeldeInfoTermin = document.getElementById("anmeldeInfoTermin");
    const anmeldeInfoFunc = document.getElementById("anmeldeInfoFunc");


    aktTerminIndex = terminIndex;
    aktTermin = datum;
    anmeldeFunktionen = " "

    document.getElementById(`export_meldung`).textContent =  " ";

    if (anmeldeInfoTermin && anmeldeInfoFunc && datum && alleAnmeldeInfosCache[datum] && alleAnmeldeInfosCache[datum].anmeldungInfo) {
      console.log("Anmeldeinfo gefunden für:", datum, "Info:", alleAnmeldeInfosCache[datum].anmeldungInfo);
      anmeldeInfoTermin.textContent = 'AnmeldeInfo für:   ' + datum;
      anmeldeFunktionen = alleAnmeldeInfosCache[datum].anmeldungInfo;
      anmeldeInfoFunc.textContent = anmeldeFunktionen;

    } else if (anmeldeInfoTermin && datum) {
      console.log("Keine Anmeldeinfo im Cache für:", datum);
      anmeldeInfoTermin.textContent = 'AnmeldeInfo für:   ' + datum;
      anmeldeInfoFunc.textContent = " ";
    }
}

//---------------------------------------------------------------------------------------------
function checkForChanges() {
//---------------------------------------------------------------------------------------------
      const submitBtn = document.getElementById("submit-button");
      const anyChanged = document.querySelector('.changed') !== null;
      submitBtn.disabled = !anyChanged;
}

//---------------------------------------------------------------------------------------------
function refreshFormView() {
//---------------------------------------------------------------------------------------------
  apiCall('getAlleAnmeldeInfos')
    .then(function(anmeldeInfos) {
      alleAnmeldeInfosCache = anmeldeInfos;
      updateAnmeldeInfo();
    })
    .catch(err => {
      console.error("CLIENT FEHLER: Fehler beim Laden der Anmeldeinfos:", err);
      document.getElementById("status").innerText = "⚠️ Fehler beim Aktualisieren.";
    });

    apiCall('getAlleNamentlichenMeldungen')
    .then(daten => {
      namentlicheAnmeldungenCache  = daten.anmeldungen;
      namentlicheAbmeldungenCache  = daten.abmeldungen;
    })
    .catch(err => {
      console.error("CLIENT FEHLER: Fehler beim Laden der namentlichen Anmeldungen:", err);
      document.getElementById("status").innerText = "⚠️ Fehler beim Aktualisieren.";
    });

  apiCall('getFormData', { Anmelde: formUsername })
    .then(buildForm)
    .catch(err => {
      console.error("CLIENT FEHLER: Fehler beim erneuten Laden der Daten:", err);
      document.getElementById("status").innerText = "⚠️ Fehler beim Aktualisieren.";
    });
}


//---------------------------------------------------------------------------------------------
function setSpinnerState(id, loading) {
//---------------------------------------------------------------------------------------------
  const el = document.getElementById(id);
  if (!el) return;
  if (loading) {
    el.classList.remove("checkmark");
    el.classList.add("spinner", "small");
    el.innerText = "";
  } else {
    el.classList.remove("spinner", "small");
    el.classList.add("checkmark");
    el.innerText = "✓";
  }
}

//---------------------------------------------------------------------------------------------
function showError(msg) {
//---------------------------------------------------------------------------------------------
  const statusEl = document.getElementById("status");
  statusEl.innerText = msg;
  statusEl.classList.remove("hidden");
  document.getElementById("loading-overlay").classList.add("hidden");
}


//---------------------------------------------------------------------------------------------
function showPopup(text) {
//---------------------------------------------------------------------------------------------
      const popupText = document.querySelector("#popup-content p");
      popupText.innerHTML = text;
      document.getElementById("popup").style.display = "flex";
}

//---------------------------------------------------------------------------------------------
function closePopup() {
//---------------------------------------------------------------------------------------------
      document.getElementById("popup").style.display = "none";
}




//---------------------------------------------------------------------------------------------
function showOverlaySubmit(message = "Bitte warten ...") {
//---------------------------------------------------------------------------------------------
  document.getElementById("overlaySubmitText").innerHTML  = message
  document.getElementById("overlaySubmit").classList.remove("hidden");
  document.getElementById("closeOverlaySubmit").style.display = "none";
}

//---------------------------------------------------------------------------------------------
function updateOverlaySubmit(message) {
//---------------------------------------------------------------------------------------------
  const textBox = document.getElementById("overlaySubmitText");
  textBox.innerText += "\n" + message;
}


//---------------------------------------------------------------------------------------------
function closeOverlaySubmit() {
//---------------------------------------------------------------------------------------------
  document.getElementById("overlaySubmit").classList.add("hidden");
}


// Neuer Code für die gesamte submitForm() Funktion mit "funktiondeutsch"
//---------------------------------------------------------------------------------------------
function submitForm() {
//---------------------------------------------------------------------------------------------
  const terminLabels = document.getElementById("termin-options").getElementsByTagName("label");
  const updates = [];

  Array.from(terminLabels).forEach((label, index) => {
    const span = label.querySelector('.changed');
    if (span) {
      const funktion = funktiondeutsch[TerminFMCIndex[index]]
//      const funktion = span.textContent.includes("–") ? span.textContent.split("–")[1].trim() : "";
      updates.push({ index: index, funktion, text: span.textContent.trim() });
    }
  });

  if (updates.length === 0) {
    statusEl.innerText = "❗ Keine Änderungen erkannt.";
    return;
  }

  showOverlaySubmit("<strong>🕓 Eingaben werden gespeichert...</strong><br>");

  let completed = 0;
  updates.forEach(update => {
    apiCall('submitFormData', { Anmelde: formUsername, terminIndex: update.index, funktion: update.funktion })
      .then(() => {
        updateOverlaySubmit(`🟢 ${update.text}    ✓.`);
        completed++;
        if (completed === updates.length) {
          updateOverlaySubmit(` \n✅ Alle Änderungen gespeichert.`);
          refreshFormView();

          apiCall('sendConfirmationMail', { Anmelde: formUsername })
            .then(() => {
              updateOverlaySubmit(`✅ Bestätigungsemail verschickt`);
              document.getElementById("closeOverlaySubmit").style.display = "inline-block";
            })
            .catch(err => {
              updateOverlaySubmit(`❌ Fehler beim Senden der Bestätigungsemail`);
              document.getElementById("closeOverlaySubmit").style.display = "inline-block";
            });
        }
      })
      .catch(err => {
        updateOverlaySubmit(`❌ Fehler beim Speichern:\n${err.message}`);
        document.getElementById("closeOverlaySubmit").style.display = "inline-block";
      });
  });
}

