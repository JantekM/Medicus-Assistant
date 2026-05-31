
'use strict';

function addTomorrowMorningButtons() {
    //find span with id "skierowanie_plan_dataczas_all"
    const $span = $('#skierowanie_plan_dataczas_all');
    if ($span.length === 0) return; // No span found

    // Check if the span contains a input element (with type button) with text "Teraz" (Now)

    const $nowButton = $span.find('input[type="button"]').filter(function () {
        return $(this).val() === 'Teraz';
    }
    );
    if ($nowButton.length === 0) return; // No "Now" button found

    //check if the button is already added
    if ($nowButton.data('tomorrow-added')) return; // Button already added

    // create the "Tomorrow Morning" button (technically input with type="button")
    const $morningBtn = $('<input type="button">')
        .val('Jutro rano')
        //add a tooltip to the button with help info
        .attr('title', 'Wybierz datę i godzinę na najbliższe rano o 7:45')
        .addClass('tomorrow-morning-btn')
        .css({
            marginLeft: '5px',
            //padding: '2px 6px',
            //fontSize: '90%'
        })
        .on('click', function () {
            // check if the nearest 7:45 is today or tomorrow
            const now = new Date();
            let morning = new Date();
            if (now.getHours() >= 8) {
                // set tomorrow's date and time to 7:45 AM
                morning.setDate(now.getDate() + 1);
            }

            // set the time to 7:45 AM
            morning.setHours(7, 45, 0, 0);

            if ($('#skierowanie_plan_dataczas_year').length &&
                $('#skierowanie_plan_dataczas_month').length &&
                $('#skierowanie_plan_dataczas_day').length) {
                $('#skierowanie_plan_dataczas_year').val(morning.getFullYear());
                $('#skierowanie_plan_dataczas_month').val(morning.getMonth() + 1);
                $('#skierowanie_plan_dataczas_day').val(morning.getDate());
            } else if ($('#skierowanie_plan_dataczas').length) {
                // example: $('#skierowanie_plan_dataczas').val('2025-04-01'); 
                $('#skierowanie_plan_dataczas').val(morning.toISOString().split('T')[0]);
            }
            //select through jquery input element with name "skierowanie_plan_dataczas_hour" and "skierowanie_plan_dataczas_minutes"

            if ($('[name="skierowanie_plan_dataczas_hour"]').length &&
                $('[name="skierowanie_plan_dataczas_minutes"]').length) {
                $('[name="skierowanie_plan_dataczas_hour"]').val('07');
                $('[name="skierowanie_plan_dataczas_minutes"]').val('45');
            }
        });


    // Add the button after the "Now" button
    $nowButton.after($morningBtn);
    // Add a non breaking space before the button
    $nowButton.after('&nbsp;');
    // Mark the button as added to prevent duplicates
    $nowButton.data('tomorrow-added', true);



}

