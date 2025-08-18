// Start.js (17.08.2025)

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxrlHyMIaNi1W3yQfC4Z24TTJFEZVyJG20V4fSddX0jxU5dYVb5r3J8GZh0H3LLytqB/exec";

//---------------------------------------------------------------------------------------------
function apiCall(action, payload) {
//---------------------------------------------------------------------------------------------
  return new Promise((resolve, reject) => {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP-Fehler! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.error) {
        reject(new Error(data.error));
      } else {
        resolve(data);
      }
    })
    .catch(error => {
      console.error("API-Anfrage fehlgeschlagen:", error);
      reject(error);
    });
  });
}

let TESTVERSION = false; // Standardwert

//---------------------------------------------------------------------------------------------
function initApp() {
//---------------------------------------------------------------------------------------------
  // 1. Abfrage der Testversion
  apiCall('getTestversion')
    .then(versionFlag => {
      TESTVERSION = versionFlag;
      if (TESTVERSION) {
        const versionDivs = document.querySelectorAll('.version');
        versionDivs.forEach(div => {
          div.innerHTML += ' <span style="color:red;">(Testversion)</span>';
        });
      }
    })
    .catch(error => {
      console.error("Fehler beim Laden der Testversion:", error);
    });

  // 2. Deine ursprüngliche DOME-ContentLoaded-Logik
  if (typeof loggedInUsernameForTesting !== 'undefined' && loggedInUsernameForTesting) {
    showFormAndLoadData(loggedInUsernameForTesting);
  } else {
    showSection('login-section');
    initLoginPage();
  }
}

//---------------------------------------------------------------------------------------------
function checkMaintenanceAndInit() {
//---------------------------------------------------------------------------------------------
  const loadingElement = document.getElementById('loading-initial');
  if (loadingElement) {
    loadingElement.classList.remove('hidden');
  }

  apiCall('isInMaintenance')
    .then(response => {
      if (loadingElement) {
        loadingElement.classList.add('hidden');
      }

      if (response && response.status) {
        document.body.innerHTML = `
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>Wartungsmodus</h1>
            <p>${response.message || "Anwendung derzeit nicht verfügbar."}</p>
          </div>
        `;
      } else {
        initApp();
      }
    })
    .catch(error => {
      if (loadingElement) {
        loadingElement.classList.add('hidden');
      }
      console.error("Fehler bei der Abfrage des Wartungsmodus:", error);
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1>Verbindungsfehler</h1>
          <p>Es konnte keine Verbindung zur Datenbank hergestellt werden. Bitte versuchen Sie es später erneut.</p>
        </div>
      `;
    });
}

//---------------------------------------------------------------------------------------------
function showSection(sectionId) {
//---------------------------------------------------------------------------------------------
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }
}

//---------------------------------------------------------------------------------------------
function showFormAndLoadData(username) {
//---------------------------------------------------------------------------------------------
  showSection('formular-section');
  initFormPage(username);
}

//---------------------------------------------------------------------------------------------
// DER NEUE EIGENTLICHE STARTPUNKT
//---------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Das Lade-Element sollte bereits in Index.html sichtbar sein.
  // Jetzt rufen wir unsere Funktion zur Wartungsprüfung auf.
  checkMaintenanceAndInit();
});