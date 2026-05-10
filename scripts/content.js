
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

function addGrBtn4ClickListener() {
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
            if ($button.length > 0) {
                $button.trigger('click');
                console.debug('Triggered click for button with name:', buttonName);
            } else {
                console.debug('No button found for name:', buttonName);
            }
        }
    });
}

//function to check if the loaded page is from Medicus
function isMedicusPage() {
    // if any of the checks are not true, return false

    // check if there is input element with name x_context inside form named "ar" inside tag center inside body, if not return false
    if ($('body > center > form[name="ar"] > input[name="x_context"]').length === 0) return false;

    // the same for "x_sys_context" input
    if ($('body > center > form[name="ar"] > input[name="x_sys_context"]').length === 0) return false;

    // same for "x_pacjent_ident_id" input
    if ($('body > center > form[name="ar"] > input[name="x_pacjent_ident_id"]').length === 0) return false;

    // check if there is a js script in head with src containing words "joperis.templates"
    if ($('head > script[src*="joperis.templates"]').length === 0) return false;

    return true; // All checks passed, it's a Medicus page
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
    // Check if the page is a Medicus page
    if (!isMedicusPage()) {
        console.log('Not a Medicus page, exiting...');
        return;
    }

    // when loading (async) is completed, then add the click listener but don't wait with the rest of the page loading, because it can be done in the meantime
    loadShortcutGroupsFromStorage().then(() => {
        addGrBtn4ClickListener();
    });

    if ($('.templateEditPageTitle').length && $('.templateEditPageTitle').text().includes('Dane medyczne wizyty')) {
        console.log('Loading content for dane-medyczne page...');
        pageDaneMedyczne();
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