async function addICDHelperPanel(targetTable, codeInput = null, descriptionInput = null) {
    const favoritedICDCodesPromise = chrome.storage.local.get(['favoritedICDCodes']);
    const usedICDCodesCountPromise = chrome.storage.local.get(['usedICDCodesCount']);
    const lastlyUsedICDCodesPromise = chrome.storage.local.get(['usedICDCodes']);

    
    // make a new table with two columns, one for the button with a code and one for the description, and add it to tdTarget
    const newTable = $('<table>').css('width', '100%').attr('id', 'customlyAddedIcdCodesTable').addClass('custom-icd-table');
    targetTable.after(newTable);

    //Lastly used header and row
    const lastlyUsedHeaderRow = $('<tr>').addClass('custom-icd-header-row').addClass('custom-icd-lastly-used');
    const lastlyUsedHeaderCell = $('<td>').addClass('custom-icd-header-cell').addClass('custom-icd-lastly-used').append($('<div>').text('Ostatnio używane kody ICD').addClass('custom-icd-header-div').addClass('custom-icd-lastly-used'));
    lastlyUsedHeaderRow.append(lastlyUsedHeaderCell);
    newTable.append(lastlyUsedHeaderRow);

    const lastlyUsedRow = $('<tr>').addClass('custom-icd-row').addClass('custom-icd-lastly-used');
    const lastlyUsedCell = $('<td>').addClass('custom-icd-cell').addClass('custom-icd-lastly-used');
    const lastlyUsedDiv = $('<div>').addClass('custom-icd-div').addClass('custom-icd-lastly-used');
    const lastlyUsedTable = $('<table>').attr('id', 'customlyAddedLastlyUsedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-lastly-used');
    lastlyUsedDiv.append(lastlyUsedTable);
    lastlyUsedCell.append(lastlyUsedDiv);
    lastlyUsedRow.append(lastlyUsedCell);
    newTable.append(lastlyUsedRow);

    //most frequently used header and row
    const mostFrequentlyUsedHeaderRow = $('<tr>').addClass('custom-icd-header-row').addClass('custom-icd-most-frequently-used');
    const mostFrequentlyUsedHeaderCell = $('<td>').addClass('custom-icd-header-cell').addClass('custom-icd-most-frequently-used').append($('<div>').text('Najczęściej używane kody ICD').addClass('custom-icd-header-div').addClass('custom-icd-most-frequently-used'));
    mostFrequentlyUsedHeaderRow.append(mostFrequentlyUsedHeaderCell);
    newTable.append(mostFrequentlyUsedHeaderRow);

    const mostFrequentlyUsedRow = $('<tr>').addClass('custom-icd-row').addClass('custom-icd-most-frequently-used');
    const mostFrequentlyUsedCell = $('<td>').addClass('custom-icd-cell').addClass('custom-icd-most-frequently-used');
    const mostFrequentlyUsedDiv = $('<div>').addClass('custom-icd-div').addClass('custom-icd-most-frequently-used');
    const mostFrequentlyUsedTable = $('<table>').attr('id', 'customlyAddedMostFrequentlyUsedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-most-frequently-used');
    mostFrequentlyUsedDiv.append(mostFrequentlyUsedTable);
    mostFrequentlyUsedCell.append(mostFrequentlyUsedDiv);
    mostFrequentlyUsedRow.append(mostFrequentlyUsedCell);
    newTable.append(mostFrequentlyUsedRow);

    //favorited codes header and row
    const favoritedCodesHeaderRow = $('<tr>').addClass('custom-icd-header-row').addClass('custom-icd-favorited');
    const favoritedCodesHeaderCell = $('<td>').addClass('custom-icd-header-cell').addClass('custom-icd-favorited').append($('<div>').text('Ulubione kody ICD').addClass('custom-icd-header-div').addClass('custom-icd-favorited'));
    favoritedCodesHeaderRow.append(favoritedCodesHeaderCell);
    newTable.append(favoritedCodesHeaderRow);

    const favoritedCodesRow = $('<tr>').addClass('custom-icd-row').addClass('custom-icd-favorited');
    const favoritedCodesCell = $('<td>').addClass('custom-icd-cell').addClass('custom-icd-favorited');
    const favoritedCodesDiv = $('<div>').addClass('custom-icd-div').addClass('custom-icd-favorited');
    const favoritedCodesTable = $('<table>').attr('id', 'customlyAddedFavoritedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-favorited');
    favoritedCodesDiv.append(favoritedCodesTable);
    favoritedCodesCell.append(favoritedCodesDiv);
    favoritedCodesRow.append(favoritedCodesCell);
    newTable.append(favoritedCodesRow);


    let favoritedICDCodes = await favoritedICDCodesPromise;
        favoritedICDCodes = favoritedICDCodes.favoritedICDCodes || [];
    // sort them alphabetically
    favoritedICDCodes.sort();
    let lastlyUsedICDCodes = await lastlyUsedICDCodesPromise;
        lastlyUsedICDCodes = lastlyUsedICDCodes.usedICDCodes || [];
    // remove duplicates from lastlyUsedICDCodes leaving only the first occurrence and sort them by the order they appear in the list, not alphabetically
    lastlyUsedICDCodes = [...new Set(lastlyUsedICDCodes)].sort((a, b) => {
        return lastlyUsedICDCodes.indexOf(a) - lastlyUsedICDCodes.indexOf(b);
    });
    // limit to 50 codes
    lastlyUsedICDCodes = lastlyUsedICDCodes.slice(0, 50);


    if (lastlyUsedICDCodes.length === 0) {
        console.error('No lastlyUsedICDCodes found in local storage.');
        //return;
    }else {
        // for each code in the lastlyUsedICDCodes list, add a row to the new table with a button that has the code as text and a description next to it
        lastlyUsedICDCodes.forEach(code => {

            // lookup description for the code using background script, if there is no description, use an empty string
            chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code }, (response) => {
                const description = response?.description || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes);
                row.append(codeCell, descriptionCell);
                lastlyUsedTable.append(row);
            });
        });
    }


    let usedICDCodesCount = await usedICDCodesCountPromise;
        usedICDCodesCount = usedICDCodesCount.usedICDCodesCount || {};
    // limit to 50 codes
    usedICDCodesCount = Object.fromEntries(Object.entries(usedICDCodesCount).slice(0, 50));
    
    if (Object.keys(usedICDCodesCount).length === 0) {
        console.error('No usedICDCodesCount found in local storage.');
        //return;
    }else {
        // for each code in the frequentlyUsedIcdCodes list, add a row to the new table with a button that has the code as text and a description next to it
        Object.keys(usedICDCodesCount).forEach(code => {

            // lookup description for the code using background script, if there is no description, use an empty string
            chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code }, (response) => {
                const description = response?.description || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes);
                row.append(codeCell, descriptionCell);
                mostFrequentlyUsedTable.append(row);
            });
        });
    }
    
    if (favoritedICDCodes.length === 0) {
        console.error('No favoritedICDCodes found in local storage.');
        
    }else {
        // for each code in the frequentlyUsedIcdCodes list, add a row to the new table with a button that has the code as text and a description next to it
        favoritedICDCodes.forEach(code => {

            // lookup description for the code using background script, if there is no description, use an empty string
            chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code }, (response) => {
                const description = response?.description || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes);
                row.append(codeCell, descriptionCell);
                favoritedCodesTable.append(row);
            });
        });
    }

}

