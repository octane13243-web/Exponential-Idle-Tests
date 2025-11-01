// --- OP Calculus Matrix Theory ---
// Author: Bonamo
// Version 1

var currency, c1, c2, c3, c4, c5;
var time = 0, decay = 1;
var permanentPenalty = 1;
var milestones = [];

var init = () => {
    currency = theory.createCurrency("p", "p");

    // upgrades
    c1 = theory.createUpgrade(0, currency, new ExponentialCost(10, Math.log2(1.4)));
    c2 = theory.createUpgrade(1, currency, new ExponentialCost(20, Math.log2(1.5)));
    c3 = theory.createUpgrade(2, currency, new ExponentialCost(50, Math.log2(1.7)));
    c4 = theory.createUpgrade(3, currency, new ExponentialCost(100, Math.log2(1.8)));
    c5 = theory.createUpgrade(4, currency, new ExponentialCost(500, Math.log2(2.0)));

    // milestones every e25, clickable
    for (let i = 0; i < 20; i++) {
        let m = theory.createMilestoneUpgrade(i, 1);
        m.getDescription = () => `Tap to activate milestone e${(i+1)*25}`;
        m.getInfo = () => "Early boost, later cost";
        milestones.push(m);
    }
};

var tick = (elapsedTime, multiplier) => {
    let dt = elapsedTime * multiplier;
    time += dt;

    // decay based on softcap
    decay = Math.exp(-0.001 * Math.max(1, Math.log10(currency.value+1)/750));

    let base = (c1.level+1) * Math.log(c2.level+2) + Math.sqrt(c3.level*c4.level) + c5.level**1.2;
    let opBoost = 0;

    milestones.forEach((m, idx) => {
        if (m.level > 0) {
            if (idx < 5) {
                // first 5 milestones are OP
                switch (idx % 4) {
                    case 0: opBoost += 5*(c1.level+c2.level+c3.level); break; // Σ
                    case 1: opBoost += 2*((c2.level+1)*(c3.level+1)*(c4.level+1)*(c5.level+1)**0.5); break; // Π
                    case 2: opBoost += Math.exp((c1.level+1)*time/500); break; // exponential
                    case 3: opBoost += Math.sqrt(c2.level**2 + c3.level**2 + c4.level**2)*3; break;
                }
            } else {
                // later milestones small boost + permanent penalty
                opBoost += 0.5*(c1.level+c2.level+c3.level+c4.level+c5.level);
                if (currency.value > 1e1000) permanentPenalty = 0.9; // permanent 10% cut
            }
        }
    });

    currency.value += (base + opBoost) * decay * permanentPenalty * dt;
};

var getEquationOverlay = () => {
    let eq = "\\dot{p} = (\\int c_1 + \\log(c_2) + √(c_3 c_4) + c_5^{1.2}";

    milestones.forEach((m, idx) => {
        if (m.level > 0) {
            if (idx < 5) {
                switch(idx % 4) {
                    case 0: eq += " + Σ_{i=1}^{3}c_i"; break;
                    case 1: eq += " + Π_{i=2}^{5}(c_i+1)^{0.5}"; break;
                    case 2: eq += " + e^{c_1*t/500}"; break;
                    case 3: eq += " + √(c_2²+c_3²+c_4²)*3"; break;
                }
            } else {
                eq += " + minor_boost"; // smaller overlay term
            }
        }
    });

    eq += ")";
    return eq;
};

var getPublicationMultiplier = (tau) => 1 + Math.log10(1 + tau);
var getPublicationMultiplierFormula = (symbol) => "1 + log₁₀(1 + " + symbol + ")";
var getTau = () => currency.value ** 0.1;
var get2DGraphValue = () => Math.log10(currency.value + 1);

Theory = theory;