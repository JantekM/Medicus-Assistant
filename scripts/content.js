
'use strict';

function getSettingValue(settings, path, fallback) {
    if (!globalThis.MASettings || !settings) return fallback;
    const value = globalThis.MASettings.getPath(settings, path);
    return value === undefined ? fallback : value;
}

function getIcdFeatureFlags(settings) {
    const isIcdHelperRequested = getSettingValue(settings, 'features.enableIcdHelper', true);
    const isIcdRecentCodesEnabled = getSettingValue(settings, 'features.enableIcdRecentCodes', true);
    const isIcdFavoriteCodesEnabled = getSettingValue(settings, 'features.enableIcdFavoriteCodes', true);
    const isIcdHelperEnabled = isIcdHelperRequested && (isIcdRecentCodesEnabled || isIcdFavoriteCodesEnabled);

    return {
        isIcdHelperEnabled,
        isIcdRecentCodesEnabled,
        isIcdFavoriteCodesEnabled
    };
}

function addTomorrowMorningButtons(settings) {
    const tomorrowHour = getSettingValue(settings, 'schedule.tomorrowHour', 7);
    const tomorrowMinute = getSettingValue(settings, 'schedule.tomorrowMinute', 45);
    const tomorrowCutoffHour = getSettingValue(settings, 'schedule.tomorrowCutoffHour', 8);
    const tomorrowCutoffMinute = getSettingValue(settings, 'schedule.tomorrowCutoffMinute', 0);

    const paddedHour = String(tomorrowHour).padStart(2, '0');
    const paddedMinute = String(tomorrowMinute).padStart(2, '0');

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
        .attr('title', `Wybierz datę i godzinę na najbliższe rano o ${paddedHour}:${paddedMinute}`)
        .addClass('tomorrow-morning-btn')
        .css({
            marginLeft: '5px',
            //padding: '2px 6px',
            //fontSize: '90%'
        })
        .on('click', function () {
            // check if the nearest configured morning time is today or tomorrow
            const now = new Date();
            let morning = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const cutoffMinutes = tomorrowCutoffHour * 60 + tomorrowCutoffMinute;
            if (nowMinutes >= cutoffMinutes) {
                // set tomorrow's date and time when cutoff hour has passed
                morning.setDate(now.getDate() + 1);
            }

            // set the configured time
            morning.setHours(tomorrowHour, tomorrowMinute, 0, 0);

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
                $('[name="skierowanie_plan_dataczas_hour"]').val(paddedHour);
                $('[name="skierowanie_plan_dataczas_minutes"]').val(paddedMinute);
            }
        });


    // Add the button after the "Now" button
    $nowButton.after($morningBtn);
    // Add a non breaking space before the button
    $nowButton.after('&nbsp;');
    // Mark the button as added to prevent duplicates
    $nowButton.data('tomorrow-added', true);



}

function parseLastRequestedDateInfo(rawDateText) {
    if (!rawDateText) return null;

    const normalizedText = String(rawDateText)
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalizedText) return null;

    const extractedDateTextMatch = normalizedText.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}|\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})(?:\s+\d{1,2}:\d{1,2}(?::\d{1,2})?)?/);
    const candidateDateText = extractedDateTextMatch ? extractedDateTextMatch[0] : normalizedText;

    const formats = [
        /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::\d{1,2})?)?$/,
        /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::\d{1,2})?)?$/
    ];

    for (let i = 0; i < formats.length; i += 1) {
        const match = candidateDateText.match(formats[i]);
        if (!match) continue;

        let year = null;
        let month = null;
        let day = null;
        if (i === 0) {
            year = Number(match[1]);
            month = Number(match[2]);
            day = Number(match[3]);
        } else {
            day = Number(match[1]);
            month = Number(match[2]);
            year = Number(match[3]);
        }

        const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            continue;
        }

        const paddedMonth = String(month).padStart(2, '0');
        const paddedDay = String(day).padStart(2, '0');
        return {
            dateValue: parsedDate.getTime(),
            dateKey: `${year}-${paddedMonth}-${paddedDay}`,
            dateLabel: `${year}-${paddedMonth}-${paddedDay}`
        };
    }

    return null;
}

function getMostRecentRequestedTestsRows() {
    const anchor = $('#profile_zestawybadańwyszukajidodajbadanie_ctrlf_począteknazwy');
    if (anchor.length !== 1) return $();

    const th = anchor.parent('th');
    if (th.length !== 1 || !th.hasClass('templateEditTableSection')) return $();

    const trDividingLine = th.parent('tr');
    if (trDividingLine.length !== 1 || trDividingLine.hasClass('rowedit')) return $();

    const trAutoPackages = trDividingLine.next('tr.rowedit');
    if (trAutoPackages.length !== 1) return $();

    return trAutoPackages.add(trAutoPackages.nextAll('tr.rowedit'));
}

function collectMostRecentRequestedTestsData() {
    const rows = getMostRecentRequestedTestsRows();
    if (rows.length === 0) return null;

    const candidates = [];
    const seenCheckboxes = new Set();

    rows.each(function () {
        const $row = $(this);
        const $mainCheckboxes = $row.find('input[type="checkbox"][name^="wykonanie_poz_pak_"]');
        if ($mainCheckboxes.length === 0) return;

        $mainCheckboxes.each(function () {
            const mainCheckbox = $(this);
            const checkboxName = mainCheckbox.attr('name') || '';
            if (/^wykonanie_poz_cito_/i.test(checkboxName)) return;
            if (seenCheckboxes.has(this)) return;

            const $cell = mainCheckbox.closest('td');
            const $lineRow = $cell.closest('tr');
            if ($lineRow.length !== 1) return;

            const $lineTds = $lineRow.find('td');
            if ($lineTds.length < 2) return;

            const $dateCell = $($lineTds[1]);
            const $dateNode = $dateCell.find('p').first();
            const rawDateLabel = ($dateNode.length ? $dateNode.text() : $dateCell.text()).trim();
            const prefixMatch = rawDateLabel.match(/Ostatnio zlecono:\s*(.+)$/i);
            if (!prefixMatch) return;

            const dateText = prefixMatch[1].trim();
            const parsed = parseLastRequestedDateInfo(dateText);
            if (!parsed) return;

            seenCheckboxes.add(this);
            candidates.push({
                mainCheckbox,
                dateValue: parsed.dateValue,
                dateKey: parsed.dateKey,
                dateLabel: parsed.dateLabel
            });
        });
    });

    if (candidates.length === 0) return null;

    const mostRecentDateValue = candidates.reduce((maxValue, item) => {
        return Math.max(maxValue, item.dateValue);
    }, Number.NEGATIVE_INFINITY);

    const targets = candidates.filter((item) => item.dateValue === mostRecentDateValue);
    if (targets.length === 0) return null;

    return {
        targets,
        dateLabel: targets[0].dateLabel,
        dateKey: targets[0].dateKey
    };
}