function addICDHelperButtons(){

    const HOVER_DELAY_MS = 200;
    const HIDE_DELAY_MS = 1000;

    let showTimer = null;
    let hideTimer = null;
    let currentTarget = null;

    const popup = document.createElement("div");
    popup.id = "icd-helper-hover-popup";
    popup.className = "icd-helper-hover-popup";
    document.documentElement.appendChild(popup);

    function setPopupContent(target) {
        // clean current content
        popup.innerHTML = "";
        //add a table inside popup
        const table = $('<table>').css('width', '100%').attr('id', 'icdHelperPopupTable').addClass('custom-icd-table').addClass('icd-helper-popup-table');
        popup.appendChild(table[0]);
        let codeInput = null;
        let descriptionInput = null;
        if(!codeInput || !descriptionInput) {
            // find the closest ancestor td to the target element
            const closestTd = $(target).closest("td");

            codeInput = closestTd.find('input[type="text"][name$="kod_icd10"]');
            if(codeInput.length !== 1) {
                // find the input element with type text of max length 8 inside the closest td, if there are multiple, take the first one
                codeInput = closestTd.find('input[type="text"][maxlength="8"]').first();
            }
            descriptionInput = null;
            if(closestTd.find('input[type="text"][name="skierowanie_kod_icd10"]').length === 1) {
                descriptionInput = closestTd.find('input[name="skierowanie_kod_icd10_description"]').first();
                let fullDescriptionInput = closestTd.find('input[type="text"][name="skierowanie_kod_icd10_nazwa"]');
                if(fullDescriptionInput.length === 1) {
                    descriptionInput = [descriptionInput,fullDescriptionInput.first()];
                }
            }else{
                // find the input element with type text, max length 60 and readonly
                descriptionInput = codeInput.nextAll('input[size="60"][readonly]').first();
            }
            
        }
        addICDHelperPanel(table, codeInput, descriptionInput);
    }

    function positionPopupNearElement(el) {
        const rect = el.getBoundingClientRect();
        const margin = 8;
        popup.style.display = "block";

        const popupRect = popup.getBoundingClientRect();

        let left = rect.left;
        let top = rect.bottom + margin;

        // Keep inside viewport horizontally
        if (left + popupRect.width > window.innerWidth - margin) {
            left = window.innerWidth - popupRect.width - margin;
        }

        // If not enough space below, place above
        //if (top + popupRect.height > window.innerHeight - margin) {
            top = rect.top - popupRect.height - margin;
        //}

        popup.style.left = `${Math.max(margin, left)}px`;
        popup.style.top = `${Math.max(margin, top)}px`;
    }

    function showPopup(target) {
        currentTarget = target;
        clearTimeout(hideTimer);
        setPopupContent(target);
        positionPopupNearElement(target);
    }

    function scheduleShow(target) {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);

        showTimer = setTimeout(() => {
            showPopup(target);
        }, HOVER_DELAY_MS);
    }

    function scheduleHide() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);

        hideTimer = setTimeout(() => {
            popup.style.display = "none";
            currentTarget = null;
        }, HIDE_DELAY_MS);
    }

    function cancelHide() {
        clearTimeout(hideTimer);
    }

    // find every inout of type button and value ". . ." placed directly inside <a> tag with name "but" and title "Wybierz"
    $('a[name="but"][title="Wybierz"] > input[type="button"][value=". . ."]').each(function () {
        // check if the button already has a sibling with class "icd-helper-btn", if it does, skip it
        if ($(this).siblings('.icd-helper-btn').length > 0) return;
        // get the name of the input element, it should be something like "NAME_button"
        const inputName = $(this).attr('name');
        const baseName = inputName.replace('_button', '');
        // check if name is not empty and if there is an input element with the name baseName + "_kod_icd10" on the page, if not, skip it
        const $icdInput = $(`input[name="${baseName}"]`);
        if (baseName === '' || $icdInput.length === 0) return;
        // check if the baseName end in "kod_icd" or contains "rozpoznanie", if not, skip it
        if (!baseName.endsWith('kod_icd') && !baseName.includes('rozpoznanie') && !baseName.endsWith('kod_icd10')) return;
        // create a new button with text "ICD Helper" and class "icd-helper-btn"
        const $icdHelperBtn = $('<input type="button">')
            .val('⁂')
            .addClass('icd-helper-btn')
            .addClass('icd-helper-hover-target');
            // .on('click', function () {
            //     openPopupWithIcdHelper(this);
            // });
        // insert the button after the original button
        $(this).after($icdHelperBtn);
        console.debug('Added ICD Helper button for input with name:', inputName);
    });

    // Example: attach to all elements with this class
    document.addEventListener("mouseover", event => {
        const target = event.target.closest(".icd-helper-hover-target");
        if (!target) return;

        if (target === currentTarget) {
            cancelHide();
            return;
        }

        scheduleShow(target);
    });

    document.addEventListener("mouseout", event => {
        const target = event.target.closest(".icd-helper-hover-target");
        if (!target) return;

        const related = event.relatedTarget;

        // If moving into popup, don't hide
        if (popup.contains(related)) return;

        // If moving within the same target, don't hide
        if (target.contains(related)) return;

        scheduleHide();
    });

    popup.addEventListener("mouseenter", () => {
        cancelHide();
    });

    popup.addEventListener("mouseleave", () => {
        scheduleHide();
    });

    window.addEventListener("scroll", () => {
    if (currentTarget && popup.style.display !== "none") {
        positionPopupNearElement(currentTarget);
    }
    }, true);

    window.addEventListener("resize", () => {
    if (currentTarget && popup.style.display !== "none") {
        positionPopupNearElement(currentTarget);
    }
    });

}

