'use strict';

// Utility function to process cell content
function processCellContent(cellContent) {
    return $(cellContent).html()
        .split('<br>')
        .map(item => item.trim().replace(/^\s*&nbsp;|&nbsp;\s*$/g, '').trim())
        .filter(item => item !== '');
}

function trimSpaces(text) {
    // replace any &nbsp; with a space
    text = text.replaceAll(/&nbsp;/g, ' ');
    text.trim();
    return text;
}

function scrapeRequestedTests(requestFormId) {
    
// function to scrape requested tests from the page given the id of the request form (using jquery where possible)

    //find tr with class rowlist and data-record-id equal to requestFormId (using jquery)
    const requestForm = $(`tr.rowlist[data-record-id="${requestFormId}"]`).get(0); // Get the first matching element

    if (!requestForm) { // Request form not found
        console.warn(`Warning, request form with ID ${requestFormId} not found.`);
        return null;
    }

    // Create an empty object to store the requested tests with all metadata
    const testRequest = {};


    const requestFormTdList = $(requestForm).find('td.templateListColumnTd'); // Get All the row cells in a list

    if (requestFormTdList.length === 0) { // No cells found in the request form
        console.warn(`Warning, no cells found in the request form with ID ${requestFormId}.`);
        return null;
    }

    // Get the first cell in the request form (the one with the test destination lab)
    const testDestinationCell = requestFormTdList[0]; // First cell contains the test destination lab




    //Get the inner text from the cell and divide it into a list by <br> tags, then trim the text
    const testDestination = processCellContent(testDestinationCell);
    if (testDestination.length === 0) { // No test destination found
        console.warn(`Warning, no test destination found in the request form with ID ${requestFormId}.`);
        return null;
    }
    if (testDestination.length != 2) { // Not the usual "Zlecenie badań" // "Badanie laboratoryjne" format
        console.error(`Warning, test destination format is not as expected in the request form with ID ${requestFormId}. The length of the cell is ${testDestination.length}. when it's supposed to be 2.`);
        return null; // panic?
    }

    // Add the test destination to the testRequest object, let it be named "testType"
    testRequest.testType = testDestination[1]; // Add the test destination to the list (pick the second element of the list, ignore the first one)



    // Get the second cell in the request form (the one with the date and time of the test)
    const testDateTimeCell = requestFormTdList[1]; // Second cell contains the date and time of the test


    //Get the inside of the <b> tag from inside the cell, then divide it into a list by <br> tags, then trim the text
    const testDateTime = processCellContent($(testDateTimeCell).find('b'));
    if (testDateTime.length === 0) { // No test DateTime found
        console.warn(`Warning, no test time of request found in the request form with ID ${requestFormId}.`);
        return null;
    }

    if (testDateTime.length > 2) { // Not the usual date format
        console.warn(`Warning, test DateTime format is not as expected in the request form with ID ${requestFormId}. The length of the cell is ${testDateTime.length}. when it's supposed to be 1 or 2.`);
        return null;
    }
    testRequest.dateOfRequest = testDateTime[0]; // Add the date of request to the list (pick the first element of the list)
    if (testDateTime.length === 2) {
        testRequest.datePlanned = testDateTime[1]; // Add the date planned to the list (pick the second element of the list)
    } else {
        testRequest.datePlanned = null; // No date planned found
    }


    // Get the third cell in the request form (the one with the test state - planned, material collected, material received and analyzed etc.)
    const testStateCell = requestFormTdList[2]; // Third cell contains the test state


    //Get the inner text from the cell, erase non-breaking-space, then trim the text
    const testState = processCellContent(testStateCell);
    if (testState === null) { // No test state found
        console.warn(`Warning, no test state found in the request form with ID ${requestFormId}, probably an old one? Or a request for consultation?.`);
        testRequest.testState = null; // No test state found
    } else {
        testRequest.testState = testState[0]; // Add the test state to the list







        /* the usual values of the test state are:
        "Do pobrania" - "To be collected"
        "Odebrano wyniki" - "Results received"

        Some older also are:
        "Wysłano poprawnie" - "sent properly", mainly ultrasound workshop
        */
    }


    // Get the fourth cell in the request form (the one with the destination lab where the test is done)
    const testDestinationLabCell = requestFormTdList[3]; // Fourth cell contains the destination lab where the test is done

    //Get the inner text from the cell, erase non-breaking-space, then trim the text
    const testDestinationLab = processCellContent(testDestinationLabCell);
    //check if the test destination lab is empty
    if (testDestinationLab === null) { // No test destination lab found
        console.warn(`Warning, no test destination lab found in the request form with ID ${requestFormId}.`);
        testRequest.testDestinationLab = null; // No test destination lab found
    } else {
        testRequest.testDestinationLab = testDestinationLab[0]; // Add the test destination lab to the list










        /* the usual values of the test destination lab are:
        "LABORATORIUM" - laboratory
        "Bank krwi" - blood bank
        "MIKROBIOLOGIA" - microbiology
        hospital word with its id - mainly for consultations

        Some rarer also are:
        "PRACOWNIA USG"
        "Diagnostyka Consilio Sp. z o.o. " - private laboratory, mainly for histhopathology
        */
    }


    // Get the fifth cell in the request form (the one with all the requested parameters to test)
    const testParametersCell = requestFormTdList[4]; // Fifth cell contains the requested parameters to test



    // The cell contains plain text (icd diagnosis) followed by a table tag
    //get both the text and the table
    const icdDiagnosis = $(testParametersCell).contents().filter(function () {
        return this.nodeType === Node.TEXT_NODE; // Filter only text nodes
    }).text().trim(); // Get the text and trim it
    if (!icdDiagnosis) {
        console.warn(`Warning, no icd diagnosis found in the request form with ID ${requestFormId}.`);
        testRequest.icdDiagnosis = null; // No icd diagnosis set (should have given an error before, right?)
    }
    else
        testRequest.icdDiagnosis = icdDiagnosis;

    //get the table and its tbody tag
    const testParametersTableBody = $(testParametersCell).find('tbody').get(0); // Get the tbody tag
    if (!testParametersTableBody) { // No table found in the request form

        console.warn(`Warning, no table with tested parameters found in the request form with ID ${requestFormId}.`);
        testRequest.testedParameters = null; // No table found
    } else {
        // check if it's a Laboratorium test, continue if it is, other test are not supported yet
        if (testDestinationLab[0] === 'LABORATORIUM') {
            // Get all the rows in the table body
            const testParametersRows = $(testParametersTableBody).find('tr');

            if (testParametersRows.length === 0) { // No rows found in the table body
                console.warn(`Warning, no rows found in the table with tested parameters in the request form with ID ${requestFormId}.`);
                testRequest.testedParameters = null; // No rows found
            } else {
                testRequest.testedParameters = []; // Initialize the tested parameters list
                testRequest.additionalInfo = null; // Initialize the additional info to null

                // Loop through each row in the table body
                testParametersRows.each((index, row) => {
                    // Get all the cells in the row
                    const testParameterCells = $(row).find('td');


                    if (testParameterCells.length === 0) { // No cells found in the row
                        console.warn(`Warning, no cells found in the row with tested parameters in the request form with ID ${requestFormId}.`);
                        return; // Skip to the next row
                    }

                    if (testParameterCells.length === 1) {
                        // get the inner text from the td cell, erase non-breaking-space, then trim the text
                        const cellContent = $(testParameterCells[0]).text().trim();
                        //console.debug(cellContent);

                        if (cellContent === '') {
                            return; //just a dotted line, skip to the next row
                        }

                        // if the td's colspan is 3, it's additional info, log it
                        if ($(testParameterCells[0]).attr('colspan') === '3') {
                            testRequest.additionalInfo = cellContent; // Add the additional info to the list
                        }


                    } else if (testParameterCells.length === 2) { //panic?
                        console.error(`Warning, the row with tested parameters in the request form with ID ${requestFormId} has 2 cells instead of 1 or 3! (WTF)`);
                    } else if (testParameterCells.length === 3) {
                        const testedParameter = {}; // Initialize the tested parameter object
                        const testNameAndModeTd = $(testParameterCells[0]); // First cell contains the test name and mode (CITO or not)
                        const currentTestState = $(testParameterCells[1]); // Second cell contains the current test state (planned, material collected, material received and analyzed etc. and if already analyzed - the print button)



                        // third cell contains only the non breaking space, so we can skip it
                        //get the inner html from the font tag inside first Td
                        const testNameAndModeFontTag = $(testNameAndModeTd).find('font').html();

                        // check if the font tag is inside a strike tag (strikethrough)
                        const isStrikethrough = $(testNameAndModeTd).find('strike').length > 0; // Check if the font tag is inside a strike tag (strikethrough)
                        testedParameter.cancelled = isStrikethrough;

                        // The font tag contains text, some of it's fragments are in bold, some are not
                        // divide the text into a list by <b> and </b> tags, then trim the text
                        const testNameAndModeList = testNameAndModeFontTag.split(/<\/?b>/).map(item => item.trim()).filter(item => item !== '');

                        // const testNameAndModeList = testNameAndModeFontTag.split('<b>').map(item => item.trim().replace(/<\/?b>/g, '').trim()).filter(item => item !== '');
                        const numOfItems = testNameAndModeList.length;

                        testedParameter.codeIcd9 = null;
                        testedParameter.fullName = trimSpaces(testNameAndModeList);

                        switch (numOfItems) {
                            case 1: // No CITO mode, no ICD-9 code, quite rare
                                testedParameter.isCITO = false;
                                testedParameter.name = testNameAndModeList[0];
                                // testRequest.testedParameters.push({ name: testNameAndModeList[0], mode: null, state: currentTestState.text().trim() });
                                break;
                            case 2: // CITO mode, test name with no ICD-9 code, e.g. blood glycemia "próba krzyżowa CITO" (pl. crossmatch test)
                                if (testNameAndModeList[1].includes('CITO')) {
                                    testedParameter.isCITO = true;
                                    testedParameter.name = testNameAndModeList[0].trim();
                                } else {
                                    console.error(`Warning, the row with number ${index} with tested parameters in the request form with ID ${requestFormId} has 2 items! But the second one is not CITO! Items: ${testNameAndModeList}`); //panic
                                }
                                // testRequest.testedParameters.push({ name: testNameAndModeList[0], mode: testNameAndModeList[1], state: currentTestState.text().trim() });
                                break;
                            case 3: // ICD-9 code present, no CITO
                                testedParameter.isCITO = false;
                                testedParameter.codeIcd9 = testNameAndModeList[1];
                                testedParameter.name = testNameAndModeList[0].replace(' (ICD-9:', '').trim(); // Remove the " (ICD-9:" part from the name
                                break;
                            case 4: // Not sure if this can happen, panic?
                                console.error(`Warning, the row with number ${index} with tested parameters in the request form with ID ${requestFormId} has 4 items! Shouldn't happen!`);
                                return;
                            case 5: // ICD-9 code present, CITO
                                testedParameter.isCITO = true;
                                testedParameter.codeIcd9 = testNameAndModeList[3];
                                testedParameter.name = testNameAndModeList[0].trim(); // Remove the " (ICD-9:" part from the name
                                break;
                            default:
                                // console.warn(`Warning, the row with tested parameters in the request form with ID ${requestFormId} has more than 2 items!`);
                                break;
                        }
                        //remove 2 ending non breaking spaces from the name
                        testedParameter.name = testedParameter.name.replace(/&nbsp;&nbsp;/g, '').trim(); // Remove the non-breaking spaces from the name

                        testRequest.testedParameters.push(testedParameter); // Add the tested parameter to the list
                    }


                });
            }
        } else {
            console.warn(`Warning, test destination lab is ${testDestinationLab[0]}, not LABORATORIUM in the request form with ID ${requestFormId} and is not yet supported.`);
            testRequest.testedParameters = null; // No tested parameters found
        }
    }



    return testRequest; // Return the list of requested tests
}

