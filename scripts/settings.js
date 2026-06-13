(function initMASettings(global) {
    'use strict';

    const STORAGE_KEY = 'settingsOverrides';

    const schema = {
        sections: [
            {
                id: 'featureToggles',
                title: 'Przełączniki funkcji',
                description: 'Włączaj lub wyłączaj główne funkcje rozszerzenia.',
                fields: [
                    { key: 'features.enablePozVisitTypeButtons', label: 'Przyciski szybkiego wyboru typu wizyty POZ', type: 'boolean', default: true, longDescription: 'Dodaje przyciski Gab/Tele/Rec/Dom na stronie danych medycznych wizyty POZ i automatyzuje uzupełnianie powiązanych pól.' },
                    { key: 'features.enableMassHeightTools', label: 'Narzędzia masa/wzrost', type: 'boolean', default: true, longDescription: 'Dodaje przyciski do wstawiania pomiarów, domyślnego autofill oraz wizualnego oznaczania wartości domyślnych.' },
                    { key: 'features.enableIcdHelper', label: 'Pomocnik ICD', type: 'boolean', default: true, longDescription: 'Włącza popup pomocnika ICD. Uwaga: jeśli jednocześnie wyłączysz „Przechowuj ostatnio użyte kody ICD” i „Ulubione kody ICD”, pomocnik ICD pozostanie wyłączony niezależnie od tego ustawienia.' },
                    { key: 'features.enableIcdRecentCodes', label: 'Przechowuj ostatnio użyte kody ICD', type: 'boolean', default: true, longDescription: 'Zapisuje historię ostatnio użytych kodów ICD i pozwala wyświetlać listy „Ostatnio używane” oraz „Najczęściej używane”.' },
                    { key: 'features.enableIcdFavoriteCodes', label: 'Ulubione kody ICD', type: 'boolean', default: true, longDescription: 'Włącza oznaczanie kodów ICD jako ulubione oraz wyświetlanie sekcji ulubionych kodów ICD.' },
                    { key: 'features.enableTomorrowMorningButton', label: 'Przycisk „Jutro rano”', type: 'boolean', default: true, longDescription: 'Dodaje skrót ustawiający planowaną datę i godzinę na najbliższy poranek.' },
                    { key: 'features.enablePhoneNumberEnhancement', label: 'Formatowanie numerów telefonu', type: 'boolean', default: true, longDescription: 'Formatuje wykryte numery telefonu pacjenta do czytelnego układu grup cyfr.' },
                    { key: 'features.enableShortcutGroupMemory', label: 'Zapamiętywanie grup skrótów', type: 'boolean', default: true, longDescription: 'Zapamiętuje ostatnio wybraną grupę skrótów dla procedur i przywraca ją automatycznie.' },
                    { key: 'features.enableTotpAutoSubmit', label: 'Automatyczne wysłanie TOTP', type: 'boolean', default: true, longDescription: 'Automatycznie uruchamia sprawdzenie eWUŚ po wpisaniu pełnego 6-cyfrowego kodu TOTP.' }
                ]
            },
            {
                id: 'pozDefaults',
                title: 'Domyślne wartości POZ',
                description: 'Ustawienia domyślne używane przez narzędzia wizyty POZ.',
                fields: [
                    {
                        key: 'poz.defaultMassKg',
                        label: 'Domyślna masa (kg)',
                        type: 'number',
                        min: 20,
                        max: 300,
                        step: 1,
                        default: 65,
                        longDescription: 'Używana przez szybki przycisk masa/wzrost oraz logikę podświetlania wartości domyślnych.',
                        dependsOn: [
                            {
                                path: 'features.enableMassHeightTools',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Narzędzia masa/wzrost” są włączone w przełącznikach funkcji.'
                            }
                        ]
                    },
                    {
                        key: 'poz.defaultHeightCm',
                        label: 'Domyślny wzrost (cm)',
                        type: 'number',
                        min: 80,
                        max: 250,
                        step: 1,
                        default: 165,
                        longDescription: 'Używany przez szybki przycisk masa/wzrost oraz logikę podświetlania wartości domyślnych.',
                        dependsOn: [
                            {
                                path: 'features.enableMassHeightTools',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Narzędzia masa/wzrost” są włączone w przełącznikach funkcji.'
                            }
                        ]
                    },
                    {
                        key: 'poz.teleporadaBadanieSymbolLimit',
                        label: 'Limit znaków badania dla Teleporady',
                        type: 'number',
                        min: 0,
                        max: 1000,
                        step: 1,
                        default: 10,
                        longDescription: 'Jeśli długość pola badania przedmiotowego jest mniejsza lub równa temu limitowi, przycisk Teleporada nadpisze je domyślną notatką z badania.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.teleporadaWywiadSymbolLimit',
                        label: 'Limit znaków wywiadu dla Teleporady',
                        type: 'number',
                        min: 0,
                        max: 1000,
                        step: 1,
                        default: 10,
                        longDescription: 'Jeśli długość pola wywiadu jest mniejsza lub równa temu limitowi, przycisk Teleporada nadpisze je domyślną notatką z wywiadu.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.receptowaBadanieSymbolLimit',
                        label: 'Limit znaków badania dla wizyty receptowej',
                        type: 'number',
                        min: 0,
                        max: 1000,
                        step: 1,
                        default: 20,
                        longDescription: 'Jeśli długość pola badania przedmiotowego jest mniejsza lub równa temu limitowi, przycisk Rec nadpisze je domyślną notatką z badania.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.receptowaWywiadSymbolLimit',
                        label: 'Limit znaków wywiadu dla wizyty receptowej',
                        type: 'number',
                        min: 0,
                        max: 1000,
                        step: 1,
                        default: 20,
                        longDescription: 'Jeśli długość pola wywiadu jest mniejsza lub równa temu limitowi, przycisk Rec nadpisze je domyślną notatką z wywiadu.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.teleporadaDefaultNote',
                        label: 'Domyślna notatka z badania dla Teleporady',
                        type: 'string',
                        default: 'Teleporada - nie badano przedmiotowo',
                        longDescription: 'Wstawiana do pola badania przedmiotowego przy Teleporadzie, gdy pole jest krótkie lub puste.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.teleporadaDefaultHistoryNote',
                        label: 'Domyślna notatka z wywiadu dla Teleporady',
                        type: 'string',
                        default: '',
                        longDescription: 'Wstawiana do pola wywiadu przy Teleporadzie, gdy pole jest krótkie lub puste. Domyślnie pozostaje pusta.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.receptowaDefaultNote',
                        label: 'Domyślna notatka z badania dla wizyty receptowej',
                        type: 'string',
                        default: 'Wizyta receptowa - nie badano przedmiotowo',
                        longDescription: 'Wstawiana do pola badania przedmiotowego przy wizycie receptowej, gdy pole jest krótkie lub puste.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    },
                    {
                        key: 'poz.receptowaDefaultHistoryNote',
                        label: 'Domyślna notatka z wywiadu dla wizyty receptowej',
                        type: 'string',
                        default: '',
                        longDescription: 'Wstawiana do pola wywiadu przy wizycie receptowej, gdy pole jest krótkie lub puste. Domyślnie pozostaje pusta.',
                        dependsOn: [
                            {
                                path: 'features.enablePozVisitTypeButtons',
                                equals: true,
                                message: 'Opcja dostępna tylko, gdy „Przyciski szybkiego wyboru typu wizyty POZ” są włączone.'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'icdHelper',
                title: 'Pomocnik ICD',
                description: 'Limity i opóźnienia działania pomocnika ICD.',
                fields: [
                    { key: 'icd.maxRecentCodesDisplayed', label: 'Liczba ostatnich kodów ICD na liście', type: 'number', min: 5, max: 200, step: 1, default: 50, longDescription: 'Maksymalna liczba unikalnych ostatnio użytych kodów ICD wyświetlana w tabeli pomocnika.' },
                    { key: 'icd.maxFrequentCodesDisplayed', label: 'Liczba najczęstszych kodów ICD na liście', type: 'number', min: 5, max: 200, step: 1, default: 50, longDescription: 'Maksymalna liczba najczęściej używanych kodów ICD wyświetlana w tabeli pomocnika.' },
                    { key: 'icd.maxStoredUsedCodes', label: 'Historia użytych kodów ICD (limit zapisu)', type: 'number', min: 50, max: 2000, step: 10, default: 500, longDescription: 'Określa, ile ostatnich użyć kodów ICD przechowywać w pamięci lokalnej zanim stare wpisy zostaną odcięte.' },
                    { key: 'icd.popupShowDelayMs', label: 'Opóźnienie pojawienia popupu ICD (ms)', type: 'number', min: 0, max: 5000, step: 50, default: 200, longDescription: 'Czas w milisekundach od najechania kursorem do pokazania popupu pomocnika ICD.' },
                    { key: 'icd.popupHideDelayMs', label: 'Opóźnienie znikania popupu ICD (ms)', type: 'number', min: 0, max: 10000, step: 50, default: 1000, longDescription: 'Czas w milisekundach od opuszczenia elementu do ukrycia popupu pomocnika ICD.' }
                ]
            },
            {
                id: 'tomorrow',
                title: 'Przycisk „Jutro rano”',
                description: 'Domyślne parametry planowania dla akcji „Jutro rano”.',
                dependsOn: [
                    {
                        path: 'features.enableTomorrowMorningButton',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy funkcja „Przycisk „Jutro rano”” jest włączona w przełącznikach funkcji.'
                    }
                ],
                fields: [
                    { key: 'schedule.tomorrowHour', label: 'Godzina docelowa (24h)', type: 'number', min: 0, max: 23, step: 1, default: 7, longDescription: 'Godzina ustawiana przez przycisk „Jutro rano” w polach planowanego terminu.' },
                    { key: 'schedule.tomorrowMinute', label: 'Minuta docelowa', type: 'number', min: 0, max: 59, step: 1, default: 45, longDescription: 'Minuta ustawiana przez przycisk „Jutro rano” w polach planowanego terminu.' },
                    { key: 'schedule.tomorrowCutoffHour', label: 'Godzina graniczna przejścia na jutro', type: 'number', min: 0, max: 23, step: 1, default: 8, longDescription: 'Godzina graniczna, po której „Jutro rano” przechodzi na następny dzień.' },
                    { key: 'schedule.tomorrowCutoffMinute', label: 'Minuta graniczna przejścia na jutro', type: 'number', min: 0, max: 59, step: 1, default: 0, longDescription: 'Minuta graniczna używana razem z godziną graniczną. Przykład: 08:30 oznacza przejście na jutro od 08:30.' }
                ]
            }
        ]
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getPath(obj, path) {
        return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
    }

    function setPath(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }
        current[parts[parts.length - 1]] = value;
    }

    function isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function deepMerge(base, patch) {
        const output = clone(base);
        if (!isObject(patch)) return output;

        const mergeInto = (target, source) => {
            Object.keys(source).forEach((key) => {
                if (isObject(source[key]) && isObject(target[key])) {
                    mergeInto(target[key], source[key]);
                    return;
                }
                target[key] = source[key];
            });
        };

        mergeInto(output, patch);
        return output;
    }

    function sanitizeFieldValue(field, value) {
        if (value === undefined || value === null) return field.default;

        if (field.type === 'boolean') {
            return Boolean(value);
        }

        if (field.type === 'number') {
            const parsed = Number(value);
            if (Number.isNaN(parsed)) return field.default;

            let normalized = parsed;
            if (typeof field.min === 'number') normalized = Math.max(field.min, normalized);
            if (typeof field.max === 'number') normalized = Math.min(field.max, normalized);

            if (typeof field.step === 'number' && field.step > 0) {
                const base = typeof field.min === 'number' ? field.min : 0;
                normalized = Math.round((normalized - base) / field.step) * field.step + base;
            }
            return normalized;
        }

        if (field.type === 'string') {
            return String(value);
        }

        return value;
    }

    function getDefaultSettings() {
        const defaults = {};
        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                setPath(defaults, field.key, clone(field.default));
            });
        });
        return defaults;
    }

    function sanitizeSettings(candidate) {
        const sanitized = getDefaultSettings();
        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                const rawValue = getPath(candidate, field.key);
                const safeValue = sanitizeFieldValue(field, rawValue);
                setPath(sanitized, field.key, safeValue);
            });
        });
        return sanitized;
    }

    function diffAgainstDefaults(settings) {
        const defaults = getDefaultSettings();
        const diff = {};

        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                const currentValue = getPath(settings, field.key);
                const defaultValue = getPath(defaults, field.key);
                if (JSON.stringify(currentValue) !== JSON.stringify(defaultValue)) {
                    setPath(diff, field.key, currentValue);
                }
            });
        });

        return diff;
    }

    async function getOverrides() {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        return isObject(result[STORAGE_KEY]) ? result[STORAGE_KEY] : {};
    }

    async function getMergedSettings() {
        const defaults = getDefaultSettings();
        const overrides = await getOverrides();
        return sanitizeSettings(deepMerge(defaults, overrides));
    }

    async function saveMergedAsOverrides(mergedSettings) {
        const sanitized = sanitizeSettings(mergedSettings);
        const overrides = diffAgainstDefaults(sanitized);
        await chrome.storage.local.set({ [STORAGE_KEY]: overrides });
        return overrides;
    }

    async function clearAllOverrides() {
        await chrome.storage.local.remove(STORAGE_KEY);
    }

    const api = {
        STORAGE_KEY,
        schema,
        getPath,
        setPath,
        getDefaultSettings,
        sanitizeSettings,
        diffAgainstDefaults,
        getOverrides,
        getMergedSettings,
        saveMergedAsOverrides,
        clearAllOverrides
    };

    global.MASettings = api;
})(globalThis);
