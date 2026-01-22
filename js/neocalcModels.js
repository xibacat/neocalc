// --- Mathematical Models ---
export { calcFLOWD, calcSAFE, flujoML, thresholdFlow, thresholdSafe };

const thresholdFlow = 0.47;
const thresholdSafe = 0.459;
/**
 * Calculates SAFE probability (Stable Phenotype).
 * Returns a number between 0 and 1.
 */
function calcSAFE(FLUJOML, PesoD1, EGsem, EdadInicio) {

    // Coeficients SAFE (from R)
    const b0 = -28.20254534;
    const b_flujo = 0.58022365;
    const b_peso = 0.01695558;
    const b_eg = 0.45355769;
    const b_edad = 0.18274358;

    const logit =
        b0 +
        b_flujo * FLUJOML +
        b_peso * PesoD1 +
        b_eg * EGsem +
        b_edad * EdadInicio;

    const prob = 1 / (1 + Math.exp(-logit));
    return prob;
}
/**
 * Calculates ductal flow (mL/min).
 */
function flujoML(D, vmax, fc) {
    D = D / 1000;
    //Area = pi * r^2 / 2 = pi * D^2 / 4
    //Flow = Area * fc * vmax = pi * D^2 / 4 * fc * vmax
    //Multiply by 1000 to convert to mL/min
    return Math.PI * D * D / 4 * fc * vmax * 1000;
}
/**
 * Calculates FLOW-D probability (Adverse Outcome).
 * Returns a number between 0 and 1.
 */
function calcFLOWD(FLUJOML, PesoD1, EGsem, EdadInicio) {

    // Coeficients FLOW-D (from R)
    const b0 = 32.78823733;
    const b_ns1 = 1.75804767;
    const b_ns2 = -14.14134246;
    const b_ns3 = -8.35643658;
    const b_peso = -0.02250974;
    const b_eg = -0.28389427;
    const b_edad = -0.17834946;

    const [ns1, ns2, ns3] = naturalSplineFLUJOML(FLUJOML);

    const logit =
        b0 +
        b_ns1 * ns1 +
        b_ns2 * ns2 +
        b_ns3 * ns3 +
        b_peso * PesoD1 +
        b_eg * EGsem +
        b_edad * EdadInicio;

    const prob = 1 / (1 + Math.exp(-logit));
    return prob;
}
function naturalSplineFLUJOML(x) {
    // Knots and limits (from R)
    const k1 = 0.9012766;
    const k2 = 1.2678588;
    const b0 = 0.2261947;
    const b1 = 2.7967098;

    function tp(x, k) {
        return Math.pow(Math.max(x - k, 0), 3);
    }

    const d1 = (tp(x, k1) - tp(x, k2)) / (k2 - k1);
    const d2 = (tp(x, k2) - tp(x, b1)) / (b1 - k2);

    // Natural base spline (3 functions)
    const ns1 = x;
    const ns2 = d1 - d2;
    const ns3 = d2;

    return [ns1, ns2, ns3];
}