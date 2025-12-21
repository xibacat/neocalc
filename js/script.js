/**
 * Neocalc Calculator Script
 */

import {calcFLOWD, calcSAFE, thresholdFlow, thresholdSafe} from './neocalcModels.js';

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
        resetResults();
    });

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
