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
/**
 * Function to parse ICD codes from the local xml file in data/ and store them in memory
 */
async function parseIcdCodes() {
    // Fetch the ICD codes from the local file
    const response = await fetch(chrome.runtime.getURL('./data/ICD10_2008_PL_v2024_03_12.xml'));
    const data = await response.text();
    const xml = new DOMParser().parseFromString(data, "application/xml");

    const parserError = xml.querySelector("parsererror");
    if (parserError) {
        throw new Error("Invalid XML");
    }

    const rows = [];
    const dict = {};

    const nodes = xml.getElementsByTagNameNS("*", "node");

    for (const node of nodes) {
        const rawCode = node.getAttribute("code")?.trim() ?? "";
        const code = normalizeIcdCode(rawCode);

        if (!isAllowedIcdCodeDepth(code)) continue;

        const nameEl = directChildByLocalName(node, "name");
        const description = nameEl?.textContent?.trim() ?? "";

        if (!description) continue;

        rows.push({
        code,
        description,
        });
        //console.debug(`Parsed ICD code: ${code} - ${description}`);
        dict[code] = description;
    }
    console.debug(`Finished parsing ICD codes. Total valid codes: ${rows.length}`);

    // Store it in local storage for later use by content scripts
    await chrome.storage.local.set({ icdCodes: rows, icdCodeDict: dict });
    return {
        rows, // [{ code: "A00", description: "..." }, ...]
        dict, // { "A00": "...", "A00.0": "...", ... }
    };


}

function directChildByLocalName(parent, localName) {
  for (const child of parent.children) {
    if (child.localName === localName) return child;
  }
  return null;
}

function normalizeIcdCode(code) {
  return code
    .replace(/[†*]/g, "")     // remove ICD dagger/asterisk markers
    .replace(/\s+/g, "")
    .replace("–", "-")       // normalize en dash to hyphen
    .trim();
}

function isAllowedIcdCodeDepth(code) {
  if (!code) return false;

  // Examples allowed by your rule:
  // Z
  // Z7
  // Z76
  // Z76.0
  // A00-B99
  // A00-A09

  return (
    /^[A-Z]$/.test(code) ||
    /^[A-Z]\d$/.test(code) ||
    /^[A-Z]\d{2}$/.test(code) ||
    /^[A-Z]\d{2}\.\d$/.test(code) ||
    /^[A-Z]\d{2}-[A-Z]?\d{2}$/.test(code)
  );
}

console.debug('Background script loaded.');
// Run the check when the extension is loaded
checkForUpdate();

async function lookupIcdDescription(code) {
    // This function can be used by content scripts to get the description for a given ICD code

    // check if the dict is already in memory, if not, load it from local storage
        if (!codeDict) {
            const result = await chrome.storage.local.get('icdCodeDict');
            codeDict = result.icdCodeDict || {};
        }
    // check if the code is a single code or a batch, a batch is an array of codes, if it's a batch, return an array of descriptions
    if (Array.isArray(code)) {
        return code.map(c => codeDict[c] || null);
    }

    return codeDict[code] || null;
}

function listen() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'lookupIcdDescription') {
            lookupIcdDescription(message.code).then(description => {
                sendResponse({ description });
            });
            return true; // Indicates that the response will be sent asynchronously
        }
    });

    chrome.action.onClicked.addListener(() => {
        chrome.runtime.openOptionsPage();
    });
}

async function testPerformance() {
    // make a test code to lookup a few codes and measure how much time it takes
    const testCodes = ["D00", "C00.0", "Z76.0", "A00–A09", "F", "F3", "Z7", "A00-A09"];
    testCodes.forEach(async (code) => {
        const start = performance.now();
        const description = await lookupIcdDescription(code);
        const end = performance.now();
        console.debug(`Lookup for code ${code} took ${end - start} ms. Description: ${description}`);
    });
}

let { rows: parsedRows, dict: codeDict } = parseIcdCodes();
console.debug('Parsed ICD codes:', codeDict);
// makeCacheForIcdCodes();
// makeLookupForIcdCodes();
// Listen for messages from content scripts
listen();
//testPerformance();
