(function initOptionsPage() {
    'use strict';

    const root = document.getElementById('settings-root');
    const saveBtn = document.getElementById('save-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const status = document.getElementById('status');

    const schema = globalThis.MASettings.schema;
    const defaults = globalThis.MASettings.getDefaultSettings();

    function setStatus(message) {
        status.textContent = message;
        if (!message) return;
        setTimeout(() => {
            if (status.textContent === message) {
                status.textContent = '';
            }
        }, 2400);
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
    }

    function addDependencyMetadataToSection(sectionEl, section) {
        if (!Array.isArray(section.dependsOn) || section.dependsOn.length === 0) return;
        sectionEl.dataset.dependsOn = JSON.stringify(section.dependsOn);
        const note = document.createElement('div');
        note.className = 'section-dependency-note';
        note.hidden = true;
        sectionEl.appendChild(note);
    }

    function bindDependencyRefreshListeners() {
        root.querySelectorAll('.field input').forEach((input) => {
            input.addEventListener('change', applyDependencyState);
            input.addEventListener('input', applyDependencyState);
        });
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

            const title = document.createElement('h2');
            title.textContent = section.title;
            sectionEl.appendChild(title);

            if (section.description) {
                const description = document.createElement('p');
                description.textContent = section.description;
                sectionEl.appendChild(description);
            }

            addDependencyMetadataToSection(sectionEl, section);

            section.fields.forEach((field) => {
                sectionEl.appendChild(buildField(field, merged));
            });

            root.appendChild(sectionEl);
        });

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