function putIcdCodeIntoInput(code, description, codeInput = null, descriptionInput = null) {
    function hidePopup() {
        // code is put so hide popup if it's still visible
        const popup = $('div#icd-helper-hover-popup').first();
        popup.css('display', 'none');
    }
    if (codeInput && descriptionInput) {
        $(codeInput).eq(0).val(code);
        $(descriptionInput).each(function(index, element) {
            $(element).val(`(${code}) ${description}`);
        });
        hidePopup();
        return;
    }
    // check all the 6 rozpoznanie input fields, if any of them is empty, put the code and description there and return
    for (let i = 1; i <= 6; i++) {
        let codeInput = $(`input[id="kontakt_rozpoznanie_${i}"]`);
        const inputValue = codeInput.val().trim();
        //check if trimmed value of codeInput is empty
        if (inputValue === '') {
            codeInput.val(code);
            // find the first next input that has size 60 and is readonly, and put the description there
            let descriptionInput = codeInput.nextAll('input[size="60"][readonly]').first();
            if (descriptionInput.length > 0) {
                descriptionInput.val(`(${code}) ${description}`);
            }
            hidePopup();
            return;
        }
    }

    
}

function addPostBtnListener() {
    function handlePostClick(button) {
        
        /** Saves the lastly used ICD codes to the local storage, so that they can be used later for autofilling or suggestions when creating new orders or referrals. 
         * The input is an array of string codes, already trimmed and in uppercase but not checked for validity
         * No more than 500 codes should be stored at one time in memory, if there is more than 500, only the current newest 500 codes will be stored, and the rest will be discarded.
         * The codes can be duplicates, because the most important thing is to know which codes were used recently and how many times, to be able to suggest the most frequently used codes for autofill.
         * 
         * @param {[string]} icdCodes 
         */
        function saveUsedICDs(icdCodes) {
            if (!icdCodes || icdCodes.length === 0) return;
            chrome.storage.local.get(['usedICDCodes']).then((result) => {
                let usedICDCodes = result.usedICDCodes || [];
                // add the new codes to the beginning of the list
                usedICDCodes = icdCodes.concat(usedICDCodes);
                // keep only the newest 500 codes
                usedICDCodes = usedICDCodes.slice(0, 500);
                chrome.storage.local.set({ usedICDCodes });
                console.debug('Updated usedICDCodes in local storage:', usedICDCodes);

                // After saving the codes to the local with duplicates, another local storage variable should be updated with the codes without duplucates and with the count of how many times each code was used, to be able to suggest the most frequently used codes for autofill. This variable should be an object with keys as ICD codes and values as counts of usage.
                let usedICDCodesCount = {};
                usedICDCodes.forEach(code => {
                    if (usedICDCodesCount[code]) {
                        usedICDCodesCount[code]++;
                    } else {
                        usedICDCodesCount[code] = 1;
                    }
                });
                // sort the usedICDCodesCount object by count in descending order, then by how recently the code was used (the order in the usedICDCodes array)
                usedICDCodesCount = Object.fromEntries(Object.entries(usedICDCodesCount).sort((a, b) => {
                    if (b[1] === a[1]) {
                        // if the counts are the same, sort by how recently the code was used
                        return usedICDCodes.indexOf(a[0]) - usedICDCodes.indexOf(b[0]);
                    }
                    return b[1] - a[1];
                }));

                chrome.storage.local.set({ usedICDCodesCount });
                console.debug('Updated usedICDCodesCount in local storage:', usedICDCodesCount);
            });
        }




        // Put your specific logic here; the clicked button element is passed in.
        console.debug('Post button clicked:', button);
        // applies to zlecenie badań, skierowanie do poradni, ...
        const icdZlecenie = $('input[name="skierowanie_kod_icd10"]').val();
        const rozpoznanie1 = $('input[id="kontakt_rozpoznanie_1"]').val();
        const rozpoznanie2 = $('input[id="kontakt_rozpoznanie_2"]').val();
        const rozpoznanie3 = $('input[id="kontakt_rozpoznanie_3"]').val();
        const rozpoznanie4 = $('input[id="kontakt_rozpoznanie_4"]').val();
        const rozpoznanie5 = $('input[id="kontakt_rozpoznanie_5"]').val();
        const rozpoznanie6 = $('input[id="kontakt_rozpoznanie_6"]').val();

        // filter out undefined, null and empty values from the list of rozpoznanie
        //then trim the values, and change all the letters to uppercase
        const rozpoznania = [icdZlecenie, rozpoznanie1, rozpoznanie2, rozpoznanie3, rozpoznanie4, rozpoznanie5, rozpoznanie6]
            .filter(r => r)
            .map(r => r.trim().toUpperCase());
        saveUsedICDs(rozpoznania);
        console.debug('ICD code for the order:', rozpoznania);

    }



    // Delegated listener handles existing and dynamically added buttons.
    $(document)
        .off('click.MA_post_btn')
        .on('click.MA_post_btn', 'button[type="submit"][name="btn_ok"]', function () {
            handlePostClick(this);
            console.debug('Handled click for button with name:', $(this).attr('name'));
        });
    console.debug('Added delegated click listener for the post button.');
}




