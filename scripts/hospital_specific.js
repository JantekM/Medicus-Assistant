async function pageNoweZlecenieEdycja(){ //plan dataczas page
    addTomorrowMorningButtons();

    const action = await getImmediateAction();
    if (action) {
        console.log('Immediate action found:', action);
        // check if the action is "duplicateRequest"
        if (action === 'duplicateRequest') {
            const id = chrome.storage.local.get('duplicateRequestId').then((result) => {
                return result.duplicateRequestId;
            });
            //const requestedTests = JSON.parse(localStorage.getItem('requestedTests'));
            const requestedTests = await chrome.storage.local.get('requestedTests').then((result) => {
                return result.requestedTests;
            });
            console.log('Filling tests:', requestedTests);
            // call the function to fill in the form with the requested tests
            fillInFormWithRequestedTests(requestedTests);
            // clear the immediate action
            //clearImmediateAction();
        }
    }
}

function fillInFormWithRequestedTests(requestedTests) {
    //first, find the div with id "profile_zestawybadańwyszukajidodajbadanie_ctrlf_począteknazwy" and check if it exists
    const div_ctrl_f = $('#profile_zestawybadańwyszukajidodajbadanie_ctrlf_począteknazwy');
    if (div_ctrl_f.length === 0) return; // No div found
    // find the parent of the div and check if it is a th tag
    const th = div_ctrl_f.parent('th');
    if (th.length === 0) return; // No th tag found
    //check if the th tag has a class "templateEditTableSection"
    if (!th.hasClass('templateEditTableSection')) return; // No templateEditTableSection class found
    // find the parent of the th tag and check if it is a tr tag
    const tr_dividing_line = th.parent('tr');
    if (tr_dividing_line.length === 0) return; // No tr tag found
    //check if the tr has not class "rowedit"
    if (tr_dividing_line.hasClass('rowedit')) return; // Shouldn't be a rowedit class

    // find the next tr tag after the tr_dividing_line and check if it has class "rowedit"
    const tr_auto_packages = tr_dividing_line.next('tr.rowedit');
    if (tr_auto_packages.length === 0) return; // No tr tag found

    // find all the sibling tr tags after the tr_auto_packages that have class "rowedit"
    const tr_tests = tr_auto_packages.nextAll('tr.rowedit');
    if (tr_tests.length === 0) return; // No tr tag found

    // OPIS ZLECENIA
    //find textearea with name "skierowanie_opis_skierowania" and check if there is only one
    const requestDescription = $('textarea[name="skierowanie_opis_skierowania"]');
    if (requestDescription.length !== 1) return; // No textarea found or more than one found
    //if the textarea is empty, fill it with the additionalInfo from requestedTests
    if (requestDescription.val().trim() === '' && requestedTests && requestedTests.additionalInfo) {
        requestDescription.val(requestedTests.additionalInfo);
    }

    // ROZPOZNANIE
    // find input of type text and name "skierowanie_kod_icd10" and check if it's empty
    const icd10Input = $('input[name="skierowanie_kod_icd10"]');
    if (icd10Input.length !== 1) return; // No input found or more than one found
    // if it's empty, fill it with the icd10 code from requestedTests
    if (icd10Input.val().trim() === '' && requestedTests && requestedTests.icd10) {
        // get ICD code from trimming the icd10 code from requestedTests by getting the text before first space
        const icd10Code = requestedTests.icd10.split(' ')[0].trim();
        // set the value of the input to the icd10 code
        icd10Input.val(icd10Code);
    }

    // CZAS WYKONANIA
    // find the input button with name "skierowanie_plan_dataczas_default_values_button" and if there is only one
    const timeInputButton = $('input[name="skierowanie_plan_dataczas_default_values_button"]');
    if (timeInputButton.length !== 2) return; // No input found or more than one found
    // now click it
    timeInputButton[1].click();

    // setNowskierowanie_plan_dataczas();



    // for each following tags, find its children with class "templateEditTableSection" and check if it has a class "templateEditTableSection" (include the index of the tr tag in the function)

    tr_tests.each(function(index) {
        console.log('Checking tr tag with index:', index);
        const $tr = $(this);
        let label_text = null;
        let main_checkbox = null;
        let cito_checkbox = null;
        let last_date = null;

        // find the tr tag inside this tr tag 
        const $trInside = $tr.find('tr');
        if ($trInside.length === 0) return; // No tr tag found
        // the 3 td tags inside $trInside tag
        const $tds = $trInside.find('td');
        if ($tds.length !== 3) return; // No td tag found or more than one found
        // in the first td tag find input with type checkbox 
        const $td1 = $($tds[0]);
        main_checkbox = $td1.find('input[type="checkbox"]');

        // in the first td tag find the label tag and get its text
        const $label = $td1.find('label');
        if ($label.length === 0) return; // No label tag found
        label_text = $label.text().trim();

        // in the second td tag find the p tag and get its text
        const $td2 = $($tds[1]);
        const $p = $td2.find('p')[0];
        if ($p.length === 0) return; // No p tag found
        const lastDateFullText = trimSpaces($p.textContent.trim());
        
        if (lastDateFullText === ''){
            last_date = null;
        }else{
            //remove the "Ostatnio zlecono: " from the text
            last_date = lastDateFullText.replace('Ostatnio zlecono: ', '').trim();
        }

        // in the thid td tag find input with type checkbox
        const $td3 = $($tds[2]);
        cito_checkbox = $td3.find('input[type="checkbox"]');
        // if there is no checkbox, return
        if (cito_checkbox.length === 0) return; // No checkbox found

        // // if label_text matches any of the fullName value in the requestedTests array, get that requestedTest array
        // let testsList = requestedTests.testedParameters;
        
        // // see if you can find a test in testsList with the fullName equal to label_text
        // const test = testsList.find(test => test.fullName === label_text);

        const requestedTest = requestedTests.testedParameters.find(test => {
            trimSpaces(test.fullName.replace(' CITO ')) === label_text
        });
        // if requestedTest is not found, return
        if (!requestedTest) return; // No requestedTest found

        // check if the test was cancelled, if so, return
        if (requestedTest.cancelled) return; // Test was cancelled

        // set the checkbox to checked if it is not already checked
        if (!main_checkbox.prop('checked')) {
            main_checkbox.prop('checked', true);
        }
        // if the requestedTest has a cito property, set the cito checkbox to checked if it is not already checked
        if (requestedTest.isCITO && !cito_checkbox.prop('checked')) {
            cito_checkbox.prop('checked', true);
        }

        console.log('Requesting test:', label_text);
        return;
    });


}

