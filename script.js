// Calculus Matrix Theory - SDK-ready
// Features: 5 vars (a,b,c,d,e), matrix transform, integral-style tick growth,
// decay that grows with time but can be shrunk by upgrades, p/pLast publish logic,
// free start button, upgrades, milestones, and fancy toast.
// Register: Theory = CalculusMatrixTheory;

const CalculusMatrixTheory = {
    // --- core state ---
    a: 1, b: 1, c: 1, d: 1, e: 1,         // five variables
    varsVec() { return [this.a, this.b, this.c, this.d, this.e]; },
    setVarsFromVec(v) { [this.a, this.b, this.c, this.d, this.e] = v; },

    // growth multipliers (upgrades affect these)
    m1: 1, m2: 1, m3: 1, m4: 1, m5: 1,

    // matrix (5x5) controlling linear-algebra coupling (tweakable)
    // stored as flat array rows: M[row][col]
    M: [
        [1.0, 0.05, 0.00, 0.00, 0.02],
        [0.02, 1.0, 0.04, 0.00, 0.00],
        [0.00, 0.03, 1.0, 0.02, 0.00],
        [0.00, 0.00, 0.04, 1.0, 0.03],
        [0.01, 0.00, 0.00, 0.02, 1.0]
    ],

    // integration / continuous timing
    time: 0,                 // total simulated time
    dtBase: 1/30,            // base dt per tick (approx 30 FPS style)

    // decay machinery
    baseDecay: 0.0002,      // baseline decay rate
    decayGrowthRate: 1e-7,  // how much the decay grows per second (time increases it)
    decayShrinkMult: 1.0,   // multiplicative factor reduced by upgrades (≤1 to shrink)

    // publication
    p: 1,        // current publication multiplier
    pLast: 1,    // p at last publication
    totalTau: 0,

    // thresholds before contributing to tau
    thresholds: { a: 5, b: 5, c: 5, d: 5, e: 5 },

    // step-milestones add additive term to tau formula (every stepTermStep totalTau)
    stepTermStep: 1e25,
    milestoneTerm: 1e20,
    stepMilestoneCount: 0,

    // --- helper math funcs ---
    _matVecMul(M, v) {
        const out = [];
        for (let i=0;i<M.length;i++) {
            let s = 0;
            for (let j=0;j<v.length;j++) s += M[i][j] * v[j];
            out.push(s);
        }
        return out;
    },

    _vecAdd(u,v) { return u.map((x,i)=>x+v[i]); },
    _vecScale(v, s) { return v.map(x=>x*s); },

    // --- start / free button ---
    startFree() {
        this.a = this.b = this.c = this.d = this.e = 1;
        this.m1 = this.m2 = this.m3 = this.m4 = this.m5 = 1;
        this.time = 0; this.p = 1; this.pLast = 1; this.totalTau = 0;
        this.stepMilestoneCount = 0; this.decayShrinkMult = 1.0;
        if (typeof addToast === "function") addToast("🎉 Free start: Calculus Matrix Theory activated!", 4000, "success");
    },

    // --- tick: integral-ish continuous update w/ matrix coupling and decay growth ---
    tick(dt, multiplier) {
        // combined dt
        const realDt = (dt === undefined ? this.dtBase : dt) * (multiplier === undefined ? 1 : multiplier);
        this.time += realDt;

        // growth vector (integrand) using each var's local growth function
        // mix of linear, log, exp-ish, trig for calculus flavor
        const v = this.varsVec();
        const growth = [
            this.m1 * (1 + 0.1*Math.log(Math.max(this.a,1)) ),                     // a: log-ish integrand
            this.m2 * (1 + 0.02*this.time + 0.05*Math.sqrt(Math.max(this.b,1)) ), // b: time-influenced + sqrt
            this.m3 * (1 + Math.sin(this.time*0.01)*0.01 + 0.03*this.c ),         // c: tiny oscillation + coupling
            this.m4 * (1 + Math.log(Math.max(this.d,1))*0.02 ),                   // d: slow log
            this.m5 * (1 + 0.0005*this.time + Math.pow(Math.max(this.e,1),0.2) )  // e: grows with e^(0.2) effect
        ];

        // linear algebra coupling: M * growth gives additional cross-influence
        const coupled = this._matVecMul(this.M, growth);

        // combine growth and coupling into var derivatives
        const deriv = this._vecAdd(growth, coupled);

        // compute decay rate (it grows over time unless shrunk by upgrades)
        // decayRate(t) = baseDecay * (1 + decayGrowthRate * time) * decayShrinkMult
        const decayRate = this.baseDecay * (1 + this.decayGrowthRate * this.time) * this.decayShrinkMult;

        // apply integration: v += deriv * dt - decay * v * dt
        for (let i=0;i<5;i++){
            v[i] += deriv[i] * realDt;
            v[i] -= decayRate * v[i] * realDt; // proportional (exponential-style) decay slice
            // clamp to avoid negatives
            if (v[i] < 0) v[i] = 0;
        }

        // commit back
        this.setVarsFromVec(v);

        // check step milestones (based on totalTau)
        this.checkStepMilestones();
    },

    // --- tau math: uses thresholds, p/pLast, and milestone additive term ---
    _effective(varVal, threshold) {
        return Math.max(varVal - threshold, 0);
    },

    calculateRawTau() {
        const aEff = this._effective(this.a, this.thresholds.a);
        const bEff = this._effective(this.b, this.thresholds.b);
        const cEff = this._effective(this.c, this.thresholds.c);
        const dEff = this._effective(this.d, this.thresholds.d);
        const eEff = this._effective(this.e, this.thresholds.e);

        // example product-based tau with calculus flavor (exponents chosen for balance)
        const base = Math.pow(aEff + 1, 0.45) *
                     Math.pow(bEff + 1, 0.75) *
                     Math.pow(cEff + 1, 0.95) *
                     Math.pow(dEff + 1, 0.6) *
                     Math.pow(eEff + 1, 1.1);
        return base;
    },

    calculateP() {
        // p based on current raw tau (standard exponent)
        const raw = this.calculateRawTau();
        this.p = Math.pow(raw + 1, 0.18);
        return this.p;
    },

    getTauGain() {
        // tau gain uses delta p since last publication
        this.calculateP();
        const deltaP = Math.max(this.p - this.pLast, 0);
        if (deltaP <= 0) {
            // milestones still add additive term even if deltaP <=0, but base is zero
            return this.stepMilestoneCount * this.milestoneTerm;
        }
        const base = this.calculateRawTau();
        const milestoneBonus = this.stepMilestoneCount * this.milestoneTerm;
        return base * deltaP + milestoneBonus;
    },

    // --- publish resets and updates ---
    publish() {
        const gained = this.getTauGain();
        this.totalTau += gained;
        this.pLast = this.p;
        // reset variables but keep milestones/total/pLast and shrink upgrades
        this.a = this.b = this.c = this.d = this.e = 1;
        // small decayShrinkMult persists as effect of upgrades (do not reset)
        if (typeof addToast === "function") addToast(`✨ Published! +${gained.toExponential(3)} τ | Total τ: ${this.totalTau.toExponential(3)}`, 5000, "success");
    },

    // --- step milestones: every stepTermStep totalTau adds additive term to tau formula ---
    stepTermStep: 1e25,
    milestoneTerm: 1e20,
    checkStepMilestones() {
        const milestoneNumber = Math.floor(this.totalTau / this.stepTermStep);
        while (milestoneNumber > this.stepMilestoneCount) {
            this.stepMilestoneCount++;
            // each milestone slightly reduces hard softcap growth of decay
            this.decayShrinkMult *= 0.995; // small persistent benefit
            if (typeof addToast === "function") addToast(`🏆 Milestone #${this.stepMilestoneCount} unlocked! +${this.milestoneTerm.toExponential(0)} added to τ equation`, 3500, "success");
        }
    },

    // --- upgrades (real EI-style, non-linear, interact with decay & matrix) ---
    upgrades: [
        {
            id: 'u_growth_matrix',
            name: 'Matrix Tuning',
            desc: 'Improve matrix coupling efficiency and growth (reduces some off-diagonal drag).',
            cost: 1e1,
            apply: (t) => {
                // slightly increase diagonal dominance to speed cross-coupling beneficially
                for (let i=0;i<5;i++) {
                    t.M[i][i] *= 1.02;
                }
            }
        },
        {
            id: 'u_decay_compressor',
            name: 'Decay Compressor',
            desc: 'Shrinks decay multiplier (reduces decay growth).',
            cost: 1e2,
            apply: (t) => {
                t.decayShrinkMult *= 0.85; // significant shrink
            }
        },
        {
            id: 'u_time_tuner',
            name: 'Time Tuner',
            desc: 'Boosts time-driven growth terms (helps long-run calculus growth).',
            cost: 1e3,
            apply: (t) => {
                t.m2 *= 1.2;
                t.m5 *= 1.1;
            }
        },
        {
            id: 'u_local_boost',
            name: 'Local Boosters',
            desc: 'Multiplicatively buff local growth multipliers.',
            cost: 1e4,
            apply: (t) => { t.m1 *= 1.15; t.m3 *= 1.15; t.m4 *= 1.15; }
        },
        {
            id: 'u_matrix_overdrive',
            name: 'Matrix Overdrive',
            desc: 'Temporarily overdrives matrix to produce big coupling (one-shot effect).',
            cost: 1e6,
            apply: (t) => {
                // one-shot: nudge all off-diagonals up temporarily
                for (let i=0;i<5;i++) for (let j=0;j<5;j++) if (i!==j) t.M[i][j] += 0.02;
            }
        }
    ],

    // small convenience: purchase handling
    onPurchase(id) {
        const u = this.upgrades.find(x=>x.id===id);
        if (u && typeof u.apply === 'function') u.apply(this);
    },

    // --- UI helpers ---
    getLog() {
        const fmt = x => x.toExponential ? x.toExponential(3) : Number(x).toExponential(3);
        const bar = v => {
            const len = Math.min(20, Math.floor(Math.log10(Math.max(v,1))||0)+1);
            return "[" + "#".repeat(len) + "-".repeat(20-len) + "]";
        };
        return `a: ${bar(this.a)} ${fmt(this.a)}\n` +
               `b: ${bar(this.b)} ${fmt(this.b)}\n` +
               `c: ${bar(this.c)} ${fmt(this.c)}\n` +
               `d: ${bar(this.d)} ${fmt(this.d)}\n` +
               `e: ${bar(this.e)} ${fmt(this.e)}\n\n` +
               `rawTau:${fmt(this.calculateRawTau())} | p:${fmt(this.p)} | pLast:${fmt(this.pLast)}\n` +
               `gainOnPub:${fmt(this.getTauGain())} | totalTau:${fmt(this.totalTau)}\n` +
               `decayShrinkMult:${this.decayShrinkMult.toFixed(4)} | time:${this.time.toFixed(1)}s\n` +
               `StepMilestones:${this.stepMilestoneCount}`;
    },

    getMainEquation() {
        return "τ = Π(term_i^(exp_i)) * (p - pLast)  + stepMilestoneBonus\n(where term_i are effective (var - threshold))";
    },

    // map to 3D for the graph (collapse 5 vars)
    get3DGraphPoint() {
        return { x: this.a, y: this.b, z: this.c + this.d + this.e };
    }
};

// register
Theory = CalculusMatrixTheory;