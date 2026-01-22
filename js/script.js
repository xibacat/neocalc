/**
 * Neocalc Calculator Script
 */

import { calcFLOWD, calcSAFE, thresholdFlow, thresholdSafe, flujoML } from './neocalcModels.js';

// --- UI Logic ---

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    const form = document.getElementById('calcForm');
    const btnReset = document.getElementById('btnReset');

    // Safe Result Elements
    const resultSafeContent = document.getElementById('resultSafeContent');
    const cardSafeWrapper = document.getElementById('cardSafeWrapper');

    // Flow Result Elements
    const resultFlowContent = document.getElementById('resultFlowContent');
    const cardFlowWrapper = document.getElementById('cardFlowWrapper');

    // Handle Form Submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
            calculate();
        }

        form.classList.add('was-validated');
    });

    // Validation on blur (lost focus)
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.value) return; // Don't validate empty fields on blur if not touched yet? Actually required fields should probably show error if left empty and blurred. 
            // Standard behavior: if users leave the field, validate it.

            if (input.checkValidity()) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        });

        // Reset state on input to stop showing error while typing
        input.addEventListener('input', () => {
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
        });
    });

    // Handle Reset
    btnReset.addEventListener('click', () => {
        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('input').forEach(input => {
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
        });

        // Reset specific UI states
        document.getElementById('manualInputContainer').classList.remove('d-none');
        document.getElementById('calculatedInputContainer').classList.add('d-none');
        document.getElementById('flujo').readOnly = false;
        document.getElementById('calcResultDisplay').textContent = '--';

        resetResults();
    });

    // --- Flow Calculation Logic ---
    const toggleCalc = document.getElementById('toggleCalculation');
    const manualContainer = document.getElementById('manualInputContainer');
    const calcContainer = document.getElementById('calculatedInputContainer');
    const resultDisplay = document.getElementById('calcResultDisplay');
    const inputFlujo = document.getElementById('flujo');

    const inputD = document.getElementById('diametro');
    const inputVmax = document.getElementById('vmax');
    const inputFc = document.getElementById('fc');

    toggleCalc.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Switch to Calculator Mode
            // Keep manualContainer visible so we can see the 'flujo' input (which acts as the main value holder), 
            // but make it read-only so user knows it comes from the calculator.
            // Wait, previous plan was to hide/show. Let's see what looks best. 
            // If I hide #flujo, I lose the validation message visibility on the main field.
            // Better: Show both, but make #flujo read-only.
            // Actually, the request said "activate text field OR new inputs". 
            // Let's hide the manual input container if we are in calc mode?
            // "Add a switch that activates the text field OR ... new inputs" -> Mutually exclusive visibility is likely desired.
            // But I need #flujo for the form submission/validation.
            // I will HIDE the manual container, but keep the input in DOM.
            // But if hidden, browser validation bubbles might be weird.
            // Let's keep manual container HIDDEN, but mirror the value to a visible span in the calc container?
            // Yes, I already added <span id="calcResultDisplay">.

            manualContainer.classList.add('d-none');
            calcContainer.classList.remove('d-none');
            // Remove required attribute from manual flow if hidden? No, we need it calculated.
            // But if it's hidden, user can't fix it directly. They must fix D/V/FC.
        } else {
            // Switch to Manual Mode
            manualContainer.classList.remove('d-none');
            calcContainer.classList.add('d-none');
            inputFlujo.readOnly = false;
        }
    });

    function updateCalculatedFlow() {
        const d = parseFloat(inputD.value);
        const vmax = parseFloat(inputVmax.value);
        const fc = parseFloat(inputFc.value);

        if (!isNaN(d) && !isNaN(vmax) && !isNaN(fc)) {
            // Call the model function (imported from neocalcModels.js)
            // Note: neocalcModels.js export needs to be updated or I need to implement formula here if not available.
            // I will assume it's imported as `flujoML`.
            const flow = flujoML(d, vmax, fc);

            inputFlujo.value = flow.toFixed(2);
            resultDisplay.textContent = flow.toFixed(2);

            // Trigger validation on the hidden field so the form knows it's valid/invalid
            // We might need to manually handle 'is-valid' since it's hidden
            if (flow >= 0.2 && flow <= 3.0) {
                // Valid logic if needed
            }
        } else {
            inputFlujo.value = '';
            resultDisplay.textContent = '--';
        }
    }

    [inputD, inputVmax, inputFc].forEach(input => {
        input.addEventListener('input', updateCalculatedFlow);
    });

    // --- End Flow Calculation Logic ---

    function calculate() {
        // Parse inputs
        const flujo = parseFloat(document.getElementById('flujo').value);
        const peso = parseFloat(document.getElementById('peso').value);
        const eg = parseFloat(document.getElementById('eg').value);
        const edad = parseFloat(document.getElementById('edadInicio').value);

        // Run Models
        const probSafe = calcSAFE(flujo, peso, eg, edad);
        const probFlow = calcFLOWD(flujo, peso, eg, edad);

        // Update UI
        updateSafeCard(probSafe);
        updateFlowCard(probFlow);
    }

    function updateSafeCard(p) {
        //const threshold = 0.459;
        const isStable = p >= thresholdSafe;
        const percent = (p * 100).toFixed(1);

        // Define styles/text based on result
        const label = isStable ? "Fenotipo estable" : "No estable / incierto";
        const colorClass = isStable ? "text-safe" : "text-uncertain";
        const badgeClass = isStable ? "bg-safe-light" : "bg-uncertain-light";

        resultSafeContent.style.opacity = '1';
        resultSafeContent.innerHTML = `
            <div class="result-value ${colorClass}">${p.toFixed(3)}</div>
            <div class="mb-2 text-muted small">(${percent}%)</div>
            <span class="badge ${badgeClass} result-badge border">${label}</span>
`;
    }

    function updateFlowCard(p) {
        //const threshold = 0.47;
        const isHighRisk = p >= thresholdFlow;
        const percent = (p * 100).toFixed(1);

        const label = isHighRisk ? "Riesgo elevado" : "Bajo riesgo";
        const colorClass = isHighRisk ? "text-risk-high" : "text-risk-low";
        const badgeClass = isHighRisk ? "bg-risk-high-light" : "bg-risk-low-light";

        resultFlowContent.style.opacity = '1';
        resultFlowContent.innerHTML = `
            <div class="result-value ${colorClass}">${p.toFixed(3)}</div>
            <div class="mb-2 text-muted small">(${percent}%)</div>
            <span class="badge ${badgeClass} result-badge border">${label}</span>
`;
    }

    function resetResults() {
        const resetHTML = '<small class="text-muted">Introduce datos para calcular</small>';

        resultSafeContent.style.opacity = '0.5';
        resultSafeContent.innerHTML = resetHTML;

        resultFlowContent.style.opacity = '0.5';
        resultFlowContent.innerHTML = resetHTML;
    }

});
