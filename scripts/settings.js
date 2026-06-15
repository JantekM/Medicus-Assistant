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
                    { key: 'features.enablePageDaneMedyczneEnhancements', label: 'Ulepszenia strony „Dane medyczne wizyty”', type: 'boolean', default: true, longDescription: 'Nadrzędny przełącznik dla funkcji uruchamianych na stronie danych medycznych wizyty POZ.' },
                    {
                        key: 'features.enablePozVisitTypeButtons',
                        label: 'Przyciski szybkiego wyboru typu wizyty POZ',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Dodaje przyciski Gab/Tele/Rec/Dom na stronie danych medycznych wizyty POZ i automatyzuje uzupełnianie powiązanych pól.',
                        dependsOn: [
                            {
                                path: 'features.enablePageDaneMedyczneEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Dane medyczne wizyty””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enableMassHeightTools',
                        label: 'Narzędzia masa/wzrost',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Dodaje przyciski do wstawiania pomiarów, domyślnego autofill oraz wizualnego oznaczania wartości domyślnych.',
                        dependsOn: [
                            {
                                path: 'features.enablePageDaneMedyczneEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Dane medyczne wizyty””.'
                            }
                        ]
                    },
                    { key: 'features.enableIcdHelper', label: 'Pomocnik ICD', type: 'boolean', default: true, longDescription: 'Włącza popup pomocnika ICD. Uwaga: jeśli jednocześnie wyłączysz „Przechowuj ostatnio użyte kody ICD” i „Ulubione kody ICD”, pomocnik ICD pozostanie wyłączony niezależnie od tego ustawienia.' },
                    { key: 'features.enableIcdRecentCodes', label: 'Przechowuj ostatnio użyte kody ICD', type: 'boolean', default: true, longDescription: 'Zapisuje historię ostatnio użytych kodów ICD i pozwala wyświetlać listy „Ostatnio używane” oraz „Najczęściej używane”.' },
                    { key: 'features.enableIcdFavoriteCodes', label: 'Ulubione kody ICD', type: 'boolean', default: true, longDescription: 'Włącza oznaczanie kodów ICD jako ulubione oraz wyświetlanie sekcji ulubionych kodów ICD.' },
                    { key: 'features.enablePageNoweZlecenieEnhancements', label: 'Ulepszenia strony „Nowe zlecenie”', type: 'boolean', default: true, longDescription: 'Nadrzędny przełącznik dla funkcji uruchamianych przy edycji nowego zlecenia badań.' },
                    {
                        key: 'features.enableTomorrowMorningButton',
                        label: 'Przycisk „Jutro rano”',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Dodaje skrót ustawiający planowaną datę i godzinę na najbliższy poranek.',
                        dependsOn: [
                            {
                                path: 'features.enablePageNoweZlecenieEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Nowe zlecenie””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enableRecentRequestedTestsButton',
                        label: 'Przycisk „Ostatnio zlecone”',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Dodaje przycisk zaznaczający badania z najnowszą datą „Ostatnio zlecono”.',
                        dependsOn: [
                            {
                                path: 'features.enablePageNoweZlecenieEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Nowe zlecenie””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enableAutoFillRequestedTests',
                        label: 'Autouzupełnianie duplikowanego zlecenia',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Wypełnia pola nowego zlecenia danymi poprzedniego zlecenia podczas akcji duplikowania.',
                        dependsOn: [
                            {
                                path: 'features.enablePageNoweZlecenieEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Nowe zlecenie””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enableDuplicateTestHighlighting',
                        label: 'Podświetlanie duplikatów badań',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Wyróżnia kolizje, gdy ten sam parametr badania jest zaznaczony wielokrotnie.',
                        dependsOn: [
                            {
                                path: 'features.enablePageNoweZlecenieEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Nowe zlecenie””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enableTestBatchesPanel',
                        label: 'Panel własnych zestawów badań',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Pokazuje panel zarządzania własnymi zestawami badań na formularzu nowego zlecenia.',
                        dependsOn: [
                            {
                                path: 'features.enablePageNoweZlecenieEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Nowe zlecenie””.'
                            }
                        ]
                    },
                    {
                        key: 'features.enablePhoneNumberEnhancement',
                        label: 'Formatowanie numerów telefonu',
                        type: 'boolean',
                        default: true,
                        longDescription: 'Formatuje wykryte numery telefonu pacjenta do czytelnego układu grup cyfr.',
                        dependsOn: [
                            {
                                path: 'features.enablePageDaneMedyczneEnhancements',
                                equals: true,
                                message: 'Opcja zależy od „Ulepszenia strony „Dane medyczne wizyty””.'
                            }
                        ]
                    },
                    { key: 'features.enableShortcutGroupMemory', label: 'Zapamiętywanie grup skrótów', type: 'boolean', default: true, longDescription: 'Zapamiętuje ostatnio wybraną grupę skrótów dla procedur i przywraca ją automatycznie.' },
                    { key: 'features.enableTotpAutoSubmit', label: 'Automatyczne wysłanie TOTP', type: 'boolean', default: true, longDescription: 'Automatycznie uruchamia sprawdzenie eWUŚ po wpisaniu pełnego 6-cyfrowego kodu TOTP.' }
                ]
            },
            {
                id: 'pozDefaults',
                title: 'Domyślne wartości POZ',
                description: 'Ustawienia domyślne używane przez narzędzia wizyty POZ.',
                dependsOn: [
                    {
                        path: 'features.enablePageDaneMedyczneEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Dane medyczne wizyty”” są włączone.'
                    }
                ],
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
                dependsOn: [
                    {
                        path: 'features.enableIcdHelper',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Pomocnik ICD” jest włączony.'
                    }
                ],
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
                        path: 'features.enablePageNoweZlecenieEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Nowe zlecenie”” są włączone.'
                    },
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
            },
            {
                id: 'requestedTestsButton',
                title: 'Przycisk „Ostatnio zlecone”',
                description: 'Ustawienia działania przycisku szybkiego zaznaczania ostatnio zleconych badań.',
                dependsOn: [
                    {
                        path: 'features.enablePageNoweZlecenieEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Nowe zlecenie”” są włączone.'
                    },
                    {
                        path: 'features.enableRecentRequestedTestsButton',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy funkcja „Przycisk „Ostatnio zlecone”” jest włączona.'
                    }
                ],
                fields: [
                    { key: 'requestedTests.buttonBaseLabel', label: 'Bazowa etykieta przycisku', type: 'string', default: 'Ostatnio zlecone', longDescription: 'Tekst bazowy widoczny na przycisku. Data jest dopisywana, jeśli tryb etykiety to „date”.' },
                    { key: 'requestedTests.buttonLabelMode', label: 'Tryb etykiety (date/static)', type: 'string', default: 'date', longDescription: 'Tryb „date” dopisuje datę w nawiasie, a „static” zawsze używa tylko bazowej etykiety.' },
                    { key: 'requestedTests.buttonDisableWhenNoDate', label: 'Wyłącz przycisk, gdy brak dat', type: 'boolean', default: true, longDescription: 'Gdy włączone, przycisk jest nieaktywny jeśli brak rozpoznawalnych dat „Ostatnio zlecono”.' },
                    { key: 'requestedTests.buttonRefreshAttempts', label: 'Liczba prób odświeżenia etykiety', type: 'number', min: 1, max: 40, step: 1, default: 10, longDescription: 'Ile razy po dodaniu przycisku odświeżyć jego etykietę i stan aktywności.' },
                    { key: 'requestedTests.buttonRefreshIntervalMs', label: 'Interwał odświeżenia etykiety (ms)', type: 'number', min: 50, max: 5000, step: 10, default: 250, longDescription: 'Interwał czasowy odświeżenia etykiety przycisku.' }
                ]
            },
            {
                id: 'duplicateHighlight',
                title: 'Podświetlanie duplikatów badań',
                description: 'Ustawienia wizualizacji i odświeżania podświetlenia duplikatów.',
                dependsOn: [
                    {
                        path: 'features.enablePageNoweZlecenieEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Nowe zlecenie”” są włączone.'
                    },
                    {
                        path: 'features.enableDuplicateTestHighlighting',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Podświetlanie duplikatów badań” jest włączone.'
                    }
                ],
                fields: [
                    { key: 'duplicateHighlight.enableMutedRows', label: 'Wyciszaj nieaktywne duplikaty', type: 'boolean', default: true, longDescription: 'Przy zaznaczeniu jednego wariantu parametru pozostałe będą przygaszane.' },
                    { key: 'duplicateHighlight.enableConflictRows', label: 'Oznaczaj konflikty zaznaczeń', type: 'boolean', default: true, longDescription: 'Gdy zaznaczysz kilka wariantów tego samego badania, wiersze konfliktowe zostaną wyróżnione.' },
                    { key: 'duplicateHighlight.mutedOpacity', label: 'Przezroczystość wyciszonych wierszy', type: 'number', min: 0.1, max: 1, step: 0.05, default: 0.45, longDescription: 'Niższa wartość oznacza mocniejsze przygaszenie wierszy alternatywnych.' },
                    { key: 'duplicateHighlight.refreshAttempts', label: 'Liczba odświeżeń po inicjalizacji', type: 'number', min: 1, max: 40, step: 1, default: 8, longDescription: 'Liczba automatycznych odświeżeń po uruchomieniu obserwatora.' },
                    { key: 'duplicateHighlight.refreshIntervalMs', label: 'Interwał odświeżeń (ms)', type: 'number', min: 50, max: 5000, step: 10, default: 200, longDescription: 'Interwał czasowy pomiędzy kolejnymi odświeżeniami podświetlenia.' }
                ]
            },
            {
                id: 'requestedTestsAutofill',
                title: 'Autouzupełnianie duplikowanego zlecenia',
                description: 'Wybierz, które elementy mają być automatycznie uzupełniane.',
                dependsOn: [
                    {
                        path: 'features.enablePageNoweZlecenieEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Nowe zlecenie”” są włączone.'
                    },
                    {
                        path: 'features.enableAutoFillRequestedTests',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Autouzupełnianie duplikowanego zlecenia” jest włączone.'
                    }
                ],
                fields: [
                    { key: 'autofill.copyDescription', label: 'Uzupełniaj opis zlecenia', type: 'boolean', default: true, longDescription: 'Przenosi dodatkowe informacje do pola opisu, jeśli jest puste.' },
                    { key: 'autofill.copyIcdCode', label: 'Uzupełniaj kod ICD', type: 'boolean', default: true, longDescription: 'Przenosi kod ICD-10 do pola rozpoznania, jeśli jest puste.' },
                    { key: 'autofill.applyDefaultTime', label: 'Ustawiaj domyślny czas wykonania', type: 'boolean', default: true, longDescription: 'Wywołuje domyślną akcję ustawienia czasu wykonania badania.' },
                    { key: 'autofill.copySelectedTests', label: 'Zaznaczaj badania z poprzedniego zlecenia', type: 'boolean', default: true, longDescription: 'Automatycznie zaznacza pasujące badania na liście.' },
                    { key: 'autofill.copyCitoFlag', label: 'Przenoś flagę CITO', type: 'boolean', default: true, longDescription: 'Jeśli badanie miało ustawione CITO, zaznaczy także pole CITO przy nowym zleceniu.' },
                    { key: 'autofill.strictTestNameMatch', label: 'Ścisłe dopasowanie nazw badań', type: 'boolean', default: false, longDescription: 'Gdy włączone, nazwy badań muszą być identyczne po normalizacji; gdy wyłączone, dopuszczane jest dopasowanie zawierające.' }
                ]
            },
            {
                id: 'testsPanel',
                title: 'Panel własnych zestawów badań',
                description: 'Ustawienia panelu własnych zestawów badań na stronie nowego zlecenia.',
                dependsOn: [
                    {
                        path: 'features.enablePageNoweZlecenieEnhancements',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Ulepszenia strony „Nowe zlecenie”” są włączone.'
                    },
                    {
                        path: 'features.enableTestBatchesPanel',
                        equals: true,
                        message: 'Sekcja aktywna tylko, gdy „Panel własnych zestawów badań” jest włączony.'
                    }
                ],
                fields: [
                    { key: 'tests.batchesMaxHeightPx', label: 'Maksymalna wysokość listy zestawów (px)', type: 'number', min: 0, max: 2000, step: 10, default: 0, longDescription: '0 oznacza brak limitu wysokości. Ustaw wartość dodatnią, aby lista miała przewijanie.' }
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

    function evaluateDependsOnRules(dependsOn, values) {
        if (!Array.isArray(dependsOn) || dependsOn.length === 0) {
            return { enabled: true, reasons: [] };
        }

        const reasons = [];
        let enabled = true;

        dependsOn.forEach((rule) => {
            const expected = Object.prototype.hasOwnProperty.call(rule, 'equals') ? rule.equals : true;
            const current = getPath(values, rule.path);
            if (current !== expected) {
                enabled = false;
                reasons.push(rule.message || `Warunek zależności niespełniony: ${rule.path}`);
            }
        });

        return { enabled, reasons };
    }

    function getFeatureFieldByPath(featurePath) {
        for (let i = 0; i < schema.sections.length; i += 1) {
            const section = schema.sections[i];
            for (let j = 0; j < section.fields.length; j += 1) {
                const field = section.fields[j];
                if (field.key === featurePath && field.type === 'boolean' && featurePath.startsWith('features.')) {
                    return field;
                }
            }
        }
        return null;
    }

    function listFeaturePaths() {
        const paths = [];
        schema.sections.forEach((section) => {
            section.fields.forEach((field) => {
                if (field.type === 'boolean' && field.key.startsWith('features.')) {
                    paths.push(field.key);
                }
            });
        });
        return paths;
    }

    function resolveFeatureState(settings, featurePath) {
        const sanitized = sanitizeSettings(settings || {});
        const requested = Boolean(getPath(sanitized, featurePath));
        const featureField = getFeatureFieldByPath(featurePath);

        if (!featureField) {
            return {
                requested,
                effective: requested,
                reasons: []
            };
        }

        const dependencyState = evaluateDependsOnRules(featureField.dependsOn, sanitized);
        return {
            requested,
            effective: requested && dependencyState.enabled,
            reasons: dependencyState.reasons
        };
    }

    function resolveAllFeatureStates(settings) {
        const sanitized = sanitizeSettings(settings || {});
        const states = {};
        listFeaturePaths().forEach((featurePath) => {
            states[featurePath] = resolveFeatureState(sanitized, featurePath);
        });
        return states;
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
        evaluateDependsOnRules,
        resolveFeatureState,
        resolveAllFeatureStates,
        getOverrides,
        getMergedSettings,
        saveMergedAsOverrides,
        clearAllOverrides
    };

    global.MASettings = api;
})(globalThis);