function pageNoweZlecenieSelection(){
    console.log('Nowe zlecenie selection page loaded.');
    

    chrome.storage.local.get('immediateAction').then((result) => {
        if(result.immediateAction === 'duplicateRequest') {
            $('#temp_wybor_zlec2').prop('checked', true);
            
            //find first form with name "ar" and submit it
            const form = $('form[name="ar"]').first();
            if (form.length) {
                form.submit();
            } else {
                console.error('Form not found!');
            }
        }
    });

    
}

function duplicateRequest(id) {
    const requestedTests = scrapeRequestedTests(id);
    // set the immediate action to "duplicateRequest" with 3 seconds expiration time
    setImmediateAction('duplicateRequest', 10);
    chrome.storage.local.set({duplicateRequestId: id, requestedTests: requestedTests});
    
    console.log('Requested tests:', requestedTests);
}

function pageListaZleceń(){ //list of orders page
    // get tr tags with class "rowlist"
    const $rows = $('tr.rowlist');
    // iterate over each row extract its id from data-record-id attribute and call scrapeRequestedTests function
    $rows.each(function() {
        const id = $(this).data('record-id');
        if (id) {
            //console.log('Scraped requested tests:', scrapeRequestedTests(id));

            //check if the row has a request from LABORATORIUM
            const $tdLab = $(this).find('td:nth-child(4)');
            const text = $tdLab.text().trim().replace('&nbsp;', '').trim();
            if (text !== 'LABORATORIUM') return; // No LABORATORIUM request found

            // find the 5th td tag
            const $tdEdit = $(this).find('td:nth-child(8)');

            // modify the td tag by adding two br tags at the end
            $tdEdit.append('<br><br>');
            
            // find the table with id "listInfoSection" 
            const $table = $('#listInfoSection');
            // and within it find the div of class "add_r_t add_r" 
            const $div = $table.find('div.add_r_t.add_r');
            // and within it find the a tag with text "Dodaj zlecenie badań"
            const newRequestLink = $div.find('a:contains("badań")');
            if(newRequestLink.length >1){
                console.error('More than 1 "Dodaj zlecenie badań" button found?');
                return;
            }if(newRequestLink.length <1){
                console.error('No "Dodaj zlecenie badań" button found');
                return;
            }
            //if (!newRequestLink) newRequestLink = $div.find('a:contains("Dodaj&nbsp;zlecenie&nbsp;badań")');
            // get the href attribute of the link
            let href = newRequestLink.attr('href');
            // add '&temp_wybor_zlec=WZ' to the href
            //href += '&temp_wybor_zlec=WZ';
            // add '&skierowanie_typ_procedury=BADLAB" to the href
            // href += '&skierowanie_typ_procedury=BADLAB';

            href += '&MA_action=duplicateRequest&MA_id='+id;
            const duplicateTestLink = '<a target="_blank" class="MA-duplicate-button" href="'+href+'">Duplikuj badanie</a>'
                
            // add the link to the td tag and get it as a jQuery object
            const $duplicateLink = $(duplicateTestLink).on('click', function() {
                duplicateRequest(id);
            });
            // add the link to the td tag
            $tdEdit.append($duplicateLink);


        }

    });
}