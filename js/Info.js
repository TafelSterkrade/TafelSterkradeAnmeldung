// Info.js 12.12.2025

let GLOBAL_INFO_SCHALTER_VALUE = "";
let GLOBAL_INFO_SCHALTER_AKTIV = false; 
let GLOBAL_INFO_ABFRAGE_AKTIV = false; 
let GLOBAL_INFO_TEXT = "";

let ADMININFODECISION = "weiss_nicht"; 

//---------------------------------------------------------------------------------------------
function showOverlayInfo() { 
//---------------------------------------------------------------------------------------------
    if (!GLOBAL_INFO_SCHALTER_AKTIV) {
        return
    }

    const overlay = document.getElementById("overlayInfo");
    const OverlayText = document.getElementById("overlayInfo-text");
    const OverlayTitel = document.getElementById("overlayInfo-title");
    
    OverlayText.innerHTML = GLOBAL_INFO_TEXT; 
    OverlayTitel.innerHTML = GLOBAL_INFO_SCHALTER_VALUE; 
    const decisionoptions = document.getElementById("decision-options");

    if (!GLOBAL_INFO_ABFRAGE_AKTIV) {
        decisionoptions.classList.add("hidden"); // Entfernt die Radiobutton
    }

    updateInfoButton(); 

    overlay.style.display = "flex";
}
//---------------------------------------------------------------------------------------------
function closeOverlayInfo() { 
//---------------------------------------------------------------------------------------------
    if (GLOBAL_INFO_ABFRAGE_AKTIV) {
        saveAdminInfoDecision ();
    }

    document.getElementById("overlayInfo").style.display = "none";
}
//---------------------------------------------------------------------------------------------
function updateInfoDecision() { 
//---------------------------------------------------------------------------------------------
    
    // Setze den Radiobutton basierend auf dem gespeicherten Wert
    const currentDecisionRadio = document.querySelector(`input[name="infoDecision"][value="${ADMININFODECISION}"]`);
    if (currentDecisionRadio) {
        currentDecisionRadio.checked = true;
        console.log("++++updateInfoDecision 1:", ADMININFODECISION);
    } else {
        // Fallback, falls ADMININFODECISION ungültig ist
        document.querySelector('input[name="infoDecision"][value="weiss_nicht"]').checked = true;
        console.log("++++updateInfoDecision 2:", ADMININFODECISION);
    }

}

//---------------------------------------------------------------------------------------------
async function checkAdminInfo() { 
//---------------------------------------------------------------------------------------------
    try {
        const adminData = await apiCall('getAdminInfo');

        GLOBAL_INFO_SCHALTER_VALUE  = adminData.schalterValue;
        GLOBAL_INFO_SCHALTER_AKTIV  = !!GLOBAL_INFO_SCHALTER_VALUE && GLOBAL_INFO_SCHALTER_VALUE.toString().trim() !== '';

        ABFRAGE_VALUE   = "";
        ABFRAGE_VALUE   = adminData.abfrageValue;
        GLOBAL_INFO_ABFRAGE_AKTIV   = ABFRAGE_VALUE.toString().trim() == 'Abfrage';

        GLOBAL_INFO_TEXT = adminData.infoText;
        console.log("CLIENT: Admin Info geladen. Schalter:", GLOBAL_INFO_SCHALTER_VALUE, GLOBAL_INFO_SCHALTER_AKTIV);
        console.log("CLIENT: Admin Info geladen. ABFRAGE:", ABFRAGE_VALUE, GLOBAL_INFO_ABFRAGE_AKTIV);

        let activateButton = GLOBAL_INFO_SCHALTER_AKTIV && !!GLOBAL_INFO_TEXT;

        if (!activateButton) {
            GLOBAL_INFO_SCHALTER_AKTIV = false;
            GLOBAL_INFO_ABFRAGE_AKTIV = false;
            console.log("CLIENT: Admin Info inaktiv oder Text leer.");
        }

    } catch (error) {
        console.error("Fehler beim Laden der Admin Info:", error);
    }
}

//---------------------------------------------------------------------------------------------
function saveAdminInfoDecision() { 
//---------------------------------------------------------------------------------------------
    // Die aktuell ausgewählte Radio-Option lesen
    const decisionToSave = document.querySelector('input[name="infoDecision"]:checked')?.value;
    
    if (!decisionToSave || decisionToSave === ADMININFODECISION) {
        console.log("Info-Entscheidung unverändert oder leer. Speichern übersprungen.");
        return;
    }

    // Entscheidung speichern
    apiCall('saveAdminInfoDecision', { 
        Anmelde: formUsername, 
        Decision: decisionToSave
    })
    .then(response => {
        if (response.success) {
            ADMININFODECISION = decisionToSave; // Globale Variable aktualisieren
            console.log("Info-Entscheidung erfolgreich gespeichert:", ADMININFODECISION);
        } else {
            console.error("Speichern der Entscheidung fehlgeschlagen:", response.message);
        }
    })
    .catch(error => {
        console.error("Fehler beim Speichern der Info-Entscheidung:", error);
    });
}

//---------------------------------------------------------------------------------------------
async function getAdminInfoDecision() { 
//---------------------------------------------------------------------------------------------
    try {
        // Ruft die Entscheidung für den aktuell angemeldeten Benutzer ab
        const decision = await apiCall('getAdminInfoDecision', { Anmelde: formUsername });
        ADMININFODECISION = decision;
        console.log("++++getAdminInfoDecision geladen:", formUsername, ADMININFODECISION);
        updateInfoDecision();

    } catch (error) {
        console.error("Fehler beim Abrufen der Info-Entscheidung:", error);
        ADMININFODECISION = "weiss_nicht"; // Fallback
    }
}


//---------------------------------------------------------------------------------------------
function updateInfoButton() { 
//---------------------------------------------------------------------------------------------
    const infoButton = document.getElementById("overlayInfo-button");
    console.log("updateInfoButton:", GLOBAL_INFO_SCHALTER_AKTIV);
    infoButton.innerHTML = GLOBAL_INFO_SCHALTER_VALUE; 

    if (infoButton) {
        if (GLOBAL_INFO_SCHALTER_AKTIV) {
            infoButton.classList.remove("hidden"); // Entfernt die Klasse, macht den Button sichtbar
        } else {
            infoButton.classList.add("hidden");    // Fügt die Klasse hinzu, macht den Button unsichtbar
        }
    }
}