function addGrBtn4ClickListener() {
    function handleGrBtn4Click(buttonName, $button) {
        // Put your specific logic here; exact clicked name is passed in buttonName.
        console.debug('gr_btn4 clicked:', buttonName, $button);

        // parse the name of the button, if it doesn't follow the usual pattern, log an error and return
        // The pattern "gr_btn4" + "skladniki_procedury_" + four digit code for procedure + 1 digit code for the shortcut group, eg. gr_btn4skladniki_procedury_17084
        const regex = /^gr_btn4skladniki_procedury_(\d{4})(\d)$/;
        const match = buttonName.match(regex);
        if (!match) {
            console.error('Unexpected button name format:', buttonName);
            return;
        }
        const procedureCode = match[1];
        const shortcutGroup = match[2];
        console.debug('Parsed procedure code:', procedureCode, 'Shortcut group:', shortcutGroup);

        //update the local storage with the procedure code and shortcut group, so that each procedure code stores the last used shortcut group for it, there can be multiple procedure codes, and each of them can have a different shortcut group
        chrome.storage.local.get(['shortcutGroupsByProcedure']).then((result) => {
            const shortcutGroupsByProcedure = result.shortcutGroupsByProcedure || {};
            shortcutGroupsByProcedure[procedureCode] = shortcutGroup;
            chrome.storage.local.set({ shortcutGroupsByProcedure });
            console.debug('Updated shortcutGroupsByProcedure in local storage:', shortcutGroupsByProcedure);
        });
    }

    // Delegated listener handles existing and dynamically added buttons.
    $(document)
        .off('click.MA_gr_btn4')
        .on('click.MA_gr_btn4', 'input[type="button"][name^="gr_btn4"], button[name^="gr_btn4"]', function () {
            const buttonName = $(this).attr('name');
            if (!buttonName) return;
            handleGrBtn4Click(buttonName, $(this));
            console.debug('Handled click for button with name:', buttonName);
        });
    console.debug('Added delegated click listener for gr_btn4 buttons.');
}

