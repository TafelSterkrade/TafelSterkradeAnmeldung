// News.js 13.12.2025

let GLOBAL_NEWS_SCHALTER_VALUE = "";
let GLOBAL_NEWS_SCHALTER_AKTIV = false; 
let GLOBAL_NEWS_ABFRAGE_AKTIV = false; 
let GLOBAL_NEWS_TEXT = "";

let NEWSDECISION = "weiß_nicht"; 
let INITIALDECISION = " "; 

//---------------------------------------------------------------------------------------------
function showOverlayNews() { 
//---------------------------------------------------------------------------------------------
    if (!GLOBAL_NEWS_SCHALTER_AKTIV) {
        return
    }

    const overlay = document.getElementById("overlayNews");
    const OverlayText = document.getElementById("overlayNews-text");
    const OverlayTitel = document.getElementById("overlayNews-title");
    
    OverlayText.innerHTML = GLOBAL_NEWS_TEXT; 
    OverlayTitel.innerHTML = GLOBAL_NEWS_SCHALTER_VALUE; 
    const decisionoptions = document.getElementById("decision-options");

    if (!GLOBAL_NEWS_ABFRAGE_AKTIV) {
        decisionoptions.classList.add("hidden"); // Entfernt die Radiobutton
    }

    updateNewsButton(); 

    overlay.style.display = "flex";
}
//---------------------------------------------------------------------------------------------
function closeOverlayNews() { 
//---------------------------------------------------------------------------------------------
    if (GLOBAL_NEWS_ABFRAGE_AKTIV) {
        saveNewsDecision ();
    }

    document.getElementById("overlayNews").style.display = "none";
}
//---------------------------------------------------------------------------------------------
function updateNewsDecision() { 
//---------------------------------------------------------------------------------------------
    
    // Setze den Radiobutton basierend auf dem gespeicherten Wert
    const currentDecisionRadio = document.querySelector(`input[name="newsDecision"][value="${NEWSDECISION}"]`);
    if (currentDecisionRadio) {
        currentDecisionRadio.checked = true;
        console.log("++++updateNewsDecision 1:", NEWSDECISION);
    } else {
        // Fallback, falls NEWSDECISION ungültig ist
        document.querySelector('input[name="newsDecision"][value="weiß_nicht"]').checked = true;
        console.log("++++updateNewsDecision 2:", NEWSDECISION);
    }

}

//---------------------------------------------------------------------------------------------
async function checkNews() { 
//---------------------------------------------------------------------------------------------
    console.log("++++checkNews ");

    try {
        const adminData = await apiCall('getNews');

        GLOBAL_NEWS_SCHALTER_VALUE  = adminData.schalterValue;
        GLOBAL_NEWS_SCHALTER_AKTIV  = !!GLOBAL_NEWS_SCHALTER_VALUE && GLOBAL_NEWS_SCHALTER_VALUE.toString().trim() !== '';

        ABFRAGE_VALUE   = "";
        ABFRAGE_VALUE   = adminData.abfrageValue;
        GLOBAL_NEWS_ABFRAGE_AKTIV   = ABFRAGE_VALUE.toString().trim() == 'Abfrage';

        GLOBAL_NEWS_TEXT = adminData.newsText;
        console.log("CLIENT: News geladen. Schalter:", GLOBAL_NEWS_SCHALTER_VALUE, GLOBAL_NEWS_SCHALTER_AKTIV);
        console.log("CLIENT: News geladen. ABFRAGE:", ABFRAGE_VALUE, GLOBAL_NEWS_ABFRAGE_AKTIV);

        let activateButton = GLOBAL_NEWS_SCHALTER_AKTIV && !!GLOBAL_NEWS_TEXT;

        if (!activateButton) {
            GLOBAL_NEWS_SCHALTER_AKTIV = false;
            GLOBAL_NEWS_ABFRAGE_AKTIV = false;
            console.log("CLIENT: News inaktiv oder Text leer.");
        }

    } catch (error) {
        console.error("Fehler beim Laden der News:", error);
    }
}

//---------------------------------------------------------------------------------------------
function saveNewsDecision() { 
//---------------------------------------------------------------------------------------------
    // Die aktuell ausgewählte Radio-Option lesen
    const decisionToSave = document.querySelector('input[name="newsDecision"]:checked')?.value;
    
    if (!decisionToSave || decisionToSave === INITIALDECISION) {
        console.log("News-Entscheidung unverändert oder leer. Speichern übersprungen.");
        return;
    }

    // Entscheidung speichern
    apiCall('saveNewsDecision', { 
        Anmelde: formUsername, 
        Decision: decisionToSave
    })
    .then(response => {
        if (response.success) {
            NEWSDECISION = decisionToSave; // Globale Variable aktualisieren
            INITIALDECISION = decisionToSave; // Globale Variable aktualisieren
            console.log("News-Entscheidung erfolgreich gespeichert:", NEWSDECISION);
        } else {
            console.error("Speichern der Entscheidung fehlgeschlagen:", response.message);
        }
    })
    .catch(error => {
        console.error("Fehler beim Speichern der News-Entscheidung:", error);
    });
}

//---------------------------------------------------------------------------------------------
async function getNewsDecision() { 
//---------------------------------------------------------------------------------------------
    try {
        // Ruft die Entscheidung für den aktuell angemeldeten Benutzer ab
        const decision = await apiCall('getNewsDecision', { Anmelde: formUsername });
        INITIALDECISION = decision; 
        NEWSDECISION = decision ? decision.toString().trim() : "weiß_nicht";
        //NEWSDECISION = decision;
        console.log("++++getNewsDecision geladen:", formUsername, NEWSDECISION);
        updateNewsDecision();

    } catch (error) {
        console.error("Fehler beim Abrufen der News-Entscheidung:", error);
        NEWSDECISION = "weiß_nicht"; // Fallback
    }
}


//---------------------------------------------------------------------------------------------
function updateNewsButton() { 
//---------------------------------------------------------------------------------------------
    const NewsButton = document.getElementById("overlayNews-button");
    console.log("updateNewsButton:", GLOBAL_NEWS_SCHALTER_AKTIV);
    NewsButton.innerHTML = GLOBAL_NEWS_SCHALTER_VALUE; 

    if (NewsButton) {
        if (GLOBAL_NEWS_SCHALTER_AKTIV) {
            NewsButton.classList.remove("hidden"); // Entfernt die Klasse, macht den Button sichtbar
        } else {
            NewsButton.classList.add("hidden");    // Fügt die Klasse hinzu, macht den Button unsichtbar
        }
    }
}