function setMostRecentTestsButtonText($button, dateLabel = null) {
    const label = dateLabel ? `Ostatnio zlecone (${dateLabel})` : 'Ostatnio zlecone';
    if ($button.is('input')) {
        $button.val(label);
    } else {
        $button.text(label);
    }
}

function refreshMostRecentTestsButtonText() {
    const $button = $('.ma-lastly-requested-tests-btn').first();
    if ($button.length !== 1) return;

    const data = collectMostRecentRequestedTestsData();
    setMostRecentTestsButtonText($button, data ? data.dateLabel : null);

    const hasDate = Boolean(data);
    $button.prop('disabled', !hasDate);
    $button.attr(
        'title',
        hasDate
            ? 'Zaznacz badania z najnowszej daty "Ostatnio zlecono"'
            : 'Brak dat "Ostatnio zlecono" do zaznaczenia'
    );
}

function selectMostRecentlyRequestedTestsByDate() {
    const data = collectMostRecentRequestedTestsData();
    if (!data) {
        console.log('No parseable "Ostatnio zlecono" dates found.');
        return { selectedCount: 0, dateLabel: null };
    }

    const targetDateKey = data.dateKey;
    let newlySelected = 0;

    for (let pass = 0; pass < 10; pass += 1) {
        const passData = collectMostRecentRequestedTestsData();
        if (!passData) break;

        const targetsForDate = passData.targets.filter((target) => target.dateKey === targetDateKey);
        if (targetsForDate.length === 0) break;

        const uncheckedTargets = targetsForDate.filter((target) => !target.mainCheckbox.prop('checked'));
        if (uncheckedTargets.length === 0) break;

        // Prefer real click so page scripts attached to checkbox onclick run.
        uncheckedTargets.forEach((target) => {
            target.mainCheckbox.trigger('click');
        });

        // Fallback when click handlers do not toggle the checkbox.
        uncheckedTargets.forEach((target) => {
            if (!target.mainCheckbox.prop('checked')) {
                target.mainCheckbox.prop('checked', true).trigger('change');
            }
        });

        newlySelected += uncheckedTargets.length;
    }

    return {
        selectedCount: newlySelected,
        dateLabel: data.dateLabel
    };
}

function refreshDuplicateHighlightAfterAutoSelection() {
    if (typeof applyDiagnosticTestDuplicateHighlight !== 'function') return;

    let attempts = 0;
    const maxAttempts = 12;
    const intervalMs = 70;

    const refresh = () => {
        applyDiagnosticTestDuplicateHighlight();
        attempts += 1;
        if (attempts < maxAttempts) {
            setTimeout(refresh, intervalMs);
        }
    };

    refresh();
}

function addMostRecentRequestedTestsButton() {
    if ($('.ma-lastly-requested-tests-btn').length) {
        refreshMostRecentTestsButtonText();
        return;
    }

    const $button = $('<button type="button">')
        .addClass('ma-lastly-requested-tests-btn')
        .attr('title', 'Zaznacz badania z najnowszej daty "Ostatnio zlecono"')
        .on('click', function () {
            const result = selectMostRecentlyRequestedTestsByDate();
            setMostRecentTestsButtonText($button, result.dateLabel);
            if (typeof initDiagnosticTestDuplicateHighlighting === 'function') {
                initDiagnosticTestDuplicateHighlighting();
            } else if (typeof applyDiagnosticTestDuplicateHighlight === 'function') {
                applyDiagnosticTestDuplicateHighlight();
            }
            refreshDuplicateHighlightAfterAutoSelection();
            console.log('Selected tests from latest "Ostatnio zlecono" date:', result.selectedCount, result.dateLabel || 'n/a');
        });

    const $okButton = $('button[type="submit"][name="btn_ok"], input[type="submit"][name="btn_ok"]').first();
    if ($okButton.length === 1) {
        $okButton.after($button);
        $okButton.after('&nbsp;');
    } else {
        // Fallback for layouts without standard header action buttons.
        const $span = $('#skierowanie_plan_dataczas_all');
        if ($span.length !== 1) return;
        const $nowButton = $span.find('input[type="button"]').filter(function () {
            return $(this).val() === 'Teraz';
        }).first();
        if ($nowButton.length !== 1) return;
        $nowButton.after($button);
        $nowButton.after('&nbsp;');
    }

    refreshMostRecentTestsButtonText();

    let refreshAttempts = 0;
    const refreshTimer = setInterval(() => {
        refreshMostRecentTestsButtonText();
        refreshAttempts += 1;
        if (refreshAttempts >= 10 || $('.ma-lastly-requested-tests-btn').length === 0) {
            clearInterval(refreshTimer);
        }
    }, 250);
}

const MA_TEST_BATCHES_STORAGE_KEY = 'testBatches';
const MA_TEST_BATCHES_UI_STORAGE_KEY = 'testBatchesUiState';

function getTestBatchesState() {
    if (!globalThis.MATestBatchesState) {
        globalThis.MATestBatchesState = {
            batches: [],
            isEditMode: false,
            isCollapsed: false,
            showUnavailableTests: false,
            isSyncing: false,
            batchListMaxHeightPx: 0,
            mainIndex: new Map(),
            keysByNormalized: new Map()
        };
    }
    return globalThis.MATestBatchesState;
}

function configureTestBatchesSettings(settings) {
    const state = getTestBatchesState();
    const configuredValue = getSettingValue(
        settings,
        'tests.batchesMaxHeightPx',
        getSettingValue(settings, 'tests.batchesMaxHeight', 0)
    );
    const parsedValue = Number(configuredValue);

    state.batchListMaxHeightPx = Number.isFinite(parsedValue) && parsedValue > 0
        ? Math.round(parsedValue)
        : 0;
}

function normalizeBatchName(name) {
    return String(name || '').replace(/\s+/g, ' ').trim();
}