async function loadShortcutGroupsFromStorage() {
    chrome.storage.local.get(['shortcutGroupsByProcedure']).then((result) => {
        const shortcutGroupsByProcedure = result.shortcutGroupsByProcedure || {};
        console.debug('Loaded shortcutGroupsByProcedure from local storage:', shortcutGroupsByProcedure);
        // for each pair in the loaded shortcutGroupsByProcedure, find the appropriate button with name "gr_btn4skladniki_procedury_" + procedure code + shortcut group and click it
        for (const procedureCode in shortcutGroupsByProcedure) {
            const shortcutGroup = shortcutGroupsByProcedure[procedureCode];
            const buttonName = `gr_btn4skladniki_procedury_${procedureCode}${shortcutGroup}`;
            const $button = $(`input[type="button"][name="${buttonName}"], button[name="${buttonName}"]`);
            const parentSpan = $button.closest('span');
            let spanText = '';
            if (parentSpan.length) {
                // get the text of the span, and remove the first character from it, because it is the number from the button
                const text = parentSpan.text().trim();
                spanText = text.substring(1).trim();
                console.debug('Text of the parent span:', spanText);
            }
            if ($button.length > 0) {
                // run javascript function 'setGroup4skladniki_procedury_' + procedureCode + '()' which is called when the button is clicked, to set the shortcut group for the procedure code
                const functionName = `setGroup4skladniki_procedury_${procedureCode}`;
                const pageWindow = window.wrappedJSObject || window;
                const pageFunction = pageWindow[functionName];

                // console.debug('Attempting to call function:', functionName, 'with span text:', spanText);
                // console.debug('Extension world type:', typeof window[functionName]);
                // console.debug('Page world type:', typeof pageFunction);

                if (typeof pageFunction === 'function') {
                    pageFunction(`gr4skladniki_procedury_${procedureCode}${shortcutGroup}`, spanText);
                    console.debug('Called page function:', functionName);
                } else {
                    $button.trigger('click');
                    console.debug('Page function not found, triggered click for button:', buttonName);
                }
                console.debug('Triggered click for button with name:', buttonName);
            } else {
                console.debug('No button found for name:', buttonName);
            }
        }
        
    });
}

