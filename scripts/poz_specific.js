function addVisitTypeAutofillButtons(pageElements) {
    const visitTypeCell = $('#kontakt_typ_porady_all');
    if (visitTypeCell.length != 1) return; // No cell found

    const visitTypeSelector = visitTypeCell.find('select');
    if (visitTypeSelector.length != 1) return; // No select found
    if (visitTypeSelector.data('autofill-added')) return; // Button already added

    console.debug('Page elements:', pageElements);

    // create a button to set the visit type to "Teleporada"
    const pozGabBtn = $('<button type="button">').text('Gab').on('click', function() {
        // trigger click on the insertPoradaWMiejscuBtn, insertPoradaLekarskaIcd9Btn button
        if (pageElements.insertPoradaWMiejscuBtn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_poz_um_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === 'A121' || codeValue === 'A152' || codeValue === 'A155') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_poz_um_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_poz_um_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertPoradaWMiejscuBtn.trigger('click');
            console.debug('Triggered click on insertPoradaWMiejscuBtn');
        } else {
            console.error('insertPoradaWMiejscuBtn not found!');
        }
        
        if (pageElements.insertPoradaLekarskaIcd9Btn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_icd9_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === '89.02' || codeValue === '89.0099') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_icd9_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_icd9_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertPoradaLekarskaIcd9Btn.trigger('click');
            console.debug('Triggered click on insertPoradaLekarskaIcd9Btn');
        } else {
            console.error('insertPoradaLekarskaIcd9Btn not found!');
        }
        
        console.debug('POZ Gab button clicked, setting visit type and filling in details.');
        // set text of badaniePrzedmiotoweTextArea to empty if the current text is shorter than 10 characters
        if (pageElements.badaniePrzedmiotoweTextArea.val().trim().length < 10) {
            pageElements.badaniePrzedmiotoweTextArea.val('');
            console.debug('Cleared badaniePrzedmiotoweTextArea due to short content.');
        }

        // set the visit type to "POZGAB"
        visitTypeSelector.val('POZGAB').trigger('change');
        //get following options, make only the "POZGAB" option selected and the rest unselected
        $('select[name="kontakt_typ_porady"] option').each(function() {
            if ($(this).val().trim() === 'POZGAB') {
                $(this).prop('selected', true);
            } else {
                $(this).prop('selected', false);
            }
        });

        $('select[name="skladniki_procedury_8540"]').val('Gabinetowa');
        setToPorada();

    });

    //add the button after the visitTypeSelector
    visitTypeSelector.after(pozGabBtn);

    const pozTeleBtn = $('<button type="button">').text('Tele').on('click', function() {
        // trigger click on the insertTeleporadaBtn, insertPoradaLekarskaIcd9Btn button
        if (pageElements.insertTeleporadaBtn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_poz_um_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === 'A121' || codeValue === 'A152' || codeValue === 'A155') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_poz_um_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_poz_um_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertTeleporadaBtn.trigger('click');
            console.debug('Triggered click on insertTeleporadaBtn');
        } else {
            console.error('insertTeleporadaBtn not found!');
        }
        
        if (pageElements.insertTeleporadaIcd9Btn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_icd9_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === '89.02' || codeValue === '89.0099') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_icd9_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_icd9_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertTeleporadaIcd9Btn.trigger('click');
            console.debug('Triggered click on insertTeleporadaIcd9Btn');
        } else {
            console.error('insertTeleporadaIcd9Btn not found!');
        }
        
        console.debug('POZ Teleporada button clicked, setting visit type and filling in details.');
        // set text of badaniePrzedmiotoweTextArea to empty if the current text is shorter than 10 characters
        if (pageElements.badaniePrzedmiotoweTextArea.val().trim().length < 10) {
            pageElements.badaniePrzedmiotoweTextArea.val('Teleporada - nie badano przedmiotowo');
            console.debug('Cleared badaniePrzedmiotoweTextArea due to short content.');
        }

        // set the visit type to "POZTELE"
        visitTypeSelector.val('POZ').trigger('change');
        //get following options, make only the "POZ" option selected and the rest unselected
        $('select[name="kontakt_typ_porady"] option').each(function() {
            if ($(this).val().trim() === 'POZ') { //it's called POZ in code, but it actually mean POZ Teleporada
                $(this).prop('selected', true);
            } else {
                $(this).prop('selected', false);
            }
        });
        $('select[name="skladniki_procedury_8540"]').val('Teleporada');
        setToPorada();

    });

    //add the button after the previous button
    pozGabBtn.after(pozTeleBtn);

    const pozRecBtn = $('<button type="button">').text('Rec').on('click', function() {
        // trigger click on the insertPoradaReceptowaBtn, insertPoradaLekarskaIcd9Btn button
        if (pageElements.insertPoradaReceptowaBtn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_poz_um_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === 'A121' || codeValue === 'A152' || codeValue === 'A155') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_poz_um_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_poz_um_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertPoradaReceptowaBtn.trigger('click');
            console.debug('Triggered click on insertPoradaReceptowaBtn');
        } else {
            console.error('insertPoradaReceptowaBtn not found!');
        }
        
        if (pageElements.insertPoradaLekarskaIcd9Btn.length > 0) {
            const codeInput = $('input[name="kontakt_wykonanie_icd9_skrot_1"]');
            const codeValue = codeInput.val().trim();
            if (codeValue === '89.02' || codeValue === '89.0099') {
                const codeRemoveBtn = $('input[name="kontakt_wykonanie_icd9_skrot_1_clear"]');
                if (codeRemoveBtn.length > 0) {
                    codeRemoveBtn.trigger('click');
                    console.debug('Cleared existing code in kontakt_wykonanie_icd9_skrot_1');
                } else {
                    console.error('Code remove button not found!');
                }
            }
            pageElements.insertPoradaLekarskaIcd9Btn.trigger('click');
            console.debug('Triggered click on insertPoradaLekarskaIcd9Btn');
        } else {
            console.error('insertPoradaLekarskaIcd9Btn not found!');
        }
        
        console.debug('POZ Receptowa button clicked, setting visit type and filling in details.');
        // set text of badaniePrzedmiotoweTextArea to empty if the current text is shorter than 10 characters
        if (pageElements.badaniePrzedmiotoweTextArea.val().trim().length < 10) {
            pageElements.badaniePrzedmiotoweTextArea.val('Wizyta receptowa - nie badano przedmiotowo');
            console.debug('Cleared badaniePrzedmiotoweTextArea due to short content.');
        }

        // set the visit type to "REC"
        visitTypeSelector.val('REC').trigger('change');
        //get following options, make only the "REC" option selected and the rest unselected
        $('select[name="kontakt_typ_porady"] option').each(function() {
            if ($(this).val().trim() === 'REC') { 
                $(this).prop('selected', true);
            } else {
                $(this).prop('selected', false);
            }
        });
        $('select[name="skladniki_procedury_8540"]').val('');

        $('input[id="kontakt_rozpoznanie_1"]').val('Z76.0');
        $('input[name="kontakt_rozpoznanie_kod_icd_description"]').val('(Z76.0) Wydanie powtórnej recepty');
        setToPorada();

    });

    //add the button after the previous button
    pozTeleBtn.after(pozRecBtn);
    // Mark the button as added to prevent duplicates
    visitTypeSelector.data('autofill-added', true);

}

