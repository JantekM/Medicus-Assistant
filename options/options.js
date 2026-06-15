(function initOptionsPage() {
    'use strict';

    const presetsRoot = document.getElementById('presets-root');
    const backupRoot = document.getElementById('backup-root');
    const root = document.getElementById('settings-root');
    const saveBtn = document.getElementById('save-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const status = document.getElementById('status');

    const schema = globalThis.MASettings.schema;
    const defaults = globalThis.MASettings.getDefaultSettings();
    const EXPORT_FORMAT_VERSION = 1;
    const BACKUP_EXPORT_KEYS = [
        globalThis.MASettings.STORAGE_KEY,
        'favoritedICDCodes',
        'usedICDCodes',
        'usedICDCodesCount',
        'shortcutGroupsByProcedure',
        'testBatches',
        'testBatchesUiState'
    ];
    const BACKUP_SCOPE_DEFS = [
        { key: globalThis.MASettings.STORAGE_KEY, label: 'Ustawienia dodatku' },
        { key: 'favoritedICDCodes', label: 'Ulubione kody ICD' },
        { key: 'usedICDCodes', label: 'Historia użytych ICD (lista)' },
        { key: 'usedICDCodesCount', label: 'Częstość użycia ICD (liczniki)' },
        { key: 'shortcutGroupsByProcedure', label: 'Zapamiętane grupy skrótów' },
        { key: 'testBatches', label: 'Własne zestawy badań' },
        { key: 'testBatchesUiState', label: 'Stan panelu zestawów badań' }
    ];

    const FEATURE_KEYS_BY_PROFILE = {
        hospital: new Set([
            'features.enablePageNoweZlecenieEnhancements',
            'features.enableTomorrowMorningButton',
            'features.enableRecentRequestedTestsButton',
            'features.enableAutoFillRequestedTests',
            'features.enableDuplicateTestHighlighting',
            'features.enableTestBatchesPanel',
            'features.enableShortcutGroupMemory',
            'features.enableTotpAutoSubmit'
        ]),
        pozAos: new Set([
            'features.enablePageDaneMedyczneEnhancements',
            'features.enablePozVisitTypeButtons',
            'features.enableMassHeightTools',
            'features.enablePhoneNumberEnhancement',
            'features.enableIcdHelper',
            'features.enableIcdRecentCodes',
            'features.enableIcdFavoriteCodes',
            'features.enableShortcutGroupMemory',
            'features.enableTotpAutoSubmit'
        ])
    };

    function setStatus(message) {
        status.textContent = message;
        if (!message) return;
        setTimeout(() => {
            if (status.textContent === message) {
                status.textContent = '';
            }
        }, 2400);
    }

    function getTimestampForFileName() {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const sec = String(now.getSeconds()).padStart(2, '0');
        return `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
    }

    function triggerJsonDownload(fileName, jsonText) {
        const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
    }

    function sanitizeImportedPayload(parsed) {
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Nieprawidłowy format pliku kopii.');
        }

        const isWrapped = Object.prototype.hasOwnProperty.call(parsed, 'data');
        const candidateData = isWrapped ? parsed.data : parsed;
        if (!candidateData || typeof candidateData !== 'object' || Array.isArray(candidateData)) {
            throw new Error('Plik kopii nie zawiera sekcji data.');
        }

        const data = {};
        BACKUP_EXPORT_KEYS.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(candidateData, key)) {
                data[key] = candidateData[key];
            }
        });

        return data;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function deepMergePlain(base, patch) {
        const output = JSON.parse(JSON.stringify(base));
        if (!isPlainObject(patch)) return output;

        const mergeInto = (target, source) => {
            Object.keys(source).forEach((key) => {
                const sourceValue = source[key];
                if (isPlainObject(sourceValue) && isPlainObject(target[key])) {
                    mergeInto(target[key], sourceValue);
                    return;
                }
                target[key] = sourceValue;
            });
        };

        mergeInto(output, patch);
        return output;
    }

    function getSelectedBackupKeys() {
        const selectedKeys = [];
        if (!backupRoot) return selectedKeys;

        backupRoot.querySelectorAll('input[data-backup-key]').forEach((input) => {
            if (input.checked) {
                selectedKeys.push(input.dataset.backupKey);
            }
        });
        return selectedKeys;
    }

    function getBackupImportMode() {
        if (!backupRoot) return 'replace';
        const selected = backupRoot.querySelector('input[name="backup-import-mode"]:checked');
        return selected ? selected.value : 'replace';
    }

    async function exportBackup(selectedKeys) {
        if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
            throw new Error('Zaznacz co najmniej jedną kategorię danych do eksportu.');
        }

        const data = await chrome.storage.local.get(selectedKeys);
        const payload = {
            format: 'medicus-assistant-backup',
            version: EXPORT_FORMAT_VERSION,
            exportedAt: new Date().toISOString(),
            keys: selectedKeys,
            data
        };

        const jsonText = JSON.stringify(payload, null, 2);
        const fileName = `medicus-assistant-backup-${getTimestampForFileName()}.json`;
        triggerJsonDownload(fileName, jsonText);
        setStatus('Wyeksportowano kopię ustawień i danych.');
    }

    async function importBackupFromFile(file, options = {}) {
        if (!file) return;

        const selectedKeys = Array.isArray(options.selectedKeys) ? options.selectedKeys : BACKUP_EXPORT_KEYS;
        if (selectedKeys.length === 0) {
            throw new Error('Zaznacz co najmniej jedną kategorię danych do importu.');
        }
        const mergeOnly = Boolean(options.mergeOnly);

        const text = await file.text();
        let parsed = null;
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new Error('Nie udało się odczytać JSON z wybranego pliku.');
        }

        const importedData = sanitizeImportedPayload(parsed);
        const keysToSet = {};
        const keysToRemove = [];
        const selectedKeySet = new Set(selectedKeys);

        if (selectedKeySet.has(globalThis.MASettings.STORAGE_KEY) && Object.prototype.hasOwnProperty.call(importedData, globalThis.MASettings.STORAGE_KEY)) {
            const importedOverrides = importedData[globalThis.MASettings.STORAGE_KEY];
            const defaultsForMerge = globalThis.MASettings.getDefaultSettings();
            const mergedCandidate = isPlainObject(importedOverrides)
                ? deepMergePlain(defaultsForMerge, importedOverrides)
                : defaultsForMerge;
            const normalizedMerged = globalThis.MASettings.sanitizeSettings(mergedCandidate);
            await globalThis.MASettings.saveMergedAsOverrides(normalizedMerged);
        } else if (selectedKeySet.has(globalThis.MASettings.STORAGE_KEY) && !mergeOnly) {
            keysToRemove.push(globalThis.MASettings.STORAGE_KEY);
        }

        BACKUP_EXPORT_KEYS.forEach((key) => {
            if (key === globalThis.MASettings.STORAGE_KEY) return;
            if (!selectedKeySet.has(key)) return;

            if (Object.prototype.hasOwnProperty.call(importedData, key)) {
                keysToSet[key] = importedData[key];
            } else if (!mergeOnly) {
                keysToRemove.push(key);
            }
        });

        if (Object.keys(keysToSet).length > 0) {
            await chrome.storage.local.set(keysToSet);
        }
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
        }

        setStatus(mergeOnly ? 'Zaimportowano dane (tryb scalania).' : 'Zaimportowano dane (tryb zastępowania).');
        await render();
    }

    function getInputValue(field, input) {
        if (field.type === 'boolean') return input.checked;
        if (field.type === 'number') {
            const parsed = Number(input.value);
            return Number.isNaN(parsed) ? field.default : parsed;
        }
        return input.value;
    }

    function setInputValue(field, input, value) {
        if (field.type === 'boolean') {
            input.checked = Boolean(value);
            return;
        }
        input.value = value;
    }

    function valuesEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    function getFeatureFields() {
        const fields = [];
        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                if (field.type === 'boolean' && field.key.startsWith('features.')) {
                    fields.push(field);
                }
            });
        });
        return fields;
    }

    function getFieldInputByKey(settingKey) {
        const fieldEl = root.querySelector(`[data-setting-key="${settingKey}"]`);
        if (!fieldEl) return null;
        const input = fieldEl.querySelector('input');
        if (!input) return null;
        return { fieldEl, input };
    }

    function updateOverrideState(field, fieldEl, input, badgeEl) {
        const currentValue = getInputValue(field, input);
        const isOverridden = !valuesEqual(currentValue, field.default);
        fieldEl.classList.toggle('is-overridden', isOverridden);
        badgeEl.hidden = !isOverridden;
    }

    function buildField(field, currentSettings) {
        const fieldEl = document.createElement('div');
        fieldEl.className = 'field';
        fieldEl.dataset.settingKey = field.key;

        if (Array.isArray(field.dependsOn) && field.dependsOn.length > 0) {
            fieldEl.dataset.dependsOn = JSON.stringify(field.dependsOn);
            const dependencyNote = document.createElement('div');
            dependencyNote.className = 'dependency-note-row';
            dependencyNote.hidden = true;
            fieldEl.appendChild(dependencyNote);
        }

        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', `field-${field.key}`);

        const overrideBadge = document.createElement('span');
        overrideBadge.className = 'override-badge';
        overrideBadge.textContent = 'Zmienione';
        overrideBadge.hidden = true;
        label.appendChild(document.createTextNode(' '));
        label.appendChild(overrideBadge);

        const inputWrap = document.createElement('div');
        const input = document.createElement('input');
        input.id = `field-${field.key}`;

        if (field.type === 'boolean') {
            input.type = 'checkbox';
        } else if (field.type === 'number') {
            input.type = 'number';
            if (typeof field.min === 'number') input.min = String(field.min);
            if (typeof field.max === 'number') input.max = String(field.max);
            if (typeof field.step === 'number') input.step = String(field.step);
        } else {
            input.type = 'text';
        }

        const currentValue = globalThis.MASettings.getPath(currentSettings, field.key);
        setInputValue(field, input, currentValue);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `Domyślne: ${String(field.default)}`;

        inputWrap.appendChild(input);
        inputWrap.appendChild(meta);

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'reset-field';
        resetBtn.textContent = 'Domyślne';
        resetBtn.addEventListener('click', () => {
            setInputValue(field, input, field.default);
            updateOverrideState(field, fieldEl, input, overrideBadge);
        });

        input.addEventListener('input', () => {
            updateOverrideState(field, fieldEl, input, overrideBadge);
        });
        input.addEventListener('change', () => {
            updateOverrideState(field, fieldEl, input, overrideBadge);
        });

        updateOverrideState(field, fieldEl, input, overrideBadge);

        fieldEl.appendChild(label);
        fieldEl.appendChild(inputWrap);
        fieldEl.appendChild(resetBtn);

        if (field.longDescription) {
            const longDescription = document.createElement('div');
            longDescription.className = 'field-description-row';
            longDescription.textContent = field.longDescription;
            fieldEl.appendChild(longDescription);
        }

        return fieldEl;
    }

    function parseDependsOn(rawValue) {
        if (!rawValue) return [];
        try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function getCurrentFormValues() {
        const values = JSON.parse(JSON.stringify(defaults));
        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                const fieldEl = root.querySelector(`[data-setting-key="${field.key}"]`);
                if (!fieldEl) return;
                const input = fieldEl.querySelector('input');
                if (!input) return;
                const raw = getInputValue(field, input);
                globalThis.MASettings.setPath(values, field.key, raw);
            });
        });

        return globalThis.MASettings.sanitizeSettings(values);
    }

    function evaluateDependsOn(dependsOn, values) {
        if (!Array.isArray(dependsOn) || dependsOn.length === 0) {
            return { enabled: true, messages: [] };
        }

        const failedMessages = [];
        let enabled = true;

        dependsOn.forEach((rule) => {
            const expected = Object.prototype.hasOwnProperty.call(rule, 'equals') ? rule.equals : true;
            const current = globalThis.MASettings.getPath(values, rule.path);
            const isOk = current === expected;
            if (!isOk) {
                enabled = false;
                if (rule.message) failedMessages.push(rule.message);
            }
        });

        return { enabled, messages: failedMessages };
    }

    function applyDependencyState() {
        const values = getCurrentFormValues();

        root.querySelectorAll('[data-depends-on]').forEach((el) => {
            const dependsOn = parseDependsOn(el.dataset.dependsOn);
            const { enabled, messages } = evaluateDependsOn(dependsOn, values);
            const isDisabled = !enabled;

            el.classList.toggle('is-dependency-disabled', isDisabled);

            el.querySelectorAll('input, button.reset-field').forEach((control) => {
                control.disabled = isDisabled;
            });

            const note = el.querySelector('.dependency-note-row, .section-dependency-note');
            if (note) {
                note.hidden = !isDisabled;
                note.textContent = messages[0] || 'Ta opcja jest chwilowo niedostępna z powodu ustawień zależnych.';
            }
        });

        refreshSectionLayout(values);
    }

    function setSectionCollapsed(sectionEl, isCollapsed, rememberState = false) {
        sectionEl.classList.toggle('is-collapsed', Boolean(isCollapsed));
        if (rememberState) {
            sectionEl.dataset.userCollapsed = isCollapsed ? '1' : '0';
        }
    }

    function refreshSectionLayout(values) {
        const allSections = Array.from(root.querySelectorAll('.section'));
        const enabledSections = [];
        const disabledSections = [];

        allSections.forEach((sectionEl) => {
            const dependsOn = parseDependsOn(sectionEl.dataset.dependsOn);
            const dependencyState = evaluateDependsOn(dependsOn, values);
            const isDisabled = !dependencyState.enabled;

            if (isDisabled) {
                setSectionCollapsed(sectionEl, true, false);
            } else {
                const userCollapsed = sectionEl.dataset.userCollapsed === '1';
                setSectionCollapsed(sectionEl, userCollapsed, false);
            }

            if (isDisabled) {
                disabledSections.push(sectionEl);
            } else {
                enabledSections.push(sectionEl);
            }
        });

        enabledSections.concat(disabledSections).forEach((sectionEl) => {
            root.appendChild(sectionEl);
        });
    }

    function addDependencyMetadataToSection(sectionEl, sectionBodyEl, section) {
        if (!Array.isArray(section.dependsOn) || section.dependsOn.length === 0) return;
        sectionEl.dataset.dependsOn = JSON.stringify(section.dependsOn);
        const note = document.createElement('div');
        note.className = 'section-dependency-note';
        note.hidden = true;
        sectionBodyEl.appendChild(note);
    }

    function bindDependencyRefreshListeners() {
        root.querySelectorAll('.field input').forEach((input) => {
            input.addEventListener('change', applyDependencyState);
        });
    }

    function applyFeaturePreset(presetName) {
        const featureFields = getFeatureFields();
        const setForProfile = FEATURE_KEYS_BY_PROFILE[presetName] || null;

        featureFields.forEach((featureField) => {
            const fieldRef = getFieldInputByKey(featureField.key);
            if (!fieldRef) return;

            let nextValue = false;
            if (presetName === 'allOn') {
                nextValue = true;
            } else if (presetName === 'allOff') {
                nextValue = false;
            } else if (setForProfile) {
                nextValue = setForProfile.has(featureField.key);
            }

            setInputValue(featureField, fieldRef.input, nextValue);
            fieldRef.input.dispatchEvent(new Event('input', { bubbles: true }));
            fieldRef.input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        applyDependencyState();
    }

    function setupPresetsUi() {
        if (!presetsRoot) return;

        presetsRoot.innerHTML = '';
        const title = document.createElement('div');
        title.className = 'presets-title';
        title.textContent = 'Presety (1 kliknięcie)';

        const actions = document.createElement('div');
        actions.className = 'presets-actions';

        const presets = [
            { id: 'allOn', label: 'Włącz wszystko' },
            { id: 'allOff', label: 'Wyłącz wszystko' }
        ];

        presets.forEach((preset) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'preset-btn';
            button.textContent = preset.label;
            button.addEventListener('click', () => {
                applyFeaturePreset(preset.id);
                setStatus(`Ustawiono preset: ${preset.label}.`);
            });
            actions.appendChild(button);
        });

        presetsRoot.appendChild(title);
        presetsRoot.appendChild(actions);
    }

    function setupBackupUi() {
        if (!backupRoot) return;

        backupRoot.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'backup-title';
        title.textContent = 'Import / eksport preferencji i danych';

        const description = document.createElement('p');
        description.className = 'backup-description';
        description.textContent = 'Wybierz dokładnie, które dane eksportować/importować.';

        const scopeTitle = document.createElement('div');
        scopeTitle.className = 'backup-scope-title';
        scopeTitle.textContent = 'Zakres danych:';

        const scopeActions = document.createElement('div');
        scopeActions.className = 'backup-scope-actions';

        const selectAllScopesBtn = document.createElement('button');
        selectAllScopesBtn.type = 'button';
        selectAllScopesBtn.className = 'backup-scope-btn';
        selectAllScopesBtn.textContent = 'Zaznacz wszystko';

        const clearScopesBtn = document.createElement('button');
        clearScopesBtn.type = 'button';
        clearScopesBtn.className = 'backup-scope-btn secondary';
        clearScopesBtn.textContent = 'Wyczyść zaznaczenie';

        const scopeGrid = document.createElement('div');
        scopeGrid.className = 'backup-scope-grid';

        BACKUP_SCOPE_DEFS.forEach((scopeDef) => {
            const row = document.createElement('label');
            row.className = 'backup-scope-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.backupKey = scopeDef.key;

            const text = document.createElement('span');
            text.textContent = scopeDef.label;

            row.appendChild(checkbox);
            row.appendChild(text);
            scopeGrid.appendChild(row);
        });

        selectAllScopesBtn.addEventListener('click', () => {
            scopeGrid.querySelectorAll('input[data-backup-key]').forEach((input) => {
                input.checked = true;
            });
        });

        clearScopesBtn.addEventListener('click', () => {
            scopeGrid.querySelectorAll('input[data-backup-key]').forEach((input) => {
                input.checked = false;
            });
        });

        scopeActions.appendChild(selectAllScopesBtn);
        scopeActions.appendChild(clearScopesBtn);

        const modeTitle = document.createElement('div');
        modeTitle.className = 'backup-scope-title';
        modeTitle.textContent = 'Tryb importu:';

        const modeRow = document.createElement('div');
        modeRow.className = 'backup-mode-row';

        const replaceMode = document.createElement('label');
        replaceMode.className = 'backup-mode-item';
        replaceMode.innerHTML = '<input type="radio" name="backup-import-mode" value="replace" checked> Zastąp wybrane dane';

        const mergeMode = document.createElement('label');
        mergeMode.className = 'backup-mode-item';
        mergeMode.innerHTML = '<input type="radio" name="backup-import-mode" value="merge"> Scalaj tylko (nie usuwaj brakujących danych)';

        modeRow.appendChild(replaceMode);
        modeRow.appendChild(mergeMode);

        const actions = document.createElement('div');
        actions.className = 'backup-actions';

        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.className = 'backup-btn export';
        exportBtn.textContent = 'Eksportuj kopię';
        exportBtn.addEventListener('click', async () => {
            try {
                const selectedKeys = getSelectedBackupKeys();
                await exportBackup(selectedKeys);
            } catch (error) {
                setStatus(`Błąd eksportu: ${error && error.message ? error.message : 'nieznany błąd'}`);
            }
        });

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'backup-btn import';
        importBtn.textContent = 'Importuj kopię';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        fileInput.hidden = true;

        importBtn.addEventListener('click', () => {
            const selectedKeys = getSelectedBackupKeys();
            if (selectedKeys.length === 0) {
                setStatus('Zaznacz co najmniej jedną kategorię danych do importu.');
                return;
            }

            const importMode = getBackupImportMode();
            const confirmationText = importMode === 'merge'
                ? 'Import scali zaznaczone dane z bieżącymi. Brakujące pozycje NIE zostaną usunięte. Kontynuować?'
                : 'Import zastąpi zaznaczone dane i usunie ich brakujące wartości z pliku. Kontynuować?';
            const confirmed = window.confirm(confirmationText);
            if (!confirmed) return;
            fileInput.value = '';
            fileInput.click();
        });

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
            if (!file) return;
            try {
                const selectedKeys = getSelectedBackupKeys();
                const importMode = getBackupImportMode();
                await importBackupFromFile(file, {
                    selectedKeys,
                    mergeOnly: importMode === 'merge'
                });
            } catch (error) {
                setStatus(`Błąd importu: ${error && error.message ? error.message : 'nieznany błąd'}`);
            }
        });

        actions.appendChild(exportBtn);
        actions.appendChild(importBtn);
        actions.appendChild(fileInput);

        backupRoot.appendChild(title);
        backupRoot.appendChild(description);
        backupRoot.appendChild(scopeTitle);
        backupRoot.appendChild(scopeActions);
        backupRoot.appendChild(scopeGrid);
        backupRoot.appendChild(modeTitle);
        backupRoot.appendChild(modeRow);
        backupRoot.appendChild(actions);
    }

    function setupIcdHelperDependencyState() {
        const helperField = root.querySelector('[data-setting-key="features.enableIcdHelper"]');
        const recentField = root.querySelector('[data-setting-key="features.enableIcdRecentCodes"]');
        const favoriteField = root.querySelector('[data-setting-key="features.enableIcdFavoriteCodes"]');
        if (!helperField || !recentField || !favoriteField) return;

        const helperInput = helperField.querySelector('input');
        const recentInput = recentField.querySelector('input');
        const favoriteInput = favoriteField.querySelector('input');
        if (!helperInput || !recentInput || !favoriteInput) return;

        let warning = helperField.querySelector('.dependency-warning-row');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'dependency-warning-row';
            warning.hidden = true;
            warning.textContent = 'Pomocnik ICD jest nieskuteczny: włącz przynajmniej „Przechowuj ostatnio użyte kody ICD” albo „Ulubione kody ICD”.';
            helperField.appendChild(warning);
        }

        const updateState = () => {
            const isHelperOn = helperInput.checked;
            const hasAnyDependency = recentInput.checked || favoriteInput.checked;
            const isBlocked = isHelperOn && !hasAnyDependency;

            helperField.classList.toggle('is-dependency-blocked', isBlocked);
            warning.hidden = !isBlocked;
        };

        helperInput.addEventListener('change', updateState);
        recentInput.addEventListener('change', updateState);
        favoriteInput.addEventListener('change', updateState);
        updateState();
    }

    async function render() {
        const merged = await globalThis.MASettings.getMergedSettings();
        root.innerHTML = '';

        schema.sections.forEach((section) => {
            const sectionEl = document.createElement('section');
            sectionEl.className = 'section';
            sectionEl.dataset.sectionId = section.id;

            const header = document.createElement('div');
            header.className = 'section-header';

            const titleButton = document.createElement('button');
            titleButton.type = 'button';
            titleButton.className = 'section-toggle';

            const title = document.createElement('span');
            title.className = 'section-title-text';
            title.textContent = section.title;
            titleButton.appendChild(title);

            const titleHint = document.createElement('span');
            titleHint.className = 'section-toggle-hint';
            titleHint.textContent = 'kliknij, aby zwinąć/rozwinąć';
            titleButton.appendChild(titleHint);

            const disabledTag = document.createElement('span');
            disabledTag.className = 'section-disabled-tag';
            disabledTag.textContent = 'Wyłączona';

            header.appendChild(titleButton);
            header.appendChild(disabledTag);
            sectionEl.appendChild(header);

            const sectionBody = document.createElement('div');
            sectionBody.className = 'section-body';

            if (section.description) {
                const description = document.createElement('p');
                description.textContent = section.description;
                sectionBody.appendChild(description);
            }

            addDependencyMetadataToSection(sectionEl, sectionBody, section);

            section.fields.forEach((field) => {
                sectionBody.appendChild(buildField(field, merged));
            });

            sectionEl.appendChild(sectionBody);

            titleButton.addEventListener('click', () => {
                const isCollapsed = sectionEl.classList.contains('is-collapsed');
                setSectionCollapsed(sectionEl, !isCollapsed, true);
            });

            root.appendChild(sectionEl);
        });

        setupPresetsUi();
        setupBackupUi();
        setupIcdHelperDependencyState();
        bindDependencyRefreshListeners();
        applyDependencyState();
    }

    async function collectAndSave() {
        const nextSettings = JSON.parse(JSON.stringify(defaults));

        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                const fieldEl = root.querySelector(`[data-setting-key="${field.key}"]`);
                if (!fieldEl) return;
                const input = fieldEl.querySelector('input');
                const raw = getInputValue(field, input);
                globalThis.MASettings.setPath(nextSettings, field.key, raw);
            });
        });

        const sanitized = globalThis.MASettings.sanitizeSettings(nextSettings);
        await globalThis.MASettings.saveMergedAsOverrides(sanitized);
        setStatus('Ustawienia zapisane.');
        await render();
    }

    saveBtn.addEventListener('click', async () => {
        await collectAndSave();
    });

    resetAllBtn.addEventListener('click', async () => {
        await globalThis.MASettings.clearAllOverrides();
        setStatus('Przywrócono domyślne ustawienia.');
        await render();
    });

    render();
})();
