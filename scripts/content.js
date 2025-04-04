 
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
    function setImmediateAction(action) {
        const expirationTime = new Date().getTime() + 3 * 1000; // 3 seconds from now
        localStorage.setItem('immediateAction', action);
        localStorage.setItem('immediateActionExspirationTimestamp', expirationTime);
    }

    // function to return the immediate action saved in the local storage, if it exists and is not expired
    function getImmediateAction() {
        const action = localStorage.getItem('immediateAction');
        const expirationTimestamp = localStorage.getItem('immediateActionExpirationTimestamp');
        if (action && expirationTimestamp) {
            const now = new Date().getTime();
            if (now < parseInt(expirationTimestamp)) {
                return action; // Action is valid and not expired
            } else {
                clearImmediateAction(); // Action expired, clear it
            }
        }
        return null; // No valid action found
    }

    //function to clear the immediate action from local storage
    function clearImmediateAction() {
        localStorage.removeItem('immediateAction');
        localStorage.removeItem('immediateActionExpirationTimestamp');
    }
    


// Initial run
$(document).ready(() => {
    console.log('Medicus Assistant loaded.');

    // Check if the page is a Medicus page
    if (!isMedicusPage()) {
        console.log('Not a Medicus page, exiting...');
        return;
    }

    // check if the page contains span with id "skierowanie_plan_dataczas_all"
    if ($('#skierowanie_plan_dataczas_all').length) {
        addTomorrowMorningButtons();
    }

    
});
