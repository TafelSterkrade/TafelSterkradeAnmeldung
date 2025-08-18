
// Login.js 15.08.2025

  // Globaler Speicher für den angemeldeten Benutzernamen, sobald der Login erfolgreich war
  let loggedInUsername = '';
  let loggedInVollername = '';

    // Diese Funktion wird vom Haupt-Skript (in Index.html) beim Laden aufgerufen
    // ------------------------------------------------------------------      
  function initLoginPage() {
  // ------------------------------------------------------------------      
   
    // Zurücksetzen, wenn der Tab wieder sichtbar wird (falls der Benutzer zurück navigiert)
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        document.getElementById("status").innerText = "Bitte Anmeldenamen eingeben";
        document.getElementById("message").innerText = "";
        // Optional: Eingabefeld leeren, wenn man zurückkommt
        // document.getElementById("Anmelde").value = ""; 
      }
    });

    // Event Listener für den Login-Button
    document.getElementById("login-button").addEventListener("click", checkAnmelde);

    // Event Listener für Enter-Taste im Eingabefeld
    document.getElementById("Anmelde").addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault(); // Verhindert das Standardverhalten der Enter-Taste (z.B. Formular-Submit)
        checkAnmelde();
      }
    });

    document.getElementById("status").innerText = "Bitte Anmeldenamen eingeben";
    document.getElementById("message").innerText = "";
  }
  
  
//------------------------------------------------------------------ 
function checkAnmelde() {
//------------------------------------------------------------------ 
  const Anmelde = document.getElementById("Anmelde").value.trim();
  if (Anmelde === "") {
    document.getElementById("status").innerText = "Bitte einen Anmeldenamen eingeben.";
    return;
  }

  document.getElementById("status").innerText = "🔄 Anmeldung wird geprüft … " + Anmelde;
  document.getElementById("login-button").disabled = true;

  apiCall('checkAnmeldung', { Anmelde })
    .then(response => {
      console.log("Antwort von checkAnmeldung:", response);
      document.getElementById("login-button").disabled = false;

      if (response.success) {
        loggedInUsername = response.Anmelde;
        loggedInVollername = response.vollerName;
        document.getElementById("status").innerText = "✅ Anmeldung erfolgreich!";
        document.getElementById("message").innerText = "";
        
        showFormAndLoadData(loggedInUsername);
      } else {
        document.getElementById("status").innerText = "❌ Fehler bei der Anmeldung.";
        document.getElementById("message").innerHTML = `<span style="color:red;">${response.message || "Keine Zugriffsberechtigung."}</span>`;
      }
    })
    .catch(error => {
      console.error("CLIENT FEHLER: Fehler bei der Anmeldung:", error);
      document.getElementById("login-button").disabled = false;
      document.getElementById("status").innerText = "❌ Ein Fehler ist aufgetreten.";
      document.getElementById("message").innerHTML = `<span style="color:red;">${error.message || "Unbekannter Fehler."}</span>`;
    });
}


 