// background.js

// Function to check if the addon was updated
function checkForUpdate() {
    const currentVersion = chrome.runtime.getManifest().version;
    let previousVersion; // Initialize previousVersion variable
    // chrome.storage.local.get('addonVersion', (result) => {
    //     const previousVersion = result.addonVersion || null;
    // });
    chrome.storage.local.get(["addonVersion"]).then((result) => {
       previousVersion = result.addonVersion || null;
       //if there is no previous version, show a hello notification
    if (!previousVersion) {
        // Show notification about the first run
        chrome.notifications.create({
            type: 'basic',
            iconUrl:  chrome.runtime.getURL("/icons/icon-64.png"),
            title: 'Medicus Assistant do usług',
            message: `Załadowano rozszerzenie Medicus Assistant w wersji ${currentVersion} - no hejka! :)`,
        });
        // Also log it to the console
        console.log(`Medicus Assistant loaded for the first time - version ${currentVersion}`);
        chrome.storage.local.set({ addonVersion: currentVersion }).then((result) => {});

    }
    if (previousVersion && previousVersion !== currentVersion) {
        // Show notification about the update
        chrome.notifications.create({
            type: 'basic',
            iconUrl:  chrome.runtime.getURL("/icons/icon-64.png"),
            title: 'Medicus Assistant zaktualizowany',
            message: `Rozszerzenie zostało zaktualizowane z wersji ${previousVersion} do ${currentVersion} - hurra!.`
        });
        // Also log it to the console
        console.log(`Medicus Assistant updated from version ${previousVersion} to ${currentVersion}`);
        chrome.storage.local.set({ addonVersion: currentVersion }).then((result) => {});
    }
});
    

    

    //await chrome.storage.local.set({ addonVersion: currentVersion });
}

console.log('Background script loaded.');
// Run the check when the extension is loaded
checkForUpdate();