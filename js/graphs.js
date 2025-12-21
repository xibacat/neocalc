import { calcSAFE, calcFLOWD } from './neocalcModels.js';

// Configuration for variables
const config = {
    flujo: { min: 0.2, max: 3.0, step: 0.1, label: 'Flujo ductal (mL)' },
    peso: { min: 300, max: 2500, step: 50, label: 'Peso (g)' },
    eg: { min: 22, max: 36, step: 0.5, label: 'Edad Gestacional (sem)' },
    edad: { min: 0, max: 21, step: 1, label: 'Edad inicio (días)' }
};

let currentXAxis = 'flujo';

// Chart Instances
let chartSafe = null;
let chartFlow = null;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    setupEventListeners();
    updateUIState();
    updateCharts();
});

function initCharts() {
    const ctxSafe = document.getElementById('chartSafe').getContext('2d');
    const ctxFlow = document.getElementById('chartFlow').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1.0,
                title: { display: true, text: 'Probabilidad' }
            },
            x: {
                title: { display: true, text: 'Variable' }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    chartSafe = new Chart(ctxSafe, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Probabilidad SAFE',
                borderColor: '#198754', // Bootstrap success
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: commonOptions
    });

    chartFlow = new Chart(ctxFlow, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Probabilidad FLOW-D',
                borderColor: '#dc3545', // Bootstrap danger
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: commonOptions
    });
}

function setupEventListeners() {
    // Axis Selection
    document.querySelectorAll('input[name="xAxis"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentXAxis = e.target.value;
            updateUIState();
            updateCharts();
        });
    });

    // Sliders
    ['flujo', 'peso', 'eg', 'edad'].forEach(key => {
        const slider = document.getElementById(`slider${capitalize(key)}`);
        const display = document.getElementById(`val${capitalize(key)}`);

        slider.addEventListener('input', (e) => {
            display.textContent = e.target.value;
            updateCharts();
        });
    });
}

function updateUIState() {
    // Enable all sliders first
    ['flujo', 'peso', 'eg', 'edad'].forEach(key => {
        const slider = document.getElementById(`slider${capitalize(key)}`);
        const group = document.getElementById(`group${capitalize(key)}`);

        if (key === currentXAxis) {
            slider.disabled = true;
            group.style.opacity = '0.5';
        } else {
            slider.disabled = false;
            group.style.opacity = '1';
        }
    });
}

function updateCharts() {
    // Get constant values from sliders
    const values = {
        flujo: parseFloat(document.getElementById('sliderFlujo').value),
        peso: parseFloat(document.getElementById('sliderPeso').value),
        eg: parseFloat(document.getElementById('sliderEg').value),
        edad: parseFloat(document.getElementById('sliderEdad').value)
    };

    // Generate Data Points
    const labels = [];
    const dataSafe = [];
    const dataFlow = [];

    const xConfig = config[currentXAxis];
    // Generate ~50 points
    const range = xConfig.max - xConfig.min;
    const step = range / 50;

    for (let x = xConfig.min; x <= xConfig.max; x += step) {
        // Update the varying parameter
        const currentVals = { ...values };
        currentVals[currentXAxis] = x;

        // Calculate
        const pSafe = calcSAFE(currentVals.flujo, currentVals.peso, currentVals.eg, currentVals.edad);
        const pFlow = calcFLOWD(currentVals.flujo, currentVals.peso, currentVals.eg, currentVals.edad);

        // Format label based on variable type (integers for weight/age vs decimals)
        let label = x;
        if (currentXAxis === 'peso') label = Math.round(x);
        else label = x.toFixed(2);

        labels.push(label);
        dataSafe.push(pSafe);
        dataFlow.push(pFlow);
    }

    // Update Charts
    [chartSafe, chartFlow].forEach(chart => {
        chart.data.labels = labels;
        chart.options.scales.x.title.text = xConfig.label;
    });

    chartSafe.data.datasets[0].data = dataSafe;
    chartFlow.data.datasets[0].data = dataFlow;

    chartSafe.update();
    chartFlow.update();
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
