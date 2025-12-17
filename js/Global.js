// Global.js 22.11.2025

//---------------------------------------------------------------------------------------------
function showLoadingSpinner(containerId, message) {
//---------------------------------------------------------------------------------------------
console.log("showLoadingSpinner 1: ", containerId);

const container = document.getElementById(containerId);
    if (!container) return;

    // Erzeugt den HTML-Code für den Spinner und den Text
    container.innerHTML = `
        <div id="download-spinner-container">
            <div class="spinner small"></div> 
            <span id="download-spinner-text">${message}</span>
        </div>
    `;
    // Stellt sicher, dass das Element sichtbar ist, falls es vorher versteckt war
    container.style.display = 'flex'; 
console.log("showLoadingSpinner 2: ", message);
}

//---------------------------------------------------------------------------------------------
function showDownloadLink(containerId, filename, downloadUrl) {
//---------------------------------------------------------------------------------------------
    const container = document.getElementById(containerId);
    if (!container) return;
  
    container.innerHTML = '';

    if (downloadUrl.startsWith("http")) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.textContent = `Klicken zum Herunterladen: "` + filename + `"`;
      link.target = '_blank';
      container.appendChild(link);
    } else {
      container.textContent = downloadUrl;
    }

    container.style.display = 'flex'; 
}

//---------------------------------------------------------------------------------------------
function handleApiError(error, containerId, defaultMessage) {
//---------------------------------------------------------------------------------------------
    const container = document.getElementById(containerId);
    if (!container) return;
    
    console.error(`API Error in ${containerId}:`, error);

    const errorMessage = error.message || defaultMessage || "Ein unbekannter Fehler ist aufgetreten.";
    
    // Rote Fehlermeldung anzeigen
    container.innerHTML = `
        <p style="color: red; font-weight: bold;">
            ❌ Fehler: ${errorMessage}
        </p>
    `;
    container.style.display = 'flex'; 
}

//----------------------------------
function closeOverlay(IdOverlay) {
//----------------------------------
    const overlay = document.getElementById(IdOverlay);
    overlay.style.display = 'none';
}