function getUniqueBatchName(baseName, batches, excludedId = null) {
    const normalizedBase = normalizeBatchName(baseName) || 'Nowy zestaw';
    const names = new Set(
        batches
            .filter((batch) => batch && batch.id !== excludedId)
            .map((batch) => normalizeBatchName(batch.name).toLowerCase())
    );

    if (!names.has(normalizedBase.toLowerCase())) {
        return normalizedBase;
    }

    let index = 2;
    while (names.has(`${normalizedBase} (${index})`.toLowerCase())) {
        index += 1;
    }
    return `${normalizedBase} (${index})`;
}

function getBatchPanelRoot() {
    return $('#ma-test-batches-panel');
}

function getBatchPanelTargetAnchor() {
    const anchor = $('#profile_zestawybadańwyszukajidodajbadanie_ctrlf_począteknazwy');
    if (anchor.length !== 1) return null;

    const headerTr = anchor.closest('tr');
    if (headerTr.length !== 1) return null;

    const targetTr = headerTr.next('tr');
    if (targetTr.length !== 1) return null;

    const targetCell = targetTr.find('td,th').first();
    if (targetCell.length !== 1) return null;

    return targetCell;
}

function refreshMainTestIndexForBatches() {
    const state = getTestBatchesState();
    const rows = getMostRecentRequestedTestsRows();
    const index = new Map();
    const keysByNormalized = new Map();

    rows.each(function () {
        const $row = $(this);
        const $mainCheckboxes = $row.find('input[type="checkbox"][name^="wykonanie_poz_pak_"]');
        if ($mainCheckboxes.length === 0) return;

        $mainCheckboxes.each(function () {
            const $checkbox = $(this);
            const checkboxName = $checkbox.attr('name') || '';
            if (/^wykonanie_poz_cito_/i.test(checkboxName)) return;

            const labelText = $checkbox.closest('td').find('label').first().text().trim() || checkboxName;
            const normalizedLabel = normalizeDiagnosticTestLabel(labelText);
            if (!checkboxName) return;

            index.set(checkboxName, {
                key: checkboxName,
                normalizedLabel,
                labelText,
                $checkbox
            });

            if (normalizedLabel) {
                if (!keysByNormalized.has(normalizedLabel)) {
                    keysByNormalized.set(normalizedLabel, []);
                }
                keysByNormalized.get(normalizedLabel).push(checkboxName);
            }
        });
    });

    state.mainIndex = index;
    state.keysByNormalized = keysByNormalized;
}

function getMainSelectedTestKeys() {
    const state = getTestBatchesState();
    const selected = [];

    state.mainIndex.forEach((item, testKey) => {
        if (item && item.$checkbox && item.$checkbox.prop('checked')) {
            selected.push(testKey);
        }
    });

    return selected;
}

function migrateLegacyBatchTestKeys() {
    const state = getTestBatchesState();
    let changed = false;

    state.batches.forEach((batch) => {
        const sourceKeys = Array.isArray(batch.testKeys) ? batch.testKeys : [];
        const migrated = [];
        const seen = new Set();

        sourceKeys.forEach((value) => {
            if (typeof value !== 'string' || value.trim() === '') return;
            const rawKey = value.trim();

            let resolvedKey = null;
            if (state.mainIndex.has(rawKey)) {
                resolvedKey = rawKey;
            } else {
                const normalized = normalizeDiagnosticTestLabel(rawKey);
                const candidates = state.keysByNormalized.get(normalized) || [];
                if (candidates.length > 0) {
                    resolvedKey = candidates[0];
                }
            }

            if (!resolvedKey || seen.has(resolvedKey)) return;
            seen.add(resolvedKey);
            migrated.push(resolvedKey);
        });

        if (migrated.length !== sourceKeys.length || migrated.some((key, idx) => key !== sourceKeys[idx])) {
            batch.testKeys = migrated;
            batch.modifiedAt = Date.now();
            changed = true;
        }
    });

    return changed;
}