function addMassAndHeightChecker(pageElements) {
    const massInput = $('input[name="temp_pom_waga"]');
    const heightInput = $('input[name="temp_pom_wzrost"]');
    if (massInput.data('checker-added') || heightInput.data('checker-added')) return; // Checker already added
    const checkValues = function() {
        if (massInput.val()==='65' && heightInput.val()==='165') {
            massInput.css('background-color', '#d1736e').css('border', 'solid 2px red');
            heightInput.css('background-color', '#d1736e').css('border', 'solid 2px red');
        }else{
            massInput.css('background-color', '#ccff99').css('border', 'solid 2px green');
            heightInput.css('background-color', '#ccff99').css('border', 'solid 2px green');
        }
    };
    massInput.on('input', checkValues);
    heightInput.on('input', checkValues);

    // Mark the checker as added to prevent duplicates
    massInput.data('checker-added', true);
    heightInput.data('checker-added', true);
}

function pageDaneMedyczne(){
    //wywiad: find textarea with name "skladniki_procedury_1702" and check if there is only one
    const wywiadTextArea = $('textarea[name="skladniki_procedury_1702"]');
    if (wywiadTextArea.length != 1) return; // No textarea found

    //badanieprzedmiotowe: find textarea with name "skladniki_procedury_1708" and check if there is only one
    const badaniePrzedmiotoweTextArea = $('textarea[name="skladniki_procedury_1708"]');
    if (badaniePrzedmiotoweTextArea.length != 1) return; // No textarea found

    //wynikibadań: find textarea with name "skladniki_procedury_1709" and check if there is only one
    const wynikiBadanTextArea = $('textarea[name="skladniki_procedury_1709"]');
    if (wynikiBadanTextArea.length != 1) return; // No textarea found

    //rozpoznanieopisowe: find textarea with name "skladniki_procedury_1703" and check if there is only one
    const rozpoznanieOpisoweTextArea = $('textarea[name="skladniki_procedury_1703"]');
    if (rozpoznanieOpisoweTextArea.length != 1) return; // No textarea found

    //przebieg: find textarea with name "skladniki_procedury_1710" and check if there is only one
    const przebiegTextArea = $('textarea[name="skladniki_procedury_1710"]');
    if (przebiegTextArea.length != 1) return; // No textarea found

    //zalecenia: find textarea with name "skladniki_procedury_1711" and check if there is only one
    const zaleceniaTextArea = $('textarea[name="skladniki_procedury_1711"]');
    if (zaleceniaTextArea.length != 1) return; // No textarea found

    //zlecenia: find textarea with name "skladniki_procedury_1704" and check if there is only one
    const zleceniaTextArea = $('textarea[name="skladniki_procedury_1704"]');
    if (zleceniaTextArea.length != 1) return; // No textarea found

    //procedury_usługowe table: find table with id "kontakt_wykonanie_poz_um_stat_1_all" and check if there is only one
    const proceduryUslugoweTable = $('#kontakt_wykonanie_poz_um_stat_1_all');
    if (proceduryUslugoweTable.length != 1) return; // No table found
    //porada w miejscu udzielania śwadczeń btn: find input with type button and value "A121" inside procedury_usługowe table
    const insertPoradaWMiejscuBtn = proceduryUslugoweTable.find('input[type="button"][value="A121"]');
    //teleporada btn: find input with type button and value "A152" inside procedury_usługowe table
    const insertTeleporadaBtn = proceduryUslugoweTable.find('input[type="button"][value="A152"]');
    //porada receptowa btn: find input with type button and value "A155" inside procedury_usługowe table
    const insertPoradaReceptowaBtn = proceduryUslugoweTable.find('input[type="button"][value="A155"]');

    //procedury_icd9 table: find table with id "kontakt_wykonanie_icd9_ilosc_1_all" and check if there is only one
    const proceduryIcd9Table = $('#kontakt_wykonanie_icd9_ilosc_1_all');
    if (proceduryIcd9Table.length != 1) return; // No table found
    // porada lekarska icd9 btn: find input with type button and value "89.02" inside procedury_icd9 table
    const insertPoradaLekarskaIcd9Btn = proceduryIcd9Table.find('input[type="button"][value="89.02"]');
    //teleporada icd9 btn: find input with type button and value "89.03" inside procedury_icd9 table
    const insertTeleporadaIcd9Btn = proceduryIcd9Table.find('input[type="button"][value="89.0099"]');

    // Create an object with all page-specific elements
    const pageElements = {
        // textareas
        wywiadTextArea: wywiadTextArea,
        badaniePrzedmiotoweTextArea: badaniePrzedmiotoweTextArea,
        wynikiBadanTextArea: wynikiBadanTextArea,
        rozpoznanieOpisoweTextArea: rozpoznanieOpisoweTextArea,
        przebiegTextArea: przebiegTextArea,
        zaleceniaTextArea: zaleceniaTextArea,
        zleceniaTextArea: zleceniaTextArea,
        // procedury usługowe buttons
        insertPoradaWMiejscuBtn: insertPoradaWMiejscuBtn,
        insertTeleporadaBtn: insertTeleporadaBtn,
        insertPoradaReceptowaBtn: insertPoradaReceptowaBtn,
        // procedury ICD9 buttons
        insertPoradaLekarskaIcd9Btn: insertPoradaLekarskaIcd9Btn,
        insertTeleporadaIcd9Btn: insertTeleporadaIcd9Btn
    };

    console.log('Page elements found:', pageElements);
    addVisitTypeAutofillButtons(pageElements);
    addMassAndHeightChecker(pageElements);
}

function setToPorada(){
    const kodSwiadczeniaSelector = $('select[name="kontakt_kod_swiadczenia"]');
    if(kodSwiadczeniaSelector.length !== 1) {
        console.error('kodSwiadczeniaSelector not found or multiple found!');
        return;
    }
    if(kodSwiadczeniaSelector.val() === '4') {
        return;
    }
    kodSwiadczeniaSelector.val('4');//.trigger('change');
}