function toggleIcdCodeInFavorites(checkbox) {
    const code = $(checkbox).data('icd-code');
    chrome.storage.local.get(['favoritedICDCodes']).then((result) => {
        let favoritedICDCodes = result.favoritedICDCodes || [];
        if ($(checkbox).is(':checked')) {
            favoritedICDCodes.push(code);
        } else {
            favoritedICDCodes = favoritedICDCodes.filter(c => c !== code);
        }
        chrome.storage.local.set({favoritedICDCodes});
        console.debug('Updated favoritedICDCodes in local storage:', favoritedICDCodes);
    });
}

function addFavoriteCheckbox(followingElement, code, favoritedICDCodes) {
    const checkbox = $(`<input type="checkbox" class="icd-favorite-checkbox" data-icd-code="${code}">`);
        const label = $('<label class="heart-checkbox"></label>');
        followingElement.before(label);
        label.append(checkbox);
        checkbox.after('<span class="heart-icon" title="Oznacz jako ulubione">&nbsp;</span>');

        //if the code appears in the favoritedICDCodes list from the local storage, check the checkbox
        if(favoritedICDCodes.includes(code)) {
            checkbox.prop('checked', true);
        }

        // add a click listener to the checkbox, when it is clicked, if it is checked, add the code to the favoritedICDCodes list in the local storage, if it is unchecked, remove the code from the favoritedICDCodes list in the local storage
        checkbox.on('click', () => {
            toggleIcdCodeInFavorites(checkbox);
        });
}

async function pageIcdPopup(){
    const mainTable = $('table.templateListTable');
    if(mainTable.length === 0) {
        console.error('Could not find the main table on the ICD popup page.');
        return;
    }

    // find all rows in the table with class 'rowlist'
    const rows = mainTable.find('tr.rowlist');
    if(rows.length === 0) {
        console.error('Could not find any rows with class "rowlist" in the main table on the ICD popup page.');
        return;
    }
    let favoritedICDCodes = await chrome.storage.local.get(['favoritedICDCodes']);
        favoritedICDCodes = favoritedICDCodes.favoritedICDCodes || [];
    // for each row, do stuff
    rows.each((index, row) => {
        // find first and second cell of the row
        const cells = $(row).find('td');
        if(cells.length < 2) {
            console.warn('Row does not have enough cells, skipping:', row);
            return;
        }
        const codeCell = cells.eq(0);
        const descriptionCell = cells.eq(1);

        // find a tag inside description cell, insert a custom input checkbox element before it, with class "icd-favorite-checkbox" and data attribute "icd-code" with the value of the code from the first cell, and add a label "Ulubione" after the checkbox
        const link = descriptionCell.find('a');
        
        const code = codeCell.text().trim(); 
        addFavoriteCheckbox(link, code, favoritedICDCodes);
    });
}

// function to set an immediate action in the local storage
function setImmediateAction(action, secondsToExpire) {
    const expirationTime = new Date().getTime() + secondsToExpire * 100000;
    chrome.storage.local.set({immediateAction: action, immediateActionExpirationTimestamp: expirationTime});
    
}

// function to return the immediate action saved in the local storage, if it exists and is not expired
function getImmediateAction() {
    const res = chrome.storage.local.get(['immediateAction', 'immediateActionExpirationTimestamp']).then((result) => {
        const action = result.immediateAction;
        const expirationTimestamp = result.immediateActionExpirationTimestamp;
        if (action && expirationTimestamp) {
            const now = new Date().getTime();
            if (now < expirationTimestamp) {
                return action; // Action is valid and not expired
            } else {
                console.log('Immediate action expired, clearing...');
                //clearImmediateAction(); // Action expired, clear it
            }
        }
        return null; // No valid action found
    }

    );
    return res; 
}