async function loadTestBatchesFromStorage() {
    const result = await chrome.storage.local.get([MA_TEST_BATCHES_STORAGE_KEY]);
    const raw = result[MA_TEST_BATCHES_STORAGE_KEY];
    const state = getTestBatchesState();

    if (!Array.isArray(raw)) {
        state.batches = [];
        state.isEditMode = false;
        return;
    }

    state.batches = raw
        .filter((batch) => batch && typeof batch === 'object')
        .map((batch) => {
            const sourceKeys = Array.isArray(batch.testKeys)
                ? batch.testKeys
                : Array.isArray(batch.testLabels)
                    ? batch.testLabels
                    : [];
            const testKeys = sourceKeys
                .filter((key) => typeof key === 'string' && key.trim() !== '')
                .map((key) => key.trim());
            const seen = new Set();
            const uniqueTestKeys = testKeys.filter((key) => {
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            return {
                id: batch.id || `batch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: normalizeBatchName(batch.name) || 'Nowy zestaw',
                testKeys: uniqueTestKeys,
                createdAt: Number(batch.createdAt) || Date.now(),
                modifiedAt: Number(batch.modifiedAt) || Date.now()
            };
        });

    state.isEditMode = Boolean(state.isEditMode);
}

async function saveTestBatchesToStorage() {
    const state = getTestBatchesState();
    await chrome.storage.local.set({
        [MA_TEST_BATCHES_STORAGE_KEY]: state.batches.map((batch) => ({
            id: batch.id,
            name: batch.name,
            testKeys: Array.isArray(batch.testKeys) ? batch.testKeys : [],
            createdAt: batch.createdAt,
            modifiedAt: batch.modifiedAt
        }))
    });
}

async function loadTestBatchesUiState() {
    const state = getTestBatchesState();
    const result = await chrome.storage.local.get([MA_TEST_BATCHES_UI_STORAGE_KEY]);
    const raw = result[MA_TEST_BATCHES_UI_STORAGE_KEY];

    if (!raw || typeof raw !== 'object') {
        state.isCollapsed = false;
        state.showUnavailableTests = false;
        return;
    }

    state.isCollapsed = Boolean(raw.isCollapsed);
    state.showUnavailableTests = Boolean(raw.showUnavailableTests);
}

async function saveTestBatchesUiState() {
    const state = getTestBatchesState();
    await chrome.storage.local.set({
        [MA_TEST_BATCHES_UI_STORAGE_KEY]: {
            isCollapsed: Boolean(state.isCollapsed),
            showUnavailableTests: Boolean(state.showUnavailableTests)
        }
    });
}

function getBatchById(batchId) {
    const state = getTestBatchesState();
    return state.batches.find((batch) => batch.id === batchId) || null;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setMainCheckboxForTestKey(testKey, checked) {
    const state = getTestBatchesState();
    const item = state.mainIndex.get(testKey);
    if (!item || !item.$checkbox) return;

    const isChecked = item.$checkbox.prop('checked');
    if (isChecked === checked) return;

    item.$checkbox.trigger('click');
    if (item.$checkbox.prop('checked') !== checked) {
        item.$checkbox.prop('checked', checked).trigger('change');
    }
}

function setBatchCheckboxesForTestKey(testKey, checked) {
    const selectorValue = String(testKey).replace(/"/g, '\\"');
    $(`.ma-batch-test-checkbox[data-test-key="${selectorValue}"]`).prop('checked', checked);
}

function refreshDuplicateHighlightNow() {
    if (typeof initDiagnosticTestDuplicateHighlighting === 'function') {
        initDiagnosticTestDuplicateHighlighting();
    } else if (typeof applyDiagnosticTestDuplicateHighlight === 'function') {
        applyDiagnosticTestDuplicateHighlight();
    }
}

function applyBatchSelectionForKeys(testKeys, checked) {
    const state = getTestBatchesState();
    state.isSyncing = true;
    testKeys.forEach((testKey) => {
        setMainCheckboxForTestKey(testKey, checked);
        setBatchCheckboxesForTestKey(testKey, checked);
    });
    state.isSyncing = false;

    refreshDuplicateHighlightNow();
    refreshDuplicateHighlightAfterAutoSelection();
}

function clearAllSelectedTestsFromBatches() {
    const state = getTestBatchesState();
    const selectedKeys = [];

    state.mainIndex.forEach((item, testKey) => {
        if (item && item.$checkbox && item.$checkbox.prop('checked')) {
            selectedKeys.push(testKey);
        }
    });

    if (selectedKeys.length === 0) {
        $('.ma-batch-test-checkbox').prop('checked', false);
        return;
    }

    applyBatchSelectionForKeys(selectedKeys, false);
}

function renderSingleBatchRows(batch, isEditMode) {
    const state = getTestBatchesState();
    const testKeys = Array.isArray(batch.testKeys) ? batch.testKeys : [];
    if (!testKeys.length) {
        return '<div class="ma-batches-empty">Zestaw nie zawiera badań.</div>';
    }

    const rowsHtml = testKeys.map((testKey, index) => {
        const item = state.mainIndex.get(testKey);
        const displayLabel = item ? item.labelText : testKey;
        const isChecked = item ? item.$checkbox.prop('checked') : false;
        const isMissing = !item;
        if (isMissing && !state.showUnavailableTests) return '';
        const dragAttr = isEditMode ? 'draggable="true"' : '';

        return `
            <div class="ma-batch-row${isMissing ? ' ma-batch-row-missing' : ''}" data-batch-id="${escapeHtml(batch.id)}" data-index="${index}" ${dragAttr}>
                <button type="button" class="ma-batch-up-to-btn" data-batch-id="${escapeHtml(batch.id)}" data-index="${index}" ${isMissing ? 'disabled' : ''}>↧</button>
                <input type="checkbox" class="ma-batch-test-checkbox" data-batch-id="${escapeHtml(batch.id)}" data-test-key="${escapeHtml(testKey)}" ${isChecked ? 'checked' : ''} ${isMissing ? 'disabled' : ''}>
                <span class="ma-batch-test-label">${escapeHtml(displayLabel)}</span>
                ${isEditMode ? `<button type="button" class="ma-batch-remove-test-btn" data-batch-id="${escapeHtml(batch.id)}" data-index="${index}" title="Usuń z zestawu">X</button>
                <button type="button" class="ma-batch-move-btn" data-batch-id="${escapeHtml(batch.id)}" data-direction="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" class="ma-batch-move-btn" data-batch-id="${escapeHtml(batch.id)}" data-direction="down" data-index="${index}" ${index === testKeys.length - 1 ? 'disabled' : ''}>↓</button>` : ''}
            </div>
        `;
    }).join('');

    if (rowsHtml.trim() === '') {
        return '<div class="ma-batches-empty">Brak dostępnych badań w tym zestawie.</div>';
    }

    return rowsHtml;
}

function renderTestBatchesPanel() {
    const $panel = getBatchPanelRoot();
    if ($panel.length !== 1) return;

    const state = getTestBatchesState();
    const countText = state.batches.length === 1 ? '1 zestaw' : `${state.batches.length} zestawy`;
    const isEditMode = Boolean(state.isEditMode);
    const isCollapsed = Boolean(state.isCollapsed);
    const showUnavailableTests = Boolean(state.showUnavailableTests);
    const batchListStyle = state.batchListMaxHeightPx > 0
        ? ` style="max-height:${state.batchListMaxHeightPx}px;overflow-y:auto;overflow-x:hidden;"`
        : '';

    const cardsHtml = state.batches.map((batch) => {
        return `
            <section class="ma-batch-card" data-batch-id="${escapeHtml(batch.id)}">
                <header class="ma-batch-card-header">
                    <h4 class="ma-batch-card-title">${escapeHtml(batch.name)}</h4>
                    <div class="ma-batch-card-actions${isEditMode ? '' : ' ma-batch-card-actions-hidden'}">
                        <button type="button" class="ma-batches-add-selected" data-batch-id="${escapeHtml(batch.id)}">dodaj znaznaczone</button>
                        <button type="button" class="ma-batches-rename" data-batch-id="${escapeHtml(batch.id)}">Zmień nazwę</button>
                        <button type="button" class="ma-batches-delete" data-batch-id="${escapeHtml(batch.id)}">Usuń</button>
                        <button type="button" class="ma-batches-move" data-batch-id="${escapeHtml(batch.id)}" data-direction="up">↑</button>
                        <button type="button" class="ma-batches-move" data-batch-id="${escapeHtml(batch.id)}" data-direction="down">↓</button>
                    </div>
                </header>
                <div class="ma-batch-card-list"${batchListStyle}>
                    ${renderSingleBatchRows(batch, isEditMode)}
                </div>
            </section>
        `;
    }).join('');

    const bodyHtml = `
        <div class="ma-batches-toolbar">
            <button type="button" class="ma-batches-toggle">${isCollapsed ? 'Pokaż zestawy' : 'Ukryj zestawy'}</button>
            <span class="ma-batches-count">${countText}</span>
            <button type="button" class="ma-batches-create">Utwórz zestaw</button>
            <button type="button" class="ma-batches-edit-mode">${isEditMode ? 'Zakończ edycję' : 'Edytuj zestawy'}</button>
            <button type="button" class="ma-batches-clear-all">Odznacz wszystko</button>
            <button type="button" class="ma-batches-toggle-unavailable">${showUnavailableTests ? 'Ukryj niedostępne' : 'Pokaż niedostępne'}</button>
        </div>
        <div id="ma-test-batches-list" class="ma-batches-list${isCollapsed ? ' ma-batches-list-collapsed' : ''}">
            ${cardsHtml || '<div class="ma-batches-empty">Brak zestawu. Zaznacz badania i kliknij "Utwórz zestaw".</div>'}
        </div>
    `;

    $panel.toggleClass('ma-batches-collapsed', isCollapsed);
    $panel.html(bodyHtml);
}

function moveBatchLabel(batchId, fromIndex, toIndex) {
    const batch = getBatchById(batchId);
    if (!batch) return;
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= batch.testKeys.length || toIndex >= batch.testKeys.length) return;

    const [item] = batch.testKeys.splice(fromIndex, 1);
    batch.testKeys.splice(toIndex, 0, item);
    batch.modifiedAt = Date.now();
}

function moveBatchCard(fromIndex, toIndex) {
    const state = getTestBatchesState();
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= state.batches.length || toIndex >= state.batches.length) return;

    const [item] = state.batches.splice(fromIndex, 1);
    state.batches.splice(toIndex, 0, item);
}

function bindTestBatchesEvents() {
    $(document)
        .off('click.MA_batchesToggle')
        .on('click.MA_batchesToggle', '.ma-batches-toggle', async function () {
            const state = getTestBatchesState();
            state.isCollapsed = !state.isCollapsed;
            await saveTestBatchesUiState();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesToggleUnavailable')
        .on('click.MA_batchesToggleUnavailable', '.ma-batches-toggle-unavailable', async function () {
            const state = getTestBatchesState();
            state.showUnavailableTests = !state.showUnavailableTests;
            await saveTestBatchesUiState();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesCreate')
        .on('click.MA_batchesCreate', '.ma-batches-create', async function () {
            refreshMainTestIndexForBatches();
            const selectedKeys = getMainSelectedTestKeys();
            if (!selectedKeys.length) {
                alert('Najpierw zaznacz badania, które mają tworzyć zestaw.');
                return;
            }

            const state = getTestBatchesState();
            const inputName = window.prompt('Nazwa nowego zestawu:', 'Nowy zestaw');
            if (inputName === null) return;

            const uniqueName = getUniqueBatchName(inputName, state.batches);
            const now = Date.now();
            const newBatch = {
                id: `batch-${now}-${Math.random().toString(16).slice(2)}`,
                name: uniqueName,
                testKeys: selectedKeys,
                createdAt: now,
                modifiedAt: now
            };

            state.batches.push(newBatch);
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesEditMode')
        .on('click.MA_batchesEditMode', '.ma-batches-edit-mode', function () {
            const state = getTestBatchesState();
            state.isEditMode = !state.isEditMode;
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesClearAll')
        .on('click.MA_batchesClearAll', '.ma-batches-clear-all', function () {
            clearAllSelectedTestsFromBatches();
        })
        .off('click.MA_batchesRename')
        .on('click.MA_batchesRename', '.ma-batches-rename', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');
            const batch = getBatchById(batchId);
            if (!batch) return;

            const inputName = window.prompt('Nowa nazwa zestawu:', batch.name);
            if (inputName === null) return;
            const uniqueName = getUniqueBatchName(inputName, state.batches, batch.id);
            batch.name = uniqueName;
            batch.modifiedAt = Date.now();
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesDelete')
        .on('click.MA_batchesDelete', '.ma-batches-delete', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');
            const batch = getBatchById(batchId);
            if (!batch) return;
            if (!window.confirm(`Usunąć zestaw "${batch.name}"?`)) return;

            state.batches = state.batches.filter((item) => item.id !== batch.id);
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesAddSelected')
        .on('click.MA_batchesAddSelected', '.ma-batches-add-selected', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');
            const batch = getBatchById(batchId);
            if (!batch) return;

            refreshMainTestIndexForBatches();
            const selectedKeys = getMainSelectedTestKeys();
            if (!selectedKeys.length) return;

            const keySet = new Set(batch.testKeys);
            selectedKeys.forEach((testKey) => {
                if (!keySet.has(testKey)) {
                    keySet.add(testKey);
                    batch.testKeys.push(testKey);
                }
            });
            batch.modifiedAt = Date.now();
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchesMoveCard')
        .on('click.MA_batchesMoveCard', '.ma-batches-move', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');
            const direction = $(this).data('direction');
            const fromIndex = state.batches.findIndex((batch) => batch.id === batchId);
            if (fromIndex < 0) return;
            const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
            moveBatchCard(fromIndex, toIndex);
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('click.MA_batchRemoveTest')
        .on('click.MA_batchRemoveTest', '.ma-batch-remove-test-btn', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');
            const batch = getBatchById(batchId);
            if (!batch) return;
            const index = Number($(this).data('index'));
            if (!Number.isFinite(index) || index < 0 || index >= batch.testKeys.length) return;

            batch.testKeys.splice(index, 1);
            batch.modifiedAt = Date.now();
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('change.MA_batchesCheckbox')
        .on('change.MA_batchesCheckbox', '.ma-batch-test-checkbox', function () {
            const state = getTestBatchesState();
            if (state.isSyncing) return;

            const testKey = $(this).data('test-key');
            const checked = $(this).prop('checked');
            applyBatchSelectionForKeys([testKey], checked);
        })
        .off('click.MA_batchesUpTo')
        .on('click.MA_batchesUpTo', '.ma-batch-up-to-btn', function () {
            const state = getTestBatchesState();
            const batchId = $(this).data('batch-id');
            const batch = getBatchById(batchId);
            if (!batch) return;

            const index = Number($(this).data('index'));
            if (!Number.isFinite(index) || index < 0) return;

            const keysToSelect = batch.testKeys
                .slice(0, index + 1)
                .filter((testKey) => state.mainIndex.has(testKey));
            applyBatchSelectionForKeys(keysToSelect, true);
        })
        .off('click.MA_batchesMoveBtn')
        .on('click.MA_batchesMoveBtn', '.ma-batch-move-btn', async function () {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');

            const index = Number($(this).data('index'));
            const direction = $(this).data('direction');
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            moveBatchLabel(batchId, index, targetIndex);
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('dragstart.MA_batchesDnd')
        .on('dragstart.MA_batchesDnd', '.ma-batch-row', function (event) {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const batchId = $(this).data('batch-id');

            const payload = {
                batchId,
                index: Number($(this).data('index'))
            };
            event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(payload));
        })
        .off('dragover.MA_batchesDnd')
        .on('dragover.MA_batchesDnd', '.ma-batch-row', function (event) {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;

            event.preventDefault();
        })
        .off('drop.MA_batchesDnd')
        .on('drop.MA_batchesDnd', '.ma-batch-row', async function (event) {
            const state = getTestBatchesState();
            if (!state.isEditMode) return;
            const toBatchId = $(this).data('batch-id');

            event.preventDefault();
            let payload = null;
            try {
                payload = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
            } catch {
                return;
            }

            if (!payload || payload.batchId !== toBatchId) return;
            const fromIndex = Number(payload.index);
            const toIndex = Number($(this).data('index'));
            if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) return;

            moveBatchLabel(toBatchId, fromIndex, toIndex);
            await saveTestBatchesToStorage();
            renderTestBatchesPanel();
        })
        .off('change.MA_batchesMainSync')
        .on('change.MA_batchesMainSync', 'tr.rowedit input[type="checkbox"][name^="wykonanie_poz_pak_"]', function () {
            const state = getTestBatchesState();
            if (state.isSyncing) return;

            const testKey = $(this).attr('name') || '';
            if (!testKey || /^wykonanie_poz_cito_/i.test(testKey)) return;

            const checked = $(this).prop('checked');
            state.isSyncing = true;
            setBatchCheckboxesForTestKey(testKey, checked);
            state.isSyncing = false;
        });
}

async function addUserTestBatchesPanel() {
    const $targetCell = getBatchPanelTargetAnchor();
    if (!$targetCell || $targetCell.length !== 1) return;

    let $panel = getBatchPanelRoot();
    if ($panel.length === 0) {
        $panel = $('<div id="ma-test-batches-panel" class="ma-test-batches-panel"></div>');
        $targetCell.prepend($panel);
    }

    refreshMainTestIndexForBatches();
    await loadTestBatchesFromStorage();
    await loadTestBatchesUiState();
    if (migrateLegacyBatchTestKeys()) {
        await saveTestBatchesToStorage();
    }
    bindTestBatchesEvents();
    renderTestBatchesPanel();
}

async function addICDHelperPanel(targetTable, codeInput = null, descriptionInput = null, settings = null) {
    const resolvedSettings = settings || (globalThis.MASettings ? await globalThis.MASettings.getMergedSettings() : null);
    const { isIcdRecentCodesEnabled, isIcdFavoriteCodesEnabled } = getIcdFeatureFlags(resolvedSettings);
    const maxRecentCodesDisplayed = getSettingValue(resolvedSettings, 'icd.maxRecentCodesDisplayed', 50);
    const maxFrequentCodesDisplayed = getSettingValue(resolvedSettings, 'icd.maxFrequentCodesDisplayed', 50);

    if (!isIcdRecentCodesEnabled && !isIcdFavoriteCodesEnabled) {
        return;
    }

    const favoritedICDCodesPromise = isIcdFavoriteCodesEnabled
        ? chrome.storage.local.get(['favoritedICDCodes'])
        : Promise.resolve({ favoritedICDCodes: [] });
    const usedICDCodesCountPromise = isIcdRecentCodesEnabled
        ? chrome.storage.local.get(['usedICDCodesCount'])
        : Promise.resolve({ usedICDCodesCount: {} });
    const lastlyUsedICDCodesPromise = isIcdRecentCodesEnabled
        ? chrome.storage.local.get(['usedICDCodes'])
        : Promise.resolve({ usedICDCodes: [] });

    
    // make a new table with two columns, one for the button with a code and one for the description, and add it to tdTarget
    const newTable = $('<table>').css('width', '100%').attr('id', 'customlyAddedIcdCodesTable').addClass('custom-icd-table');
    targetTable.after(newTable);

    let lastlyUsedTable = null;
    let mostFrequentlyUsedTable = null;
    let favoritedCodesTable = null;

    if (isIcdRecentCodesEnabled) {
        //Lastly used header and row
        const lastlyUsedHeaderRow = $('<tr>').addClass('custom-icd-header-row').addClass('custom-icd-lastly-used');
        const lastlyUsedHeaderCell = $('<td>').addClass('custom-icd-header-cell').addClass('custom-icd-lastly-used').append($('<div>').text('Ostatnio używane kody ICD').addClass('custom-icd-header-div').addClass('custom-icd-lastly-used'));
        lastlyUsedHeaderRow.append(lastlyUsedHeaderCell);
        newTable.append(lastlyUsedHeaderRow);

        const lastlyUsedRow = $('<tr>').addClass('custom-icd-row').addClass('custom-icd-lastly-used');
        const lastlyUsedCell = $('<td>').addClass('custom-icd-cell').addClass('custom-icd-lastly-used');
        const lastlyUsedDiv = $('<div>').addClass('custom-icd-div').addClass('custom-icd-lastly-used');
        lastlyUsedTable = $('<table>').attr('id', 'customlyAddedLastlyUsedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-lastly-used');
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
        mostFrequentlyUsedTable = $('<table>').attr('id', 'customlyAddedMostFrequentlyUsedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-most-frequently-used');
        mostFrequentlyUsedDiv.append(mostFrequentlyUsedTable);
        mostFrequentlyUsedCell.append(mostFrequentlyUsedDiv);
        mostFrequentlyUsedRow.append(mostFrequentlyUsedCell);
        newTable.append(mostFrequentlyUsedRow);
    }

    if (isIcdFavoriteCodesEnabled) {
        //favorited codes header and row
        const favoritedCodesHeaderRow = $('<tr>').addClass('custom-icd-header-row').addClass('custom-icd-favorited');
        const favoritedCodesHeaderCell = $('<td>').addClass('custom-icd-header-cell').addClass('custom-icd-favorited').append($('<div>').text('Ulubione kody ICD').addClass('custom-icd-header-div').addClass('custom-icd-favorited'));
        favoritedCodesHeaderRow.append(favoritedCodesHeaderCell);
        newTable.append(favoritedCodesHeaderRow);

        const favoritedCodesRow = $('<tr>').addClass('custom-icd-row').addClass('custom-icd-favorited');
        const favoritedCodesCell = $('<td>').addClass('custom-icd-cell').addClass('custom-icd-favorited');
        const favoritedCodesDiv = $('<div>').addClass('custom-icd-div').addClass('custom-icd-favorited');
        favoritedCodesTable = $('<table>').attr('id', 'customlyAddedFavoritedIcdCodesTable').addClass('custom-icd-table').addClass('custom-icd-favorited');
        favoritedCodesDiv.append(favoritedCodesTable);
        favoritedCodesCell.append(favoritedCodesDiv);
        favoritedCodesRow.append(favoritedCodesCell);
        newTable.append(favoritedCodesRow);
    }


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
    // limit to configured number of recent codes
    lastlyUsedICDCodes = lastlyUsedICDCodes.slice(0, maxRecentCodesDisplayed);


    if (isIcdRecentCodesEnabled && lastlyUsedICDCodes.length === 0) {
        console.error('No lastlyUsedICDCodes found in local storage.');
        //return;
    } else if (isIcdRecentCodesEnabled) {
        // change lastlyUsedICDCodes to be an array of unique codes, lookup their descriptions as a batch using background script, and for each code in the lastlyUsedICDCodes list, add a row to the new table with a button that has the code as text and a description next to it
        chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code: lastlyUsedICDCodes }, (response) => {
            const descriptions = response?.description || [];
            lastlyUsedICDCodes.forEach((code, index) => {
                const description = descriptions[index] || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes, isIcdFavoriteCodesEnabled);
                row.append(codeCell, descriptionCell);
                lastlyUsedTable.append(row);
            });
        });
}


    let usedICDCodesCount = await usedICDCodesCountPromise;
        usedICDCodesCount = usedICDCodesCount.usedICDCodesCount || {};
    // limit to configured number of frequent codes
    usedICDCodesCount = Object.fromEntries(Object.entries(usedICDCodesCount).slice(0, maxFrequentCodesDisplayed));
    
    if (isIcdRecentCodesEnabled && Object.keys(usedICDCodesCount).length === 0) {
        console.error('No usedICDCodesCount found in local storage.');
        //return;
    } else if (isIcdRecentCodesEnabled) {
        // for each code in the frequentlyUsedIcdCodes list, add a row to the new table with a button that has the code as text and a description next to it
        const usedCodesList = Object.keys(usedICDCodesCount);
        chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code: usedCodesList }, (response) => {
            const descriptions = response?.description || [];
            usedCodesList.forEach((code, index) => {
                const description = descriptions[index] || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes, isIcdFavoriteCodesEnabled);
                row.append(codeCell, descriptionCell);
                mostFrequentlyUsedTable.append(row);
            });
        });
    }
    
    if (isIcdFavoriteCodesEnabled && favoritedICDCodes.length === 0) {
        console.error('No favoritedICDCodes found in local storage.');
        
    } else if (isIcdFavoriteCodesEnabled) {
        // for each code in the frequentlyUsedIcdCodes list, add a row to the new table with a button that has the code as text and a description next to it
        chrome.runtime.sendMessage({ type: 'lookupIcdDescription', code: favoritedICDCodes }, (response) => {
            const descriptions = response?.description || [];
            favoritedICDCodes.forEach((code, index) => {
                const description = descriptions[index] || '';
                const row = $('<tr>');
                const codeCell = $('<td>').append($('<button type="button">').text(code).on('click', function() { putIcdCodeIntoInput(code, description, codeInput, descriptionInput); }));
                const descriptionCell = $('<td>');
                const descriptionSpan = $('<span>').text(description);
                descriptionCell.append(descriptionSpan);
                addFavoriteCheckbox(descriptionSpan, code, favoritedICDCodes, isIcdFavoriteCodesEnabled);
                row.append(codeCell, descriptionCell);
                favoritedCodesTable.append(row);
            });
        });
    }

}

function addICDHelperButtons(settings){

    const HOVER_DELAY_MS = getSettingValue(settings, 'icd.popupShowDelayMs', 200);
    const HIDE_DELAY_MS = getSettingValue(settings, 'icd.popupHideDelayMs', 1000);

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
        addICDHelperPanel(table, codeInput, descriptionInput, settings);
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
            // also set title to the same description
            $(element).attr('title', description);
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
                // also set title to the same description
                descriptionInput.attr('title', description);
            }
            hidePopup();
            return;
        }
    }

    
}

function addPostBtnListener(settings) {
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
            const maxStoredUsedCodes = getSettingValue(settings, 'icd.maxStoredUsedCodes', 500);
            chrome.storage.local.get(['usedICDCodes']).then((result) => {
                let usedICDCodes = result.usedICDCodes || [];
                // add the new codes to the beginning of the list
                usedICDCodes = icdCodes.concat(usedICDCodes);
                // keep only the newest configured amount
                usedICDCodes = usedICDCodes.slice(0, maxStoredUsedCodes);
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

function addFavoriteCheckbox(followingElement, code, favoritedICDCodes, isIcdFavoriteCodesEnabled = true) {
    if (!isIcdFavoriteCodesEnabled) return;

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

function enhanceTOTPInput() {
    // check if there is an input of type text and name starting with "temp_totpX" where X is a number with at least 6 digits
    const totpInput = $('input[type="text"][name^="temp_totp"]');
    if(totpInput.length === 0) {
        console.debug('No TOTP input found on the page.');
        return;
    }
    // check if the number of digits in the name is at least 6
    const name = totpInput.attr('name');
    const match = name.match(/^temp_totp(\d{6,})$/);
    if (!match) {
        console.debug('TOTP input name does not have at least 6 digits.');
        return;
    }
    // get the number of digits from the name
    const patientId = match[1];

    // check if totpInput has a sibling of type submit and name "temp_ewus_X" where X is the same number of digits as in the totpInput name (patient ID)
    const submitButton = $(`input[type="submit"][name="temp_ewus_${patientId}"]`);
    if(submitButton.length === 0) {
        console.debug('No corresponding submit button found for TOTP input.');
        return;
    }

    // add a input change listener to the totpInput, when the value changes, if it has 6 digits, click the submit button
    totpInput.on('input', function() {
        const value = $(this).val();
        if(/^\d{6}$/.test(value)) {
            console.debug('TOTP entered, checking eWUŚ status.');
            submitButton.trigger('click');
        }
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

function normalizeDiagnosticTestLabel(labelText) {
    if (!labelText) return '';
    return String(labelText)
        .replace(/\bCITO\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function getDiagnosticTestRows() {
    const anchor = $('#profile_zestawybadańwyszukajidodajbadanie_ctrlf_począteknazwy');
    if (anchor.length !== 1) return $();

    const th = anchor.parent('th');
    if (th.length !== 1 || !th.hasClass('templateEditTableSection')) return $();

    const trDividingLine = th.parent('tr');
    if (trDividingLine.length !== 1 || trDividingLine.hasClass('rowedit')) return $();

    const trAutoPackages = trDividingLine.next('tr.rowedit');
    if (trAutoPackages.length !== 1) return $();

    return trAutoPackages.nextAll('tr.rowedit');
}

function collectDiagnosticTestGroups() {
    const groups = new Map();
    const rows = getDiagnosticTestRows();

    rows.each(function () {
        const $row = $(this);
        const $innerRow = $row.find('tr').first();
        if ($innerRow.length !== 1) return;

        const $tds = $innerRow.find('td');
        if ($tds.length !== 3) return;

        const $firstCell = $($tds[0]);
        const mainCheckbox = $firstCell.find('input[type="checkbox"]').first();
        const $label = $firstCell.find('label').first();
        if (mainCheckbox.length !== 1 || $label.length !== 1) return;

        const normalizedLabel = normalizeDiagnosticTestLabel($label.text());
        if (!normalizedLabel) return;

        if (!groups.has(normalizedLabel)) {
            groups.set(normalizedLabel, []);
        }
        groups.get(normalizedLabel).push({
            $row,
            mainCheckbox
        });
    });

    return groups;
}

function applyDiagnosticTestDuplicateHighlight() {
    const groups = collectDiagnosticTestGroups();

    groups.forEach((items) => {
        if (items.length < 2) return;

        const checkedCount = items.filter((item) => item.mainCheckbox.prop('checked')).length;
        const conflict = checkedCount >= 2;
        const anyChecked = checkedCount >= 1;

        items.forEach((item) => {
            const isChecked = item.mainCheckbox.prop('checked');
            item.$row.toggleClass('ma-diagnostic-test-duplicate-muted', anyChecked && !isChecked);
            item.$row.toggleClass('ma-diagnostic-test-duplicate-conflict', conflict && isChecked);
        });
    });
}

function initDiagnosticTestDuplicateHighlighting() {
    const rows = getDiagnosticTestRows();
    if (rows.length === 0) return;

    if (!document.documentElement.dataset.maDiagnosticDuplicatesReady) {
        $(document)
            .off('change.MA_diagnosticDuplicates')
            .on('change.MA_diagnosticDuplicates', 'tr.rowedit input[type="checkbox"]', function () {
                const $checkbox = $(this);
                if (!$checkbox.is(':checkbox')) return;

                const $row = $checkbox.closest('tr.rowedit');
                if ($row.length !== 1) return;

                const $innerRow = $row.find('tr').first();
                if ($innerRow.length !== 1) return;

                const mainCheckbox = $innerRow.find('td').first().find('input[type="checkbox"]').first();
                if (mainCheckbox.length !== 1 || mainCheckbox[0] !== $checkbox[0]) return;

                applyDiagnosticTestDuplicateHighlight();
            });

        const observerTarget = rows.first().closest('table')[0] || rows.first()[0].parentElement || document.body;
        const refreshLater = (() => {
            let timer = null;
            return () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    applyDiagnosticTestDuplicateHighlight();
                }, 0);
            };
        })();

        const observer = new MutationObserver(() => {
            refreshLater();
        });
        observer.observe(observerTarget, { childList: true, subtree: true });

        let refreshAttempts = 0;
        const refreshTimer = setInterval(() => {
            applyDiagnosticTestDuplicateHighlight();
            refreshAttempts += 1;
            if (refreshAttempts >= 8) {
                clearInterval(refreshTimer);
            }
        }, 200);

        document.documentElement.dataset.maDiagnosticDuplicatesReady = '1';
        document.documentElement.dataset.maDiagnosticDuplicatesObserver = '1';
        globalThis.MADiagnosticDuplicateObserver = observer;
    }

    applyDiagnosticTestDuplicateHighlight();
}

async function checkPage(){
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

    const settings = globalThis.MASettings
        ? await globalThis.MASettings.getMergedSettings()
        : null;
    
    // when loading (async) is completed, then add the click listener but don't wait with the rest of the page loading, because it can be done in the meantime
    const {
        isIcdHelperEnabled,
        isIcdRecentCodesEnabled,
        isIcdFavoriteCodesEnabled
    } = getIcdFeatureFlags(settings);

    if (getSettingValue(settings, 'features.enableShortcutGroupMemory', true)) {
        loadShortcutGroupsFromStorage().then(() => {
            addGrBtn4ClickListener();
        });
    }
    if (isIcdRecentCodesEnabled) {
        addPostBtnListener(settings);
    }
    if (isIcdHelperEnabled) {
        addICDHelperButtons(settings);
    }
    if (getSettingValue(settings, 'features.enableTotpAutoSubmit', true)) {
        enhanceTOTPInput();
    }
    

    if ($('.templateEditPageTitle').length && $('.templateEditPageTitle').text().includes('Dane medyczne wizyty')) {
        console.log('Loading content for dane-medyczne page...');
        pageDaneMedyczne(settings);
        return;
    }

    if ($('.templateListPageTitle').length && $('.templateListPageTitle').text().includes('Wizyty użytkownika')) {
        console.log('Loading content for wizyty-użytkownika page...');
        //pageWizytyUzytkownika(); // WIP
        return;
    }

     if ($('.templateListPageTitle').length && $('.templateListPageTitle').text().includes('Rozpoznania (ICD-10)')) {
        console.log('Loading content for rozpoznania-icd-10 popup page...');
        if (isIcdHelperEnabled && isIcdFavoriteCodesEnabled) {
            pageIcdPopup(); 
        }
        return;
    }

    // check if the page contains span with id "skierowanie_plan_dataczas_all"
    if ($('#skierowanie_plan_dataczas_all').length) {
        console.log('Loading content for nowe-zlecenie-edycja page...');
        configureTestBatchesSettings(settings);
        addMostRecentRequestedTestsButton();
        await addUserTestBatchesPanel();
        pageNoweZlecenieEdycja(settings); 
        initDiagnosticTestDuplicateHighlighting();
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
