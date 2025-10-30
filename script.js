// Ultimate EI-style Custom Theory
const NormalTheory = {
    // Core variables
    alpha: 0,
    beta: 0,
    gamma: 0,
    c1: 1,
    c2: 1,
    c3: 1,
    p: 1,
    pLast: 1,
    tau: 0,
    totalTau: 0,

    // Thresholds
    alphaThreshold: 10,
    betaThreshold: 5,
    gammaThreshold: 2,

    // Late-game softcap
    lateCap: 1e750,
    lateCapK: 2,
    lateCapMultiplier: 1,

    // Step milestones
    stepMilestoneStep: 1e25,
    milestoneTerm: 1e20,
    stepMilestoneCount: 0,

    // Free start button
    startFree() {
        this.alpha = 0; this.beta = 0; this.gamma = 0;
        this.c1 = 1; this.c2 = 1; this.c3 = 1;
        this.p = 1; this.pLast = 1; this.tau = 0;
        this.totalTau = 0; this.stepMilestoneCount = 0;
        this.lateCapMultiplier = 1;
        if (typeof addToast === "function") addToast("🎉 Free start activated!", 4000, "success");
    },

    // Tick growth
    tick(dt) {
        // Late-game softcap factor
        const alphaSoftcap = 1 / (1 + Math.pow(this.alpha / this.lateCap, this.lateCapK) * this.lateCapMultiplier);
        const betaSoftcap  = 1 / (1 + Math.pow(this.beta / this.lateCap, this.lateCapK) * this.lateCapMultiplier);
        const gammaSoftcap = 1 / (1 + Math.pow(this.gamma / this.lateCap, this.lateCapK) * this.lateCapMultiplier);

        // Growth with softcaps
        this.alpha += dt * this.c1 / (1 + Math.log(Math.max(this.alpha, 1))) * alphaSoftcap;
        this.beta  += dt * this.c2 * Math.log(this.alpha + 2) / (1 + Math.log(Math.max(this.beta, 1))) * betaSoftcap;
        this.gamma += dt * this.c3 * Math.sqrt(this.alpha + this.beta + 1) / (1 + Math.log(Math.max(this.gamma, 1))) * gammaSoftcap;

        // Step milestones
        this.checkStepMilestones();
    },

    // Calculate current p
    calculateP() {
        this.p = Math.pow(this.calculateTau() + 1, 0.18);
        return this.p;
    },

    // Calculate tau
    calculateTau() {
        const alphaEff = Math.max(this.alpha - this.alphaThreshold, 0);
        const betaEff  = Math.max(this.beta - this.betaThreshold, 0);
        const gammaEff = Math.max(this.gamma - this.gammaThreshold, 0);

        const baseTau = Math.pow(alphaEff + 1, 0.5) *
                        Math.pow(betaEff + 1, 0.8) *
                        Math.pow(gammaEff + 1, 1.2) *
                        Math.max(this.p - this.pLast, 0);

        const milestoneBonus = this.stepMilestoneCount * this.milestoneTerm;
        return baseTau + milestoneBonus;
    },

    // Step milestone check
    checkStepMilestones() {
        let milestoneNumber = Math.floor(this.totalTau / this.stepMilestoneStep);
        while(milestoneNumber > this.stepMilestoneCount) {
            this.stepMilestoneCount++;
            // Optional: reduce softcap slightly per milestone
            this.lateCapMultiplier *= 0.99;
            if(typeof addToast === "function") addToast(`🏆 Step Milestone #${this.stepMilestoneCount} unlocked! +${this.milestoneTerm.toExponential(0)} τ`, 4000, "success");
        }
    },

    // Publish function
    publish() {
        this.calculateP();
        const gainedTau = this.calculateTau();
        this.totalTau += gainedTau;
        this.pLast = this.p;

        // Reset variables
        this.alpha = 0; this.beta = 0; this.gamma = 0;
        this.c1 = 1; this.c2 = 1; this.c3 = 1;

        if(typeof addToast === "function") {
            addToast(`✨ Published! +${gainedTau.toExponential(3)} τ | Total τ: ${this.totalTau.toExponential(3)}`, 5000, "success");
        }
    },

    // Upgrades
    upgrades: [
        { id: 'alphaBoost', name: 'Alpha Boost', desc: 'Increase alpha growth rate', cost: 10, apply: t => t.c1 *= 1.2 },
        { id: 'betaMultiplier', name: 'Beta Multiplier', desc: 'Increase beta growth depending on alpha', cost: 50, apply: t => t.c2 *= 1 + Math.log(t.alpha + 1) * 0.1 },
        { id: 'gammaAmplifier', name: 'Gamma Amplifier', desc: 'Increase gamma growth depending on alpha+beta', cost: 100, apply: t => t.c3 *= 1 + Math.sqrt(t.alpha + t.beta + 1) * 0.05 }
    ],

    onPurchase(id) {
        const u = this.upgrades.find(u => u.id === id);
        if(u) u.apply(this);
    },

    // Log
    getLog() {
        const formatBar = v => "[" + "#".repeat(Math.min(20, Math.floor(Math.log10(v + 1) || 0) + 1)) + "-".repeat(20 - Math.min(20, Math.floor(Math.log10(v + 1) || 0) + 1)) + "]";
        return `Alpha: ${formatBar(this.alpha)} ${this.alpha.toExponential(3)}\n` +
               `Beta: ${formatBar(this.beta)} ${this.beta.toExponential(3)}\n` +
               `Gamma: ${formatBar(this.gamma)} ${this.gamma.toExponential(3)}\n` +
               `τ: ${this.calculateTau().toExponential(3)} | Total τ: ${this.totalTau.toExponential(3)}\n` +
               `p: ${this.p.toExponential(3)} | pLast: ${this.pLast.toExponential(3)}\n` +
               `Step Milestones: ${this.stepMilestoneCount}`;
    }
};

// Register with SDK
Theory = NormalTheory;