//function to clear the immediate action from local storage
function clearImmediateAction() {
    chrome.storage.local.remove('immediateAction');
    chrome.storage.local.remove('immediateActionExpirationTimestamp');
    
}

function checkPage(){
    //function to check if the loaded page is from Medicus
    function isMedicusPage() {
        // if any of the checks are not true, return false

        // check if there is input element with name x_context inside form named "ar" inside tag center inside body, if not return false
        if ($('body > center > form[name="ar"] > input[name="x_context"]').length === 0) return false;

        // the same for "x_sys_context" input
        if ($('body > center > form[name="ar"] > input[name="x_sys_context"]').length === 0) return false;

        // same for "x_pacjent_ident_id" input
        if ($('body > center > form[name="ar"] > input[name="x_pacjent_ident_id"]').length === 0) {
            if ($('body > center > form[name="ar"] > input[name="x_popup_sos"]').length === 0) return false;
            if ($('body > center > form[name="ar"] > input[name="x_servlet_param"]').length === 0) return false;
        }

        // check if there is a js script in head with src containing words "joperis.templates"
        if ($('head > script[src*="joperis.templates"]').length === 0) return false;

        return true; // All checks passed, it's a Medicus page
    }

    // Check if the page is a Medicus page
    if (!isMedicusPage()) {
        console.log('Not a Medicus page, exiting...');
        return;
    }
    
    // when loading (async) is completed, then add the click listener but don't wait with the rest of the page loading, because it can be done in the meantime
    loadShortcutGroupsFromStorage().then(() => {
        addGrBtn4ClickListener();
    });
    addPostBtnListener();
    addICDHelperButtons();
    

    if ($('.templateEditPageTitle').length && $('.templateEditPageTitle').text().includes('Dane medyczne wizyty')) {
        console.log('Loading content for dane-medyczne page...');
        pageDaneMedyczne();
        return;
    }

    if ($('.templateListPageTitle').length && $('.templateListPageTitle').text().includes('Wizyty użytkownika')) {
        console.log('Loading content for wizyty-użytkownika page...');
        //pageWizytyUzytkownika(); // WIP
        return;
    }

     if ($('.templateListPageTitle').length && $('.templateListPageTitle').text().includes('Rozpoznania (ICD-10)')) {
        console.log('Loading content for rozpoznania-icd-10 popup page...');
        pageIcdPopup(); // WIP
        return;
    }

    // check if the page contains span with id "skierowanie_plan_dataczas_all"
    if ($('#skierowanie_plan_dataczas_all').length) {
        console.log('Loading content for nowe-zlecenie-edycja page...');
        pageNoweZlecenieEdycja(); 
        return;
    }

    // check if the page contains span with class "class="templateListPageTitle" with text "Zlecenia badań" inside
    if ($('.templateListPageTitle').length && $('.templateListPageTitle').text().includes('Zlecenia badań')) {
        console.log('Loading content for lista-zleceń page...');
        pageListaZleceń();
        return;
    }

    // check if the page contains table with class templateEditTable and inside it a a div with id zleceniebadań inside it
    const templateEditTable = $('.templateEditTable');
    if (templateEditTable.length) {
        const zleceniebadań = templateEditTable.find('#zleceniebadań');
        if (zleceniebadań.length) {
            const p = zleceniebadań.find('p');
            const divEmpty = zleceniebadań.find('div');
            if(p.length && divEmpty.length) {
                //check if p tag contains text "Dodaj zlecenie badań" and div tag is empty
                if(p[0].textContent.includes('badań') && divEmpty[0].textContent.trim() === '') {
                    console.log('Loading content for nowe-zlecenie-selection page...');
                    pageNoweZlecenieSelection(); 
                    return;
                }
            }
            
        }
    }
    console.log('Medicus page loaded, but no specific content to enhance found.');

}




// Initial run
jQuery(function() {
    console.log('Medicus Assistant loaded.');

    checkPage();
    

});
