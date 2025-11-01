// --- Calculus Matrix Theory ---
// by Bonamo 😈🔥

var id = "calculus_matrix";
var name = "Calculus Matrix";
var description = "A custom theory mixing calculus, linear algebra, and time decay.";
var authors = "Bonamo";
var version = 1;

var currency;
var c1, c2, c3, c4, c5;
var milestone1;
var publicationMultiplier;
var time = 0;
var decay = 1;

var init = () => {
    currency = theory.createCurrency("p", "p");

    // upgrades
    c1 = theory.createUpgrade(0, currency, new ExponentialCost(10, Math.log2(1.4)));
    c2 = theory.createUpgrade(1, currency, new ExponentialCost(20, Math.log2(1.5)));
    c3 = theory.createUpgrade(2, currency, new ExponentialCost(50, Math.log2(1.7)));
    c4 = theory.createUpgrade(3, currency, new ExponentialCost(100, Math.log2(1.8)));
    c5 = theory.createUpgrade(4, currency, new ExponentialCost(500, Math.log2(2.0)));

    // milestone every e25 publication points
    milestone1 = theory.createMilestoneUpgrade(0, 1);
    milestone1.getDescription = () => "Boosts equation with linear algebraic term";
    milestone1.getInfo = () => "Adds matrix synergy";
};

var tick = (elapsedTime, multiplier) => {
    let dt = elapsedTime * multiplier;
    time += dt;

    // decay slows progress around e750 p
    let softcap = Math.max(1, Math.log10(currency.value + 1) / 750);
    decay = Math.exp(-0.001 * softcap);

    // linear algebra mix + calculus-like integral term
    let integralTerm = (c1.level + 1) * Math.log(c2.level + 2);
    let matrixTerm = (c3.level * c4.level) ** 0.5 + Math.sin(time / 50);
    let growth = (integralTerm + matrixTerm + c5.level ** 1.2) * decay;

    currency.value += growth * dt;
};

var getEquationOverlay = () => {
    return `\\dot{p} = (\\int c_1 + \\log c_2 + M_{3,4} + c_5^{1.2}) \\cdot e^{-t/τ}`;
};

var getPublicationMultiplier = (tau) => 1 + Math.log10(1 + tau);
var getPublicationMultiplierFormula = (symbol) => "1 + log₁₀(1 + " + symbol + ")";

var getTau = () => currency.value ** 0.1;

var get2DGraphValue = () => Math.log10(currency.value + 1);

var getInternalState = () => `${time} ${currency.value}`;
var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 1) {
        time = parseFloat(values[0]);
        currency.value = parseFloat(values[1]);
    }
};

Theory = theory;