/* ==========================================================================
   ELECTRO-MINDSET EEE HUB - ALL-IN-ONE ELECTRICAL ENGINEERING CALCULATOR
   Standard-compliant calculations, SI units, step-by-step solutions,
   engineering notation, dynamic graphs, formula library, and history.
   ========================================================================== */

(function () {
  'use strict';

  // Global Calculator State
  const CalcState = {
    activeNavTab: 'calculators', // 'calculators', 'wizard', 'engineermode', 'graphs', 'formulas', 'converter', 'history'
    activeCategory: 'fundamentals',
    notationMode: 'engineering', // 'standard', 'scientific', 'engineering'
    history: JSON.parse(localStorage.getItem('eee_calc_history') || '[]'),
    loadItems: [
      { name: 'Lighting Circuit', qty: 10, watts: 18, hours: 6 },
      { name: 'Air Conditioner', qty: 2, watts: 1500, hours: 8 },
      { name: 'Water Heater', qty: 1, watts: 3000, hours: 2 },
      { name: 'Induction Motor', qty: 1, watts: 2200, hours: 4 }
    ],
    bjtConfig: 'common-emitter',
    activeWizard: 'cable'
  };

  window.CalcState = CalcState;

  /* ==========================================================================
     ENGINEERING & SI NOTATION FORMATTER
     ========================================================================== */
  function formatNumber(val, unit = '', decimals = 3) {
    if (val === null || val === undefined || isNaN(val)) return 'Invalid';
    if (val === 0) return `0 ${unit}`.trim();

    const mode = CalcState.notationMode || 'engineering';

    if (mode === 'scientific') {
      return `${val.toExponential(decimals)} ${unit}`.trim();
    }

    if (mode === 'standard') {
      if (Math.abs(val) >= 10000 || (Math.abs(val) < 0.001 && val !== 0)) {
        return `${val.toPrecision(4)} ${unit}`.trim();
      }
      return `${parseFloat(val.toFixed(decimals))} ${unit}`.trim();
    }

    // Engineering notation with standard SI prefixes
    const prefixes = [
      { exp: 12, symbol: 'T' },
      { exp: 9, symbol: 'G' },
      { exp: 6, symbol: 'M' },
      { exp: 3, symbol: 'k' },
      { exp: 0, symbol: '' },
      { exp: -3, symbol: 'm' },
      { exp: -6, symbol: 'µ' },
      { exp: -9, symbol: 'n' },
      { exp: -12, symbol: 'p' }
    ];

    const abs = Math.abs(val);
    for (const p of prefixes) {
      const threshold = Math.pow(10, p.exp);
      if (abs >= threshold * 0.9999 || p.exp === -12) {
        const scaled = val / threshold;
        return `${parseFloat(scaled.toFixed(decimals))} ${p.symbol}${unit}`.trim();
      }
    }
    return `${parseFloat(val.toFixed(decimals))} ${unit}`.trim();
  }

  window.formatNumber = formatNumber;

  /* ==========================================================================
     CALCULATION HISTORY MANAGER
     ========================================================================== */
  function saveToHistory(calcName, inputsSummary, resultSummary, steps = null) {
    const entry = {
      id: 'calc_' + Date.now(),
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
      name: calcName,
      inputs: inputsSummary,
      result: resultSummary,
      steps: steps
    };

    CalcState.history.unshift(entry);
    if (CalcState.history.length > 50) CalcState.history.pop();
    localStorage.setItem('eee_calc_history', JSON.stringify(CalcState.history));
    updateHistoryUI();
  }

  function clearHistory() {
    CalcState.history = [];
    localStorage.removeItem('eee_calc_history');
    updateHistoryUI();
    showToast('Calculation history cleared');
  }

  function deleteHistoryItem(id) {
    CalcState.history = CalcState.history.filter(item => item.id !== id);
    localStorage.setItem('eee_calc_history', JSON.stringify(CalcState.history));
    updateHistoryUI();
  }

  function exportHistory(format = 'json') {
    if (CalcState.history.length === 0) {
      showToast('No calculation history to export');
      return;
    }

    let dataStr = '';
    let fileName = `engineering_calculations_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const headers = ['Timestamp', 'Calculator', 'Inputs', 'Result'];
      const rows = CalcState.history.map(h => [
        `"${h.dateStr}"`,
        `"${h.name}"`,
        `"${h.inputs.replace(/"/g, '""')}"`,
        `"${h.result.replace(/"/g, '""')}"`
      ]);
      dataStr = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      fileName += '.csv';
    } else {
      dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(CalcState.history, null, 2));
      fileName += '.json';
    }

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported history as ${format.toUpperCase()}`);
  }

  window.saveToHistory = saveToHistory;
  window.clearHistory = clearHistory;
  window.deleteHistoryItem = deleteHistoryItem;
  window.exportHistory = exportHistory;

  /* ==========================================================================
     STEP-BY-STEP SOLUTION RENDERER HELPER
     ========================================================================== */
  function renderSolution(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.error) {
      container.innerHTML = `
        <div class="eng-error-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div><strong>Error:</strong> ${data.error}</div>
        </div>
      `;
      return;
    }

    let givenHtml = '';
    if (data.given && Array.isArray(data.given)) {
      givenHtml = data.given.map(g => `<span>${g.symbol} = ${g.value}</span>`).join(' &nbsp;|&nbsp; ');
    } else if (data.given) {
      givenHtml = data.given;
    }

    let intermediateHtml = '';
    if (data.calculation) {
      intermediateHtml = `
        <div class="eng-step-row">
          <div class="eng-step-label">Calculations:</div>
          <div class="eng-step-content">${data.calculation}</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="eng-solution-box">
        <div class="eng-solution-header">
          <div class="eng-solution-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Step-by-Step Engineering Solution
          </div>
          <button class="btn btn-sm btn-ghost" onclick="copyResult('${data.answerRaw || data.answer}')" title="Copy result">
            📋 Copy
          </button>
        </div>

        <div class="eng-step-row">
          <div class="eng-step-label">Given:</div>
          <div class="eng-step-content">${givenHtml}</div>
        </div>

        <div class="eng-step-row">
          <div class="eng-step-label">Formula:</div>
          <div class="eng-step-content" style="color: var(--accent-cyan); font-weight: 600;">${data.formula}</div>
        </div>

        <div class="eng-step-row">
          <div class="eng-step-label">Substitution:</div>
          <div class="eng-step-content">${data.substitution}</div>
        </div>

        ${intermediateHtml}

        <div class="eng-final-answer">
          <div>
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Final Result</div>
            <div class="eng-final-val">${data.answer}</div>
            ${data.additionalNotes ? `<div class="eng-notations-sub">${data.additionalNotes}</div>` : ''}
          </div>
          <button class="btn btn-sm btn-primary" onclick="saveCurrentCalc('${data.calcName || 'Calculation'}', '${data.inputsSummary || ''}', '${data.answer}')">
            ★ Save
          </button>
        </div>
      </div>
    `;
  }

  window.renderSolution = renderSolution;

  window.copyResult = function (val) {
    if (!val) return;
    navigator.clipboard.writeText(String(val)).then(() => {
      showToast('Result copied to clipboard');
    }).catch(() => {
      showToast('Could not copy result');
    });
  };

  window.saveCurrentCalc = function (name, inputs, result) {
    saveToHistory(name, inputs, result);
    showToast(`Saved ${name} to History`);
  };

  /* ==========================================================================
     CORE CALCULATOR ENGINES
     ========================================================================== */

  // 1. FUNDAMENTALS
  window.calcOhmsLaw = function () {
    const v = parseFloat(document.getElementById('ohm-in-v')?.value);
    const i = parseFloat(document.getElementById('ohm-in-i')?.value);
    const r = parseFloat(document.getElementById('ohm-in-r')?.value);

    const count = [v, i, r].filter(val => !isNaN(val) && val > 0).length;
    if (count < 2) {
      renderSolution('ohm-solution', { error: 'Please enter at least any 2 positive values to solve for the 3rd variable.' });
      return;
    }

    if (!isNaN(v) && !isNaN(i) && (isNaN(r) || r === 0)) {
      if (i === 0) { renderSolution('ohm-solution', { error: 'Current cannot be zero when solving resistance (division by zero).' }); return; }
      const res = v / i;
      const p = v * i;
      renderSolution('ohm-solution', {
        calcName: "Ohm's Law (Resistance)",
        inputsSummary: `V = ${v} V, I = ${i} A`,
        given: [{ symbol: 'V', value: `${v} V` }, { symbol: 'I', value: `${i} A` }],
        formula: 'R = V / I &nbsp;|&nbsp; P = V × I',
        substitution: `R = ${v} / ${i} &nbsp;|&nbsp; P = ${v} × ${i}`,
        calculation: `R = ${(v / i).toFixed(4)} Ω, Power dissipation = ${(v * i).toFixed(2)} W`,
        answer: `R = ${formatNumber(res, 'Ω')}`,
        additionalNotes: `Electric Power P = ${formatNumber(p, 'W')}`,
        answerRaw: `${res} Ω`
      });
      const elR = document.getElementById('ohm-in-r');
      if (elR) elR.value = res.toFixed(3);
    } else if (!isNaN(v) && !isNaN(r) && (isNaN(i) || i === 0)) {
      if (r === 0) { renderSolution('ohm-solution', { error: 'Resistance cannot be zero (short circuit).' }); return; }
      const cur = v / r;
      const p = (v * v) / r;
      renderSolution('ohm-solution', {
        calcName: "Ohm's Law (Current)",
        inputsSummary: `V = ${v} V, R = ${r} Ω`,
        given: [{ symbol: 'V', value: `${v} V` }, { symbol: 'R', value: `${r} Ω` }],
        formula: 'I = V / R &nbsp;|&nbsp; P = V² / R',
        substitution: `I = ${v} / ${r} &nbsp;|&nbsp; P = ${v}² / ${r}`,
        calculation: `I = ${(v / r).toFixed(4)} A, Power dissipation = ${((v * v) / r).toFixed(2)} W`,
        answer: `I = ${formatNumber(cur, 'A')}`,
        additionalNotes: `Electric Power P = ${formatNumber(p, 'W')}`,
        answerRaw: `${cur} A`
      });
      const elI = document.getElementById('ohm-in-i');
      if (elI) elI.value = cur.toFixed(3);
    } else if (!isNaN(i) && !isNaN(r) && (isNaN(v) || v === 0)) {
      const volt = i * r;
      const p = i * i * r;
      renderSolution('ohm-solution', {
        calcName: "Ohm's Law (Voltage)",
        inputsSummary: `I = ${i} A, R = ${r} Ω`,
        given: [{ symbol: 'I', value: `${i} A` }, { symbol: 'R', value: `${r} Ω` }],
        formula: 'V = I × R &nbsp;|&nbsp; P = I² × R',
        substitution: `V = ${i} × ${r} &nbsp;|&nbsp; P = (${i})² × ${r}`,
        calculation: `V = ${(i * r).toFixed(4)} V, Power dissipation = ${(i * i * r).toFixed(2)} W`,
        answer: `V = ${formatNumber(volt, 'V')}`,
        additionalNotes: `Electric Power P = ${formatNumber(p, 'W')}`,
        answerRaw: `${volt} V`
      });
      const elV = document.getElementById('ohm-in-v');
      if (elV) elV.value = volt.toFixed(3);
    }
  };

  window.calcElectricalPower = function () {
    const v = parseFloat(document.getElementById('pwr-in-v')?.value) || 0;
    const i = parseFloat(document.getElementById('pwr-in-i')?.value) || 0;
    const r = parseFloat(document.getElementById('pwr-in-r')?.value) || 0;

    let p = 0;
    let formula = '';
    let subst = '';

    if (v > 0 && i > 0) {
      p = v * i;
      formula = 'P = V × I';
      subst = `P = ${v} V × ${i} A`;
    } else if (i > 0 && r > 0) {
      p = i * i * r;
      formula = 'P = I² × R';
      subst = `P = (${i} A)² × ${r} Ω`;
    } else if (v > 0 && r > 0) {
      p = (v * v) / r;
      formula = 'P = V² / R';
      subst = `P = (${v} V)² / ${r} Ω`;
    } else {
      renderSolution('pwr-solution', { error: 'Please enter any two parameters: (V & I), (I & R), or (V & R).' });
      return;
    }

    const hp = p / 745.7;
    renderSolution('pwr-solution', {
      calcName: 'Electrical Power',
      inputsSummary: `V=${v}V, I=${i}A, R=${r}Ω`,
      given: `V = ${v || '-'} V, I = ${i || '-'} A, R = ${r || '-'} Ω`,
      formula: formula,
      substitution: subst,
      calculation: `P = ${p.toFixed(3)} Watts (${hp.toFixed(2)} Horsepower)`,
      answer: `P = ${formatNumber(p, 'W')}`,
      additionalNotes: `Mechanical Equivalent: ${hp.toFixed(2)} HP (1 HP = 745.7 W)`,
      answerRaw: `${p} W`
    });
  };

  window.calcConductorResistance = function () {
    const mat = document.getElementById('resis-mat')?.value || 'copper';
    const l = parseFloat(document.getElementById('resis-len')?.value) || 0;
    const a = parseFloat(document.getElementById('resis-area')?.value) || 0;

    if (l <= 0 || a <= 0) {
      renderSolution('resis-solution', { error: 'Length and Cross-sectional Area must be greater than 0.' });
      return;
    }

    const rho = mat === 'copper' ? 1.75e-8 : (mat === 'aluminum' ? 2.82e-8 : 1.0e-7);
    const aM2 = a * 1e-6; // mm^2 to m^2
    const r = (rho * l) / aM2;
    const g = 1 / r;
    const rhoExp = mat === 'copper' ? '1.75 × 10⁻⁸' : (mat === 'aluminum' ? '2.82 × 10⁻⁸' : '1.0 × 10⁻⁷');

    renderSolution('resis-solution', {
      calcName: 'Conductor Resistance & Conductance',
      inputsSummary: `${mat.toUpperCase()}, L=${l}m, A=${a}mm²`,
      given: `Material = ${mat.toUpperCase()}, ρ = ${rhoExp} Ω·m, Length L = ${l} m, Area A = ${a} mm² (${aM2.toExponential(2)} m²)`,
      formula: 'R = ρ × L / A &nbsp;|&nbsp; Conductance G = 1 / R',
      substitution: `R = (${rhoExp} × ${l}) / (${aM2.toExponential(2)})`,
      calculation: `R = ${r.toFixed(4)} Ω, Conductance G = ${g.toFixed(3)} Siemens (S)`,
      answer: `R = ${formatNumber(r, 'Ω')}`,
      additionalNotes: `Conductance G = ${formatNumber(g, 'S')}`,
      answerRaw: `${r} Ω`
    });
  };

  window.calcVoltageDivider = function () {
    const vin = parseFloat(document.getElementById('vdiv-vin')?.value) || 0;
    const r1 = parseFloat(document.getElementById('vdiv-r1')?.value) || 0;
    const r2 = parseFloat(document.getElementById('vdiv-r2')?.value) || 0;

    if (r1 + r2 <= 0) {
      renderSolution('vdiv-solution', { error: 'Sum of R1 and R2 must be greater than 0.' });
      return;
    }

    const vout = vin * (r2 / (r1 + r2));
    const ir = vin / (r1 + r2);

    renderSolution('vdiv-solution', {
      calcName: 'Voltage Divider',
      inputsSummary: `Vin=${vin}V, R1=${r1}Ω, R2=${r2}Ω`,
      given: `Vin = ${vin} V, R1 = ${r1} Ω, R2 = ${r2} Ω`,
      formula: 'Vout = Vin × R2 / (R1 + R2)',
      substitution: `Vout = ${vin} × ${r2} / (${r1} + ${r2})`,
      calculation: `Divider branch current I = ${ir.toFixed(4)} A, Ratio = ${(r2 / (r1 + r2)).toFixed(4)}`,
      answer: `Vout = ${formatNumber(vout, 'V')}`,
      additionalNotes: `Divider Current I = ${formatNumber(ir, 'A')}, VR1 = ${formatNumber(vin - vout, 'V')}`,
      answerRaw: `${vout} V`
    });
  };

  // 2. DC CIRCUITS
  window.calcSeriesParallelResistors = function () {
    const r1 = parseFloat(document.getElementById('rcomb-r1')?.value) || 0;
    const r2 = parseFloat(document.getElementById('rcomb-r2')?.value) || 0;
    const r3 = parseFloat(document.getElementById('rcomb-r3')?.value) || 0;

    const arr = [r1, r2, r3].filter(v => v > 0);
    if (arr.length < 2) {
      renderSolution('rcomb-solution', { error: 'Please enter at least 2 resistor values.' });
      return;
    }

    const rSeries = arr.reduce((acc, v) => acc + v, 0);
    const rParInv = arr.reduce((acc, v) => acc + (1 / v), 0);
    const rParallel = 1 / rParInv;

    renderSolution('rcomb-solution', {
      calcName: 'Series & Parallel Resistors',
      inputsSummary: arr.map((v, i) => `R${i + 1}=${v}Ω`).join(', '),
      given: arr.map((v, i) => `R${i + 1} = ${v} Ω`).join(', '),
      formula: 'Series: Rtotal = R1 + R2 + ... &nbsp;|&nbsp; Parallel: 1/Rtotal = 1/R1 + 1/R2 + ...',
      substitution: `Series: ${arr.join(' + ')} &nbsp;|&nbsp; Parallel: 1/(${arr.map(v => `1/${v}`).join(' + ')})`,
      calculation: `Series sum = ${rSeries.toFixed(2)} Ω, Parallel conductance sum = ${rParInv.toFixed(4)} S`,
      answer: `R(Series) = ${formatNumber(rSeries, 'Ω')} &nbsp;|&nbsp; R(Parallel) = ${formatNumber(rParallel, 'Ω')}`,
      additionalNotes: `Parallel equivalent is always strictly lower than the smallest resistor (${Math.min(...arr)} Ω).`,
      answerRaw: `Series: ${rSeries} Ω, Parallel: ${rParallel} Ω`
    });
  };

  window.calcRcTimeConstant = function () {
    const r = parseFloat(document.getElementById('rct-r')?.value) || 0;
    const cMicro = parseFloat(document.getElementById('rct-c')?.value) || 0;
    const v0 = parseFloat(document.getElementById('rct-v')?.value) || 12;

    if (r <= 0 || cMicro <= 0) {
      renderSolution('rct-solution', { error: 'Resistance and Capacitance must be greater than 0.' });
      return;
    }

    const cFarad = cMicro * 1e-6;
    const tau = r * cFarad; // seconds
    const t5tau = tau * 5;
    const v1tau = v0 * (1 - Math.exp(-1)); // ~63.2%

    renderSolution('rct-solution', {
      calcName: 'RC Time Constant & Transient',
      inputsSummary: `R=${r}Ω, C=${cMicro}µF, V0=${v0}V`,
      given: `Resistance R = ${r} Ω, Capacitance C = ${cMicro} µF (${cFarad.toExponential(2)} F), Voltage V0 = ${v0} V`,
      formula: 'Time Constant τ = R × C &nbsp;|&nbsp; Vc(t) = V0(1 - e^(-t/τ))',
      substitution: `τ = ${r} Ω × ${cFarad.toExponential(2)} F`,
      calculation: `At 1τ (63.2% charge): Vc = ${v1tau.toFixed(2)} V. Full charge reached at 5τ = ${(t5tau * 1000).toFixed(2)} ms.`,
      answer: `τ = ${formatNumber(tau, 's')}`,
      additionalNotes: `5τ (Full Charge 99.3%): ${formatNumber(t5tau, 's')} &nbsp;|&nbsp; Voltage at 1τ: ${formatNumber(v1tau, 'V')}`,
      answerRaw: `${tau} s`
    });

    drawRcCanvas(v0, tau);
  };

  // 3. AC CIRCUITS
  window.calcAcWaveform = function () {
    const vPeak = parseFloat(document.getElementById('acwave-vp')?.value) || 0;
    const freq = parseFloat(document.getElementById('acwave-freq')?.value) || 50;

    if (vPeak <= 0 || freq <= 0) {
      renderSolution('acwave-solution', { error: 'Peak Voltage and Frequency must be positive numbers.' });
      return;
    }

    const vRms = vPeak / Math.SQRT2;
    const vPp = 2 * vPeak;
    const period = 1 / freq;
    const omega = 2 * Math.PI * freq;

    renderSolution('acwave-solution', {
      calcName: 'AC Waveform Parameters',
      inputsSummary: `Vpeak=${vPeak}V, f=${freq}Hz`,
      given: `Vpeak = ${vPeak} V, Frequency f = ${freq} Hz`,
      formula: 'Vrms = Vpeak / √2 &nbsp;|&nbsp; Vpp = 2 × Vpeak &nbsp;|&nbsp; T = 1 / f &nbsp;|&nbsp; ω = 2πf',
      substitution: `Vrms = ${vPeak} / 1.4142 &nbsp;|&nbsp; Vpp = 2 × ${vPeak} &nbsp;|&nbsp; T = 1 / ${freq} &nbsp;|&nbsp; ω = 2π × ${freq}`,
      calculation: `Period T = ${(period * 1000).toFixed(2)} ms, Angular velocity ω = ${omega.toFixed(1)} rad/s`,
      answer: `Vrms = ${formatNumber(vRms, 'V')}`,
      additionalNotes: `Vpp = ${formatNumber(vPp, 'V')} &nbsp;|&nbsp; Period T = ${formatNumber(period, 's')} &nbsp;|&nbsp; ω = ${omega.toFixed(1)} rad/s`,
      answerRaw: `${vRms} V`
    });

    drawAcCanvas(vPeak, freq);
  };

  window.calcComplexImpedance = function () {
    const r = parseFloat(document.getElementById('imp-r')?.value) || 0;
    const xl = parseFloat(document.getElementById('imp-xl')?.value) || 0;
    const xc = parseFloat(document.getElementById('imp-xc')?.value) || 0;

    const xNet = xl - xc;
    const zMag = Math.sqrt(r * r + xNet * xNet);
    const thetaRad = Math.atan2(xNet, r);
    const thetaDeg = thetaRad * (180 / Math.PI);
    const pf = zMag > 0 ? r / zMag : 1;

    let nature = 'Purely Resistive (Unity PF)';
    if (xNet > 0.001) nature = 'Inductive (Current lags Voltage, Lagging PF)';
    else if (xNet < -0.001) nature = 'Capacitive (Current leads Voltage, Leading PF)';

    renderSolution('imp-solution', {
      calcName: 'Complex Impedance (Z = R + jX)',
      inputsSummary: `R=${r}Ω, XL=${xl}Ω, XC=${xc}Ω`,
      given: `Resistance R = ${r} Ω, Inductive XL = ${xl} Ω, Capacitive XC = ${xc} Ω`,
      formula: 'Z = R + j(XL - XC) &nbsp;|&nbsp; |Z| = √(R² + Xnet²) &nbsp;|&nbsp; θ = arctan(Xnet / R)',
      substitution: `Z = ${r} + j(${xl} - ${xc}) = ${r} + j(${xNet.toFixed(2)})`,
      calculation: `|Z| = √(${r}² + (${xNet.toFixed(2)})²) = ${zMag.toFixed(2)} Ω, Phase angle θ = ${thetaDeg.toFixed(2)}°`,
      answer: `|Z| = ${formatNumber(zMag, 'Ω')} ∠ ${thetaDeg.toFixed(1)}°`,
      additionalNotes: `Rectangular: (${r.toFixed(2)} + j${xNet.toFixed(2)}) Ω &nbsp;|&nbsp; Power Factor: ${pf.toFixed(3)} (${nature})`,
      answerRaw: `${zMag} Ω`
    });
  };

  window.calcPowerFactorCorrection = function () {
    const pKw = parseFloat(document.getElementById('pfc-p')?.value) || 0;
    const pf1 = parseFloat(document.getElementById('pfc-pf1')?.value) || 0.75;
    const pf2 = parseFloat(document.getElementById('pfc-pf2')?.value) || 0.95;
    const v = parseFloat(document.getElementById('pfc-v')?.value) || 400;
    const freq = parseFloat(document.getElementById('pfc-freq')?.value) || 50;
    const is3Phase = document.getElementById('pfc-phase')?.value === '3';

    if (pKw <= 0 || pf1 <= 0 || pf2 <= 0 || pf1 >= 1 || pf2 > 1) {
      renderSolution('pfc-solution', { error: 'Please enter valid positive values. Initial PF must be less than Target PF.' });
      return;
    }

    if (pf1 >= pf2) {
      renderSolution('pfc-solution', { error: 'Initial Power Factor is already at or above the target.' });
      return;
    }

    const phi1 = Math.acos(pf1);
    const phi2 = Math.acos(pf2);
    const qKvar = pKw * (Math.tan(phi1) - Math.tan(phi2));

    // Required Capacitance C
    let cFarads = 0;
    if (is3Phase) {
      // Delta connected bank: C per phase = Qc / (3 * 2 * pi * f * V^2)
      cFarads = (qKvar * 1000) / (3 * 2 * Math.PI * freq * v * v);
    } else {
      cFarads = (qKvar * 1000) / (2 * Math.PI * freq * v * v);
    }
    const cMicro = cFarads * 1e6;

    renderSolution('pfc-solution', {
      calcName: 'Power Factor Correction',
      inputsSummary: `P=${pKw}kW, PF1=${pf1}→${pf2}, V=${v}V, ${is3Phase ? '3-Phase' : '1-Phase'}`,
      given: `Active Power P = ${pKw} kW, Initial PF = ${pf1}, Target PF = ${pf2}, Supply Voltage V = ${v} V (${is3Phase ? '3-Phase Delta' : '1-Phase'})`,
      formula: 'Qc = P × (tan(φ1) - tan(φ2)) &nbsp;|&nbsp; C = Qc / (2πf × V²)',
      substitution: `Qc = ${pKw} kW × (tan(${((phi1 * 180) / Math.PI).toFixed(1)}°) - tan(${((phi2 * 180) / Math.PI).toFixed(1)}°))`,
      calculation: `tan(φ1) = ${Math.tan(phi1).toFixed(3)}, tan(φ2) = ${Math.tan(phi2).toFixed(3)}, Reactive power reduction Qc = ${qKvar.toFixed(2)} kVAR`,
      answer: `Required Capacitor Bank: ${formatNumber(qKvar, 'kVAR')}`,
      additionalNotes: `Capacitance per phase: ${formatNumber(cMicro, 'µF')} at ${freq} Hz (${is3Phase ? 'Delta connected' : 'Parallel'})`,
      answerRaw: `${qKvar.toFixed(2)} kVAR`
    });
  };

  // 4. THREE-PHASE POWER & LOAD
  window.calcThreePhasePower = function () {
    const vl = parseFloat(document.getElementById('tp-vl')?.value) || 415;
    const il = parseFloat(document.getElementById('tp-il')?.value) || 20;
    const pf = parseFloat(document.getElementById('tp-pf')?.value) || 0.85;

    if (vl <= 0 || il <= 0 || pf <= 0 || pf > 1) {
      renderSolution('tp-solution', { error: 'Line Voltage, Line Current and Power Factor (0 to 1) must be positive.' });
      return;
    }

    const sVa = Math.sqrt(3) * vl * il;
    const sKva = sVa / 1000;
    const pKw = sKva * pf;
    const qKvar = Math.sqrt(Math.max(0, sKva * sKva - pKw * pKw));

    renderSolution('tp-solution', {
      calcName: 'Three-Phase Balanced Power',
      inputsSummary: `VL=${vl}V, IL=${il}A, PF=${pf}`,
      given: `Line Voltage VL = ${vl} V, Line Current IL = ${il} A, Power Factor cos(φ) = ${pf}`,
      formula: 'Active: P = √3 × VL × IL × cos(φ) &nbsp;|&nbsp; Apparent: S = √3 × VL × IL &nbsp;|&nbsp; Reactive: Q = √3 × VL × IL × sin(φ)',
      substitution: `P = 1.732 × ${vl} × ${il} × ${pf} &nbsp;|&nbsp; S = 1.732 × ${vl} × ${il}`,
      calculation: `Apparent Power S = ${sKva.toFixed(2)} kVA, Real Power P = ${pKw.toFixed(2)} kW, Reactive Q = ${qKvar.toFixed(2)} kVAR`,
      answer: `P = ${formatNumber(pKw, 'kW')}`,
      additionalNotes: `Apparent Power S = ${formatNumber(sKva, 'kVA')} &nbsp;|&nbsp; Reactive Power Q = ${formatNumber(qKvar, 'kVAR')}`,
      answerRaw: `${pKw} kW`
    });
  };

  // 5. TRANSFORMER SIZING & SHORT-CIRCUIT
  window.calcTransformerSizing = function () {
    const kva = parseFloat(document.getElementById('tx2-kva')?.value) || 500;
    const v1 = parseFloat(document.getElementById('tx2-v1')?.value) || 11000;
    const v2 = parseFloat(document.getElementById('tx2-v2')?.value) || 415;
    const zPct = parseFloat(document.getElementById('tx2-z')?.value) || 4.75;
    const is3Phase = document.getElementById('tx2-phase')?.value === '3';

    if (kva <= 0 || v1 <= 0 || v2 <= 0 || zPct <= 0) {
      renderSolution('tx2-solution', { error: 'Please enter valid positive values for transformer rating and voltages.' });
      return;
    }

    const sVa = kva * 1000;
    let i1 = 0;
    let i2 = 0;

    if (is3Phase) {
      i1 = sVa / (Math.sqrt(3) * v1);
      i2 = sVa / (Math.sqrt(3) * v2);
    } else {
      i1 = sVa / v1;
      i2 = sVa / v2;
    }

    const iscAmps = i2 / (zPct / 100);
    const iscKa = iscAmps / 1000;
    const faultMva = (kva / 1000) / (zPct / 100);
    const turnsRatio = v1 / v2;

    renderSolution('tx2-solution', {
      calcName: 'Transformer Sizing & Prospective Fault',
      inputsSummary: `${kva} kVA, ${v1}V/${v2}V, %Z=${zPct}%, ${is3Phase ? '3-Phase' : '1-Phase'}`,
      given: `Rating S = ${kva} kVA, Primary V1 = ${v1} V, Secondary V2 = ${v2} V, Impedance %Z = ${zPct}%`,
      formula: 'Full Load Current I = S / (√3 × V) &nbsp;|&nbsp; Fault Current Isc = I2 / (%Z / 100) &nbsp;|&nbsp; Turns Ratio a = V1 / V2',
      substitution: `I2 = ${kva * 1000} / (1.732 × ${v2}) = ${i2.toFixed(1)} A &nbsp;|&nbsp; Isc = ${i2.toFixed(1)} / (${zPct} / 100)`,
      calculation: `Primary FLA I1 = ${i1.toFixed(2)} A, Secondary FLA I2 = ${i2.toFixed(1)} A, Turns ratio a = ${turnsRatio.toFixed(2)}:1`,
      answer: `Secondary FLA: ${formatNumber(i2, 'A')} &nbsp;|&nbsp; Short Circuit Isc: ${formatNumber(iscKa, 'kA')}`,
      additionalNotes: `Prospective Fault Level: ${faultMva.toFixed(2)} MVA &nbsp;|&nbsp; Recommended Secondary Breaker Breaking Capacity: ≥ ${Math.ceil(iscKa * 1.2)} kA`,
      answerRaw: `${i2.toFixed(1)} A FLA, ${iscKa.toFixed(2)} kA Fault`
    });
  };

  // 6. CABLE VOLTAGE DROP & CONDUIT SIZER
  window.calcCableVoltageDrop = function () {
    const vNom = parseFloat(document.getElementById('cbl-v')?.value) || 230;
    const current = parseFloat(document.getElementById('cbl-i')?.value) || 20;
    const length = parseFloat(document.getElementById('cbl-l')?.value) || 40;
    const size = parseFloat(document.getElementById('cbl-size')?.value) || 2.5;
    const mat = document.getElementById('cbl-mat')?.value || 'copper';
    const is3Phase = document.getElementById('cbl-phase')?.value === '3';
    const maxDropPct = parseFloat(document.getElementById('cbl-limit')?.value) || 4;

    if (vNom <= 0 || current <= 0 || length <= 0 || size <= 0) {
      renderSolution('cbl-solution', { error: 'Please enter valid positive numbers for electrical run parameters.' });
      return;
    }

    const rho = mat === 'copper' ? 0.0175 : 0.0282; // ohm*mm^2/m at 20C
    const rConductor = (rho * length) / size;
    const rLoop = is3Phase ? Math.sqrt(3) * rConductor : 2 * rConductor;

    const vDrop = current * rLoop;
    const pctDrop = (vDrop / vNom) * 100;
    const vLoad = Math.max(0, vNom - vDrop);
    const pLossWatts = is3Phase ? 3 * current * current * rConductor : current * current * rLoop;

    const isCompliant = pctDrop <= maxDropPct;

    // Minimum size recommendation
    const standardSizes = [1.5, 2.5, 4.0, 6.0, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const maxDropVolts = (maxDropPct / 100) * vNom;
    const factor = is3Phase ? Math.sqrt(3) : 2;
    const minArea = (factor * rho * length * current) / maxDropVolts;
    const recSize = standardSizes.find(s => s >= minArea) || Math.ceil(minArea);

    renderSolution('cbl-solution', {
      calcName: 'Cable Voltage Drop & Conductor Sizer',
      inputsSummary: `${size}mm² ${mat.toUpperCase()}, ${current}A, ${length}m, ${is3Phase ? '3-Phase' : '1-Phase'}`,
      given: `Supply V = ${vNom} V, Current I = ${current} A, Length L = ${length} m, Conductor = ${size} mm² ${mat.toUpperCase()}, Allowable Limit = ${maxDropPct}%`,
      formula: is3Phase ? 'ΔV = √3 × I × L × (ρ / A)' : 'ΔV = 2 × I × L × (ρ / A) &nbsp;|&nbsp; %VD = (ΔV / Vnom) × 100',
      substitution: `ΔV = ${factor.toFixed(3)} × ${current} A × ${length} m × (${rho} / ${size})`,
      calculation: `Voltage drop ΔV = ${vDrop.toFixed(2)} V (${pctDrop.toFixed(2)}%), Load terminal voltage = ${vLoad.toFixed(2)} V, Cable loss = ${pLossWatts.toFixed(1)} W`,
      answer: `Voltage Drop = ${vDrop.toFixed(2)} V (${pctDrop.toFixed(2)}%)`,
      additionalNotes: `Status: ${isCompliant ? '✅ COMPLIANT' : '⚠️ EXCEEDS LIMIT'}. Recommended minimum cross-section for ≤ ${maxDropPct}% drop: ${recSize} mm²`,
      answerRaw: `${vDrop.toFixed(2)} V (${pctDrop.toFixed(2)}%)`
    });
  };

  // 7. INSTALLATION LOAD SCHEDULE & BREAKER SIZING
  window.calcInstallationLoad = function () {
    const diversity = parseFloat(document.getElementById('inst-diversity')?.value) || 0.8;
    const pf = parseFloat(document.getElementById('inst-pf')?.value) || 0.85;
    const vSupply = parseFloat(document.getElementById('inst-v')?.value) || 230;

    let totalWatts = 0;
    let dailyKwh = 0;

    CalcState.loadItems.forEach(item => {
      const rowWatts = item.qty * item.watts;
      totalWatts += rowWatts;
      dailyKwh += (rowWatts * item.hours) / 1000;
    });

    const maxDemandKw = (totalWatts * diversity) / 1000;
    const monthlyKwh = dailyKwh * 30;
    const designCurrent = (maxDemandKw * 1000) / (vSupply * pf);

    // Standard MCB selection
    const mcbRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    const recMcb = mcbRatings.find(r => r >= designCurrent * 1.25) || Math.ceil(designCurrent * 1.25);
    const recGenKva = (maxDemandKw / pf) * 1.25;

    renderSolution('inst-solution', {
      calcName: 'Electrical Installation Load Schedule',
      inputsSummary: `Connected=${(totalWatts / 1000).toFixed(2)}kW, Diversity=${diversity}, V=${vSupply}V`,
      given: `Total Connected Load = ${(totalWatts / 1000).toFixed(2)} kW, Diversity Factor = ${diversity}, Supply = ${vSupply} V, PF = ${pf}`,
      formula: 'Max Demand = Connected kW × Diversity &nbsp;|&nbsp; Design Current Ib = P / (V × PF) &nbsp;|&nbsp; Daily kWh = Σ(kW × hours)',
      substitution: `Max Demand = ${(totalWatts / 1000).toFixed(2)} kW × ${diversity} = ${maxDemandKw.toFixed(2)} kW`,
      calculation: `Design Current Ib = ${(maxDemandKw * 1000).toFixed(0)} W / (${vSupply} V × ${pf}) = ${designCurrent.toFixed(1)} A`,
      answer: `Max Demand: ${maxDemandKw.toFixed(2)} kW (${designCurrent.toFixed(1)} A)`,
      additionalNotes: `Daily Consumption: ${dailyKwh.toFixed(1)} kWh/day (${monthlyKwh.toFixed(0)} kWh/month) &nbsp;|&nbsp; Recommended Main MCB: ${recMcb} A &nbsp;|&nbsp; Standby Generator: ≥ ${recGenKva.toFixed(1)} kVA`,
      answerRaw: `${maxDemandKw.toFixed(2)} kW`
    });
  };

  window.addLoadItemRow = function () {
    CalcState.loadItems.push({ name: 'New Appliance', qty: 1, watts: 500, hours: 4 });
    renderLoadScheduleTable();
    calcInstallationLoad();
  };

  window.removeLoadItemRow = function (index) {
    if (CalcState.loadItems.length <= 1) return;
    CalcState.loadItems.splice(index, 1);
    renderLoadScheduleTable();
    calcInstallationLoad();
  };

  function renderLoadScheduleTable() {
    const tbody = document.getElementById('load-schedule-tbody');
    if (!tbody) return;

    tbody.innerHTML = CalcState.loadItems.map((item, idx) => `
      <tr>
        <td><input type="text" value="${item.name}" onchange="updateLoadItem(${idx}, 'name', this.value)"></td>
        <td><input type="number" min="1" value="${item.qty}" style="width: 50px;" onchange="updateLoadItem(${idx}, 'qty', this.value)"></td>
        <td><input type="number" min="1" value="${item.watts}" style="width: 80px;" onchange="updateLoadItem(${idx}, 'watts', this.value)"></td>
        <td><input type="number" min="0.5" max="24" step="0.5" value="${item.hours}" style="width: 60px;" onchange="updateLoadItem(${idx}, 'hours', this.value)"></td>
        <td style="font-family: var(--font-mono); font-weight: 600;">${((item.qty * item.watts) / 1000).toFixed(2)} kW</td>
        <td>
          <button class="btn btn-sm btn-ghost" style="color: var(--accent-rose); padding: 2px 6px;" onclick="removeLoadItemRow(${idx})" title="Remove item">✕</button>
        </td>
      </tr>
    `).join('');
  }

  window.updateLoadItem = function (idx, prop, val) {
    if (prop === 'name') CalcState.loadItems[idx].name = val;
    else CalcState.loadItems[idx][prop] = parseFloat(val) || 0;
    renderLoadScheduleTable();
    calcInstallationLoad();
  };

  // 8. BATTERY RUNTIME & BANK SIZER
  window.calcBatteryStorage = function () {
    const vBat = parseFloat(document.getElementById('bat-v')?.value) || 12;
    const ah = parseFloat(document.getElementById('bat-ah')?.value) || 100;
    const loadW = parseFloat(document.getElementById('bat-load')?.value) || 150;
    const dod = (parseFloat(document.getElementById('bat-dod')?.value) || 80) / 100;
    const eff = (parseFloat(document.getElementById('bat-eff')?.value) || 90) / 100;

    if (vBat <= 0 || ah <= 0 || loadW <= 0) {
      renderSolution('bat-solution', { error: 'Battery voltage, Ah capacity, and load power must be positive.' });
      return;
    }

    const totalWh = vBat * ah;
    const usableWh = totalWh * dod * eff;
    const runtimeHours = usableWh / loadW;

    renderSolution('bat-solution', {
      calcName: 'Battery Runtime & Energy Storage',
      inputsSummary: `${vBat}V ${ah}Ah, Load=${loadW}W, DoD=${dod * 100}%`,
      given: `Battery Voltage = ${vBat} V, Capacity = ${ah} Ah, Load = ${loadW} W, Depth of Discharge = ${(dod * 100)}%, System Efficiency = ${(eff * 100)}%`,
      formula: 'Energy = V × Ah &nbsp;|&nbsp; Usable Energy = V × Ah × DoD × η &nbsp;|&nbsp; Runtime = Usable Energy / Load Power',
      substitution: `Usable Wh = ${vBat} V × ${ah} Ah × ${dod} × ${eff} = ${usableWh.toFixed(1)} Wh &nbsp;|&nbsp; Runtime = ${usableWh.toFixed(1)} / ${loadW} W`,
      calculation: `Total Energy Capacity = ${(totalWh / 1000).toFixed(2)} kWh (${totalWh} Wh), Usable Energy = ${(usableWh / 1000).toFixed(2)} kWh`,
      answer: `Estimated Runtime: ${runtimeHours.toFixed(1)} Hours (${(runtimeHours * 60).toFixed(0)} min)`,
      additionalNotes: `Total Battery Energy: ${(totalWh / 1000).toFixed(2)} kWh &nbsp;|&nbsp; Usable Energy (at ${dod * 100}% DoD): ${(usableWh / 1000).toFixed(2)} kWh`,
      answerRaw: `${runtimeHours.toFixed(1)} Hours`
    });
  };

  // 9. COMPLETE SOLAR PV SIZING
  window.calcSolarSystem = function () {
    const dailyKwh = parseFloat(document.getElementById('sol-daily')?.value) || 12;
    const sunHours = parseFloat(document.getElementById('sol-sun')?.value) || 5;
    const panelWatts = parseFloat(document.getElementById('sol-panel')?.value) || 450;
    const autonomyDays = parseFloat(document.getElementById('sol-autonomy')?.value) || 1.5;
    const sysVolt = parseFloat(document.getElementById('sol-sysv')?.value) || 48;

    if (dailyKwh <= 0 || sunHours <= 0 || panelWatts <= 0) {
      renderSolution('sol-solution', { error: 'Please enter valid positive values for solar sizing requirements.' });
      return;
    }

    const sysLossFactor = 1.3; // 30% system losses (inverter, wiring, dust)
    const reqArrayWatts = (dailyKwh * 1000 * sysLossFactor) / sunHours;
    const numPanels = Math.ceil(reqArrayWatts / panelWatts);
    const totalArrayKwp = (numPanels * panelWatts) / 1000;

    // Battery Bank Sizing (Lead-Acid / LiFePO4: 80% DoD)
    const reqBatteryKwh = (dailyKwh * autonomyDays) / (0.8 * 0.9);
    const reqBatteryAh = (reqBatteryKwh * 1000) / sysVolt;

    // Charge controller MPPT sizing
    const mpptAmps = Math.ceil((totalArrayKwp * 1000) / sysVolt * 1.25);
    const inverterRatingKw = Math.ceil(totalArrayKwp * 1.15);

    renderSolution('sol-solution', {
      calcName: 'Solar PV Sizing Suite',
      inputsSummary: `${dailyKwh} kWh/day, ${sunHours} PSH, ${panelWatts}W Panels, ${sysVolt}V System`,
      given: `Daily Consumption = ${dailyKwh} kWh/day, Peak Sun Hours (PSH) = ${sunHours} hrs, Panel Rating = ${panelWatts} W, Autonomy = ${autonomyDays} days, System = ${sysVolt} V`,
      formula: 'Panels = (Daily kWh × 1000 × 1.3) / (PSH × Panel Watts) &nbsp;|&nbsp; Battery Ah = (Daily kWh × Days) / (DoD × η × Vsys)',
      substitution: `Array Watts = (${dailyKwh} × 1000 × 1.3) / ${sunHours} = ${reqArrayWatts.toFixed(0)} W &nbsp;|&nbsp; Panels = ${reqArrayWatts.toFixed(0)} / ${panelWatts}`,
      calculation: `Total Array = ${numPanels} panels × ${panelWatts} W = ${totalArrayKwp.toFixed(2)} kWp. Battery requirement = ${(reqBatteryKwh).toFixed(1)} kWh (${reqBatteryAh.toFixed(0)} Ah at ${sysVolt}V).`,
      answer: `Required Solar Panels: ${numPanels} × ${panelWatts}W (${totalArrayKwp.toFixed(2)} kWp)`,
      additionalNotes: `Recommended Inverter: ≥ ${inverterRatingKw} kW &nbsp;|&nbsp; Battery Bank: ≥ ${reqBatteryAh.toFixed(0)} Ah (${sysVolt}V) &nbsp;|&nbsp; MPPT Controller: ≥ ${mpptAmps} A`,
      answerRaw: `${numPanels} Panels (${totalArrayKwp.toFixed(2)} kWp)`
    });
  };

  // 10. ELECTRONICS & OP-AMP
  window.calcLedResistor = function () {
    const vs = parseFloat(document.getElementById('led-vs')?.value) || 12;
    const vf = parseFloat(document.getElementById('led-vf')?.value) || 2.2;
    const ifMa = parseFloat(document.getElementById('led-if')?.value) || 20;

    if (vs <= vf || ifMa <= 0) {
      renderSolution('led-solution', { error: 'Supply voltage Vs must be greater than LED forward drop Vf.' });
      return;
    }

    const ifAmps = ifMa / 1000;
    const r = (vs - vf) / ifAmps;
    const pWatts = ifAmps * ifAmps * r;

    // Nearest standard E12/E24 resistor
    const standardResistors = [100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820, 1000, 1200, 1500, 2200, 3300, 4700, 10000];
    const recR = standardResistors.find(val => val >= r) || Math.ceil(r);

    renderSolution('led-solution', {
      calcName: 'LED Current Limiting Resistor',
      inputsSummary: `Vs=${vs}V, Vf=${vf}V, If=${ifMa}mA`,
      given: `Supply Voltage Vs = ${vs} V, Forward Voltage Vf = ${vf} V, LED Current If = ${ifMa} mA (${ifAmps} A)`,
      formula: 'R = (Vs - Vf) / If &nbsp;|&nbsp; Resistor Power P = If² × R',
      substitution: `R = (${vs} - ${vf}) / ${ifAmps} &nbsp;|&nbsp; P = (${ifAmps})² × ${r.toFixed(1)}`,
      calculation: `Exact Resistance R = ${r.toFixed(1)} Ω, Dissipated Power P = ${(pWatts * 1000).toFixed(1)} mW`,
      answer: `R = ${r.toFixed(1)} Ω (Standard: ${recR} Ω)`,
      additionalNotes: `Recommended Resistor Power Rating: ≥ ${(pWatts >= 0.2 ? '0.5 W' : '0.25 W (1/4 W)')}`,
      answerRaw: `${r.toFixed(1)} Ω`
    });
  };

  window.calcOpAmp = function () {
    const type = document.getElementById('opamp-type')?.value || 'inverting';
    const vin = parseFloat(document.getElementById('opamp-vin')?.value) || 1.0;
    const rin = parseFloat(document.getElementById('opamp-rin')?.value) || 10;
    const rf = parseFloat(document.getElementById('opamp-rf')?.value) || 100;

    if (rin <= 0 || rf <= 0) {
      renderSolution('opamp-solution', { error: 'Rin and Rf resistors must be positive values.' });
      return;
    }

    let gain = 0;
    let vout = 0;
    let formula = '';
    let subst = '';

    if (type === 'inverting') {
      gain = -(rf / rin);
      vout = gain * vin;
      formula = 'Gain Av = -Rf / Rin &nbsp;|&nbsp; Vout = Av × Vin';
      subst = `Av = -${rf} / ${rin} = ${gain.toFixed(2)} &nbsp;|&nbsp; Vout = ${gain.toFixed(2)} × ${vin} V`;
    } else if (type === 'non-inverting') {
      gain = 1 + (rf / rin);
      vout = gain * vin;
      formula = 'Gain Av = 1 + (Rf / Rin) &nbsp;|&nbsp; Vout = Av × Vin';
      subst = `Av = 1 + (${rf} / ${rin}) = ${gain.toFixed(2)} &nbsp;|&nbsp; Vout = ${gain.toFixed(2)} × ${vin} V`;
    } else {
      // Voltage Follower
      gain = 1.0;
      vout = vin;
      formula = 'Buffer Gain Av = 1.0 &nbsp;|&nbsp; Vout = Vin';
      subst = `Vout = ${vin} V (Unity Gain Buffer)`;
    }

    renderSolution('opamp-solution', {
      calcName: `Op-Amp (${type.toUpperCase()})`,
      inputsSummary: `${type}, Vin=${vin}V, Rin=${rin}kΩ, Rf=${rf}kΩ`,
      given: `Configuration = ${type.toUpperCase()}, Vin = ${vin} V, Input Rin = ${rin} kΩ, Feedback Rf = ${rf} kΩ`,
      formula: formula,
      substitution: subst,
      calculation: `Voltage Gain Av = ${gain.toFixed(2)} (${(20 * Math.log10(Math.abs(gain) || 1)).toFixed(1)} dB)`,
      answer: `Vout = ${formatNumber(vout, 'V')} (Gain Av = ${gain.toFixed(2)})`,
      additionalNotes: `Gain in Decibels: ${(20 * Math.log10(Math.abs(gain) || 1)).toFixed(2)} dB &nbsp;|&nbsp; Input Impedance Zin ≈ ${type === 'inverting' ? rin + ' kΩ' : 'Very High (10¹² Ω)'}`,
      answerRaw: `${vout} V`
    });
  };

  // 11. DIGITAL ELECTRONICS
  window.convertNumberSystem = function (source) {
    const decInput = document.getElementById('num-dec');
    const binInput = document.getElementById('num-bin');
    const hexInput = document.getElementById('num-hex');
    const octInput = document.getElementById('num-oct');

    let num = 0;

    try {
      if (source === 'dec') {
        num = parseInt(decInput.value, 10);
      } else if (source === 'bin') {
        num = parseInt(binInput.value.replace(/\s+/g, ''), 2);
      } else if (source === 'hex') {
        num = parseInt(hexInput.value.replace(/^0x/i, ''), 16);
      } else if (source === 'oct') {
        num = parseInt(octInput.value, 8);
      }

      if (isNaN(num)) return;

      if (source !== 'dec' && decInput) decInput.value = num.toString(10);
      if (source !== 'bin' && binInput) binInput.value = num.toString(2);
      if (source !== 'hex' && hexInput) hexInput.value = num.toString(16).toUpperCase();
      if (source !== 'oct' && octInput) octInput.value = num.toString(8);

      const bits = num.toString(2).padStart(8, '0');
      const sol = document.getElementById('num-solution');
      if (sol) {
        sol.innerHTML = `
          <div class="eng-solution-box" style="margin-top: 10px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Binary Byte Representation:</div>
            <div style="font-family: var(--font-mono); font-size: 16px; color: var(--accent-cyan); letter-spacing: 2px;">${bits}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Decimal: ${num} &nbsp;|&nbsp; Hexadecimal: 0x${num.toString(16).toUpperCase()} &nbsp;|&nbsp; Octal: ${num.toString(8)}</div>
          </div>
        `;
      }
    } catch (e) {
      console.warn('Conversion error', e);
    }
  };

  window.evaluateLogicGates = function () {
    const a = parseInt(document.getElementById('gate-in-a')?.value) || 0;
    const b = parseInt(document.getElementById('gate-in-b')?.value) || 0;

    const resAnd = a & b;
    const resOr = a | b;
    const resNotA = a ? 0 : 1;
    const resNand = (a & b) ? 0 : 1;
    const resNor = (a | b) ? 0 : 1;
    const resXor = a ^ b;
    const resXnor = (a ^ b) ? 0 : 1;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('gate-out-and', resAnd);
    setTxt('gate-out-or', resOr);
    setTxt('gate-out-not', resNotA);
    setTxt('gate-out-nand', resNand);
    setTxt('gate-out-nor', resNor);
    setTxt('gate-out-xor', resXor);
    setTxt('gate-out-xnor', resXnor);
  };

  // 12. INDUSTRIAL AUTOMATION & SENSORS
  window.calcSensorScaling = function () {
    const mode = document.getElementById('sens-mode')?.value || 'i_to_pv';
    const pvMin = parseFloat(document.getElementById('sens-pvmin')?.value) || 0;
    const pvMax = parseFloat(document.getElementById('sens-pvmax')?.value) || 100;
    const iMa = parseFloat(document.getElementById('sens-i')?.value) || 12;
    const pvVal = parseFloat(document.getElementById('sens-pv')?.value) || 50;

    if (pvMax <= pvMin) {
      renderSolution('sens-solution', { error: 'PV Max must be strictly greater than PV Min.' });
      return;
    }

    if (mode === 'i_to_pv') {
      const pv = pvMin + ((iMa - 4) / 16) * (pvMax - pvMin);
      const pct = ((iMa - 4) / 16) * 100;
      renderSolution('sens-solution', {
        calcName: '4–20 mA Current Loop Scaling',
        inputsSummary: `I=${iMa}mA, Range=[${pvMin} to ${pvMax}]`,
        given: `Current Loop I = ${iMa} mA, Process Variable Range = [${pvMin} to ${pvMax}]`,
        formula: 'PV = PVmin + ((I - 4) / 16) × (PVmax - PVmin)',
        substitution: `PV = ${pvMin} + ((${iMa} - 4) / 16) × (${pvMax} - ${pvMin})`,
        calculation: `Signal span percentage = ${pct.toFixed(1)}% of 4-20 mA range`,
        answer: `Scaled Process Value: ${pv.toFixed(2)} (${pct.toFixed(1)}%)`,
        additionalNotes: `Sensor Signal Health: ${iMa < 3.8 ? '⚠️ UNDER-RANGE / WIRE BREAK' : (iMa > 20.5 ? '⚠️ OVER-RANGE' : '✅ NORMAL')}`,
        answerRaw: `${pv.toFixed(2)}`
      });
      const elSensPv = document.getElementById('sens-pv');
      if (elSensPv) elSensPv.value = pv.toFixed(2);
    } else {
      const iOut = 4 + 16 * ((pvVal - pvMin) / (pvMax - pvMin));
      const pct = ((pvVal - pvMin) / (pvMax - pvMin)) * 100;
      renderSolution('sens-solution', {
        calcName: 'Process Variable to 4–20 mA Loop',
        inputsSummary: `PV=${pvVal}, Range=[${pvMin} to ${pvMax}]`,
        given: `Process Variable PV = ${pvVal}, Range = [${pvMin} to ${pvMax}]`,
        formula: 'I = 4 + 16 × ((PV - PVmin) / (PVmax - PVmin))',
        substitution: `I = 4 + 16 × ((${pvVal} - ${pvMin}) / (${pvMax} - ${pvMin}))`,
        calculation: `Process value span percentage = ${pct.toFixed(1)}%`,
        answer: `Loop Current: ${iOut.toFixed(2)} mA`,
        additionalNotes: `Signal span = ${pct.toFixed(1)}% &nbsp;|&nbsp; Expected ADC Reading (0-4095 12-bit): ${Math.round(pct * 40.95)}`,
        answerRaw: `${iOut.toFixed(2)} mA`
      });
      const elSensI = document.getElementById('sens-i');
      if (elSensI) elSensI.value = iOut.toFixed(2);
    }
  };

  /* ==========================================================================
     CANVAS GRAPHING ENGINES
     ========================================================================== */
  function drawRcCanvas(v0, tau) {
    const canvas = document.getElementById('rc-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 240;

    ctx.clearRect(0, 0, w, h);

    // Padding
    const padL = 50;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid lines
    ctx.strokeStyle = '#1e2d4d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (i / 5) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}τ`, x, h - padB + 16);
    }

    // Axes
    ctx.strokeStyle = '#2a3e68';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    // Curve 1: Charging Vc(t) = V0(1 - e^-t/tau)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const tNorm = (px / plotW) * 5; // 0 to 5 tau
      const vNorm = 1 - Math.exp(-tNorm);
      const py = (h - padB) - vNorm * plotH;
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();

    // Curve 2: Discharging Vc(t) = V0(e^-t/tau)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const tNorm = (px / plotW) * 5;
      const vNorm = Math.exp(-tNorm);
      const py = (h - padB) - vNorm * plotH;
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('— Charging Vc(t)', padL + 70, padT + 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('-- Discharging Vc(t)', padL + 180, padT + 12);
  }

  function drawAcCanvas(vPeak, freq) {
    const canvas = document.getElementById('ac-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 240;

    ctx.clearRect(0, 0, w, h);

    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const centerY = padT + plotH / 2;

    // Center baseline
    ctx.strokeStyle = '#2a3e68';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, centerY);
    ctx.lineTo(w - padR, centerY);
    ctx.stroke();

    // Voltage Sine wave (2 full cycles)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const cycles = 2;
    for (let px = 0; px <= plotW; px++) {
      const phase = (px / plotW) * (cycles * 2 * Math.PI);
      const y = centerY - Math.sin(phase) * (plotH * 0.42);
      if (px === 0) ctx.moveTo(padL + px, y);
      else ctx.lineTo(padL + px, y);
    }
    ctx.stroke();

    // Current wave lagging by 36 degrees
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    const lagRad = 36 * (Math.PI / 180);
    for (let px = 0; px <= plotW; px++) {
      const phase = (px / plotW) * (cycles * 2 * Math.PI) - lagRad;
      const y = centerY - Math.sin(phase) * (plotH * 0.32);
      if (px === 0) ctx.moveTo(padL + px, y);
      else ctx.lineTo(padL + px, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = '#06b6d4';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`+Vpeak (+${vPeak}V)`, padL + 6, padT + 12);
    ctx.fillText(`-Vpeak (-${vPeak}V)`, padL + 6, h - padB - 4);
  }

  function drawRlcCanvas() {
    const canvas = document.getElementById('rlc-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 240;

    ctx.clearRect(0, 0, w, h);

    const padL = 50;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Draw resonance curve Z(f)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const f0Px = padL + plotW * 0.5;

    for (let px = 0; px <= plotW; px++) {
      const xRel = (px - plotW * 0.5) / (plotW * 0.2);
      const zNorm = 0.2 + (xRel * xRel) / (1 + xRel * xRel) * 0.75;
      const py = padT + zNorm * plotH;
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();

    // Mark f0
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(f0Px, padT);
    ctx.lineTo(f0Px, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('f0 (Resonance: Z = R min)', f0Px, padT + 15);
  }

  function drawMotorTorqueCanvas() {
    const canvas = document.getElementById('motor-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 240;

    ctx.clearRect(0, 0, w, h);

    const padL = 50;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Torque curve
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let px = 0; px <= plotW; px++) {
      const s = 1 - (px / plotW); // slip from 1 (standstill) to 0 (sync speed)
      const tNorm = (2 * s * 0.2) / (s * s + 0.2 * 0.2); // Kloss equation shape
      const py = (h - padB) - (tNorm * plotH * 0.45);
      if (px === 0) ctx.moveTo(padL + px, py);
      else ctx.lineTo(padL + px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Standstill (s=1.0)', padL + 40, h - padB + 16);
    ctx.fillText('Full Load Operating Point', padL + plotW * 0.75, h - padB + 16);
    ctx.fillText('Sync Speed Ns (s=0)', w - padR - 40, h - padB + 16);

    ctx.fillStyle = '#06b6d4';
    ctx.fillText('Breakdown Torque (Tmax)', padL + plotW * 0.35, padT + 25);
  }

  window.drawRcCanvas = drawRcCanvas;
  window.drawAcCanvas = drawAcCanvas;
  window.drawRlcCanvas = drawRlcCanvas;
  window.drawMotorTorqueCanvas = drawMotorTorqueCanvas;

  /* ==========================================================================
     ENGINEER MODE: COMPLEX NUMBERS & PHASOR ENGINE
     ========================================================================== */
  window.convertRectToPolar = function () {
    const real = parseFloat(document.getElementById('cplx-r-real')?.value) || 0;
    const imag = parseFloat(document.getElementById('cplx-r-imag')?.value) || 0;

    const mag = Math.sqrt(real * real + imag * imag);
    const angleRad = Math.atan2(imag, real);
    const angleDeg = angleRad * (180 / Math.PI);

    const elMag = document.getElementById('cplx-p-mag');
    const elAng = document.getElementById('cplx-p-ang');
    if (elMag) elMag.value = mag.toFixed(3);
    if (elAng) elAng.value = angleDeg.toFixed(2);

    const out = document.getElementById('cplx-res-box');
    if (out) {
      out.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 15px; color: var(--accent-cyan);">
          ${mag.toFixed(3)} ∠ ${angleDeg.toFixed(2)}°
        </div>
      `;
    }
  };

  window.convertPolarToRect = function () {
    const mag = parseFloat(document.getElementById('cplx-p-mag')?.value) || 0;
    const angleDeg = parseFloat(document.getElementById('cplx-p-ang')?.value) || 0;

    const angleRad = angleDeg * (Math.PI / 180);
    const real = mag * Math.cos(angleRad);
    const imag = mag * Math.sin(angleRad);

    const elReal = document.getElementById('cplx-r-real');
    const elImag = document.getElementById('cplx-r-imag');
    if (elReal) elReal.value = real.toFixed(3);
    if (elImag) elImag.value = imag.toFixed(3);

    const out = document.getElementById('cplx-res-box');
    if (out) {
      out.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 15px; color: var(--accent-cyan);">
          ${real.toFixed(3)} + j(${imag.toFixed(3)})
        </div>
      `;
    }
  };

  window.solve2x2Mesh = function () {
    // a1*x + b1*y = c1
    // a2*x + b2*y = c2
    const a1 = parseFloat(document.getElementById('eq-a1')?.value) || 0;
    const b1 = parseFloat(document.getElementById('eq-b1')?.value) || 0;
    const c1 = parseFloat(document.getElementById('eq-c1')?.value) || 0;
    const a2 = parseFloat(document.getElementById('eq-a2')?.value) || 0;
    const b2 = parseFloat(document.getElementById('eq-b2')?.value) || 0;
    const c2 = parseFloat(document.getElementById('eq-c2')?.value) || 0;

    const det = a1 * b2 - a2 * b1;
    const solBox = document.getElementById('eq-sol-box');
    if (Math.abs(det) < 1e-12) {
      if (solBox) solBox.innerHTML = '<span style="color: var(--accent-rose);">Singular matrix: Determinant = 0 (No unique solution)</span>';
      return;
    }

    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;

    if (solBox) {
      solBox.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 14px; color: var(--accent-emerald);">
          Mesh Current I1 = ${x.toFixed(4)} A &nbsp;|&nbsp; Mesh Current I2 = ${y.toFixed(4)} A &nbsp;(Det Δ = ${det.toFixed(2)})
        </div>
      `;
    }
  };

  /* ==========================================================================
     GUIDED WIZARD: "WHAT DO I NEED TO CALCULATE?"
     ========================================================================== */
  window.startWizard = function (wizType) {
    CalcState.activeWizard = wizType;
    document.querySelectorAll('.wizard-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-wiz') === wizType);
    });

    const body = document.getElementById('wizard-body');
    if (!body) return;

    if (wizType === 'cable') {
      body.innerHTML = `
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Step 1: Define Supply & Electrical Load</h4>
        <div class="eng-input-grid">
          <div class="eng-input-group">
            <label class="eng-input-label">Nominal Voltage (V)</label>
            <input type="number" id="wiz-cbl-v" class="eng-input-field" value="230">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Supply Type</label>
            <select id="wiz-cbl-phase" class="eng-unit-select" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px;">
              <option value="1">Single Phase (1Φ 230V)</option>
              <option value="3">Three Phase (3Φ 400V)</option>
            </select>
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Design Load Current (A)</label>
            <input type="number" id="wiz-cbl-i" class="eng-input-field" value="25">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">One-Way Run Length (m)</label>
            <input type="number" id="wiz-cbl-len" class="eng-input-field" value="50">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Max Allowable Drop (%)</label>
            <select id="wiz-cbl-drop" class="eng-unit-select" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px;">
              <option value="3">3% (BS 7671 Lighting Circuit)</option>
              <option value="5" selected>5% (BS 7671 General Power)</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top: 14px;" onclick="solveWizardCable()">Compute Recommended Cable Size →</button>
        <div id="wiz-result-box" style="margin-top: 14px;"></div>
      `;
    } else if (wizType === 'solar') {
      body.innerHTML = `
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Step 1: Daily Consumption & Location</h4>
        <div class="eng-input-grid">
          <div class="eng-input-group">
            <label class="eng-input-label">Daily Consumption (kWh/day)</label>
            <input type="number" id="wiz-sol-kwh" class="eng-input-field" value="10">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Average Sun Hours (PSH)</label>
            <input type="number" id="wiz-sol-psh" class="eng-input-field" value="5.2">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Panel Rating (Watts)</label>
            <input type="number" id="wiz-sol-w" class="eng-input-field" value="450">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Autonomy Days</label>
            <input type="number" id="wiz-sol-days" class="eng-input-field" value="2">
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top: 14px;" onclick="solveWizardSolar()">Size Complete Solar PV Array →</button>
        <div id="wiz-result-box" style="margin-top: 14px;"></div>
      `;
    } else if (wizType === 'motor') {
      body.innerHTML = `
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">Step 1: Motor Rating & Starter</h4>
        <div class="eng-input-grid">
          <div class="eng-input-group">
            <label class="eng-input-label">Motor Output Power (kW)</label>
            <input type="number" id="wiz-mot-kw" class="eng-input-field" value="7.5">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Line Voltage (V)</label>
            <input type="number" id="wiz-mot-v" class="eng-input-field" value="415">
          </div>
          <div class="eng-input-group">
            <label class="eng-input-label">Number of Poles</label>
            <select id="wiz-mot-poles" class="eng-unit-select" style="border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 8px;">
              <option value="2">2 Poles (3000 RPM sync)</option>
              <option value="4" selected>4 Poles (1500 RPM sync)</option>
              <option value="6">6 Poles (1000 RPM sync)</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top: 14px;" onclick="solveWizardMotor()">Compute Motor Protection & Starter →</button>
        <div id="wiz-result-box" style="margin-top: 14px;"></div>
      `;
    }
  };

  window.solveWizardCable = function () {
    const v = parseFloat(document.getElementById('wiz-cbl-v')?.value) || 230;
    const is3 = document.getElementById('wiz-cbl-phase')?.value === '3';
    const i = parseFloat(document.getElementById('wiz-cbl-i')?.value) || 25;
    const len = parseFloat(document.getElementById('wiz-cbl-len')?.value) || 50;
    const maxPct = parseFloat(document.getElementById('wiz-cbl-drop')?.value) || 5;

    const rho = 0.0175; // Copper
    const factor = is3 ? Math.sqrt(3) : 2;
    const maxV = (maxPct / 100) * v;
    const minArea = (factor * rho * len * i) / maxV;

    const standard = [1.5, 2.5, 4.0, 6.0, 10, 16, 25, 35, 50, 70, 95, 120];
    const rec = standard.find(s => s >= minArea) || Math.ceil(minArea);

    const out = document.getElementById('wiz-result-box');
    if (out) {
      out.innerHTML = `
        <div class="eng-final-answer" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-size: 12px; color: var(--accent-emerald); font-weight: 700;">✅ RECOMMENDED CABLE SPECIFICATION:</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">
            ${rec} mm² Multi-core Copper Conductor
          </div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            Calculated Minimum Cross-Section: <strong>${minArea.toFixed(2)} mm²</strong>. Under full load of ${i} A over ${len} m, actual voltage drop will be <strong>${((factor * rho * len * i) / rec).toFixed(2)} V</strong> (${(((factor * rho * len * i) / rec / v) * 100).toFixed(2)}%), fully compliant with ${maxPct}% limit.
          </div>
        </div>
      `;
    }
  };

  window.solveWizardSolar = function () {
    const kwh = parseFloat(document.getElementById('wiz-sol-kwh')?.value) || 10;
    const psh = parseFloat(document.getElementById('wiz-sol-psh')?.value) || 5.2;
    const w = parseFloat(document.getElementById('wiz-sol-w')?.value) || 450;
    const days = parseFloat(document.getElementById('wiz-sol-days')?.value) || 2;

    const arrayW = (kwh * 1000 * 1.3) / psh;
    const panels = Math.ceil(arrayW / w);
    const totalKwp = (panels * w) / 1000;
    const batKwh = (kwh * days) / (0.8 * 0.9);

    const out = document.getElementById('wiz-result-box');
    if (out) {
      out.innerHTML = `
        <div class="eng-final-answer" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-size: 12px; color: var(--accent-emerald); font-weight: 700;">☀️ RECOMMENDED SYSTEM BLUEPRINT:</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">
            ${panels} × ${w}W PV Modules (${totalKwp.toFixed(2)} kWp)
          </div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            • Inverter Rating: <strong>≥ ${Math.ceil(totalKwp * 1.15)} kW</strong> Hybrid Inverter<br>
            • Battery Energy: <strong>${batKwh.toFixed(1)} kWh</strong> (at 48V: <strong>${Math.round((batKwh * 1000) / 48)} Ah</strong>)<br>
            • Daily Yield: ~<strong>${(totalKwp * psh * 0.8).toFixed(1)} kWh/day</strong> clean harvest
          </div>
        </div>
      `;
    }
  };

  window.solveWizardMotor = function () {
    const kw = parseFloat(document.getElementById('wiz-mot-kw')?.value) || 7.5;
    const v = parseFloat(document.getElementById('wiz-mot-v')?.value) || 415;
    const poles = parseInt(document.getElementById('wiz-mot-poles')?.value) || 4;

    const fla = (kw * 1000) / (Math.sqrt(3) * v * 0.85 * 0.88);
    const dolInrush = fla * 6;
    const sdInrush = fla * 2;
    const recOverload = `${fla.toFixed(1)} A - ${(fla * 1.15).toFixed(1)} A`;

    const out = document.getElementById('wiz-result-box');
    if (out) {
      out.innerHTML = `
        <div class="eng-final-answer" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="font-size: 12px; color: var(--accent-emerald); font-weight: 700;">⚙️ MOTOR STARTER & PROTECTION SIZING:</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);">
            Full Load Amps (FLA): ${fla.toFixed(2)} A
          </div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            • Thermal Overload Relay Setting: <strong>${recOverload}</strong><br>
            • Direct-on-Line (DOL) Inrush: <strong>${dolInrush.toFixed(0)} A</strong><br>
            • Star-Delta Inrush: <strong>${sdInrush.toFixed(0)} A</strong><br>
            • Recommended Starter Type: <strong>${kw >= 5.5 ? 'Star-Delta Starter or VFD' : 'DOL Starter'}</strong>
          </div>
        </div>
      `;
    }
  };

  /* ==========================================================================
     NATURAL LANGUAGE SEARCH QUERY PARSER
     ========================================================================== */
  window.handleSmartSearch = function (query) {
    if (!query) return;
    const q = query.toLowerCase().trim();

    // Natural language pattern matchers
    if (q.includes('motor') && (q.includes('kw') || q.includes('current') || q.includes('400') || q.includes('415'))) {
      const kwMatch = q.match(/(\d+(\.\d+)?)\s*kw/);
      const vMatch = q.match(/(\d+)\s*v/);
      switchCategory('motors');
      if (kwMatch && document.getElementById('motor-power')) {
        document.getElementById('motor-power').value = kwMatch[1];
      }
      if (vMatch && document.getElementById('motor-voltage')) {
        document.getElementById('motor-voltage').value = vMatch[1];
      }
      if (window.calculateMotor) window.calculateMotor();
      showToast(`Configured Motor Calculator for "${query}"`);
      return;
    }

    if (q.includes('voltage drop') || (q.includes('cable') && (q.includes('m') || q.includes('drop') || q.includes('amp')))) {
      const lenMatch = q.match(/(\d+(\.\d+)?)\s*m/);
      const aMatch = q.match(/(\d+(\.\d+)?)\s*a/);
      switchCategory('cables');
      if (lenMatch && document.getElementById('cbl-l')) {
        document.getElementById('cbl-l').value = lenMatch[1];
      }
      if (aMatch && document.getElementById('cbl-i')) {
        document.getElementById('cbl-i').value = aMatch[1];
      }
      if (window.calcCableVoltageDrop) window.calcCableVoltageDrop();
      showToast(`Loaded Voltage Drop Calculator for "${query}"`);
      return;
    }

    if (q.includes('solar') || q.includes('pv') || q.includes('sun')) {
      const kwhMatch = q.match(/(\d+(\.\d+)?)\s*kwh/);
      switchCategory('solar');
      if (kwhMatch && document.getElementById('sol-daily')) {
        document.getElementById('sol-daily').value = kwhMatch[1];
      }
      if (window.calcSolarSystem) window.calcSolarSystem();
      showToast(`Loaded Solar PV Sizer for "${query}"`);
      return;
    }

    if (q.includes('ohm') || q.includes('resistance') || q.includes('v/r') || q.includes('i*r')) {
      switchCategory('fundamentals');
      showToast("Opened Ohm's Law Solver");
      return;
    }

    if (q.includes('transformer') || q.includes('kva') || q.includes('fault')) {
      switchCategory('transformers');
      showToast('Opened Transformer Calculator');
      return;
    }

    if (q.includes('battery') || q.includes('ah') || q.includes('runtime')) {
      switchCategory('batteries');
      showToast('Opened Battery Sizing Calculator');
      return;
    }

    if (q.includes('4-20') || q.includes('sensor') || q.includes('loop')) {
      switchCategory('automation');
      showToast('Opened 4–20 mA Sensor Scaler');
      return;
    }

    // Generic search filter across cards
    const cards = document.querySelectorAll('.eng-calc-card');
    let found = 0;
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (text.includes(q)) {
        card.style.display = 'flex';
        found++;
      } else {
        card.style.display = 'none';
      }
    });

    if (found === 0) {
      cards.forEach(card => card.style.display = 'flex');
      showToast(`No exact match for "${query}". Showing all tools.`);
    } else {
      showToast(`Found ${found} matching calculators`);
    }
  };

  /* ==========================================================================
     CATEGORY & NAVIGATION SWITCHING
     ========================================================================== */
  function switchNavTab(tabName) {
    CalcState.activeNavTab = tabName;
    document.querySelectorAll('.calc-nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    const panels = ['calculators-panel', 'wizard-panel', 'engineermode-panel', 'graphs-panel', 'formulas-panel', 'converter-panel', 'history-panel'];
    panels.forEach(p => {
      const el = document.getElementById(p);
      if (el) el.style.display = (p === `${tabName}-panel`) ? 'block' : 'none';
    });

    if (tabName === 'graphs') {
      setTimeout(() => {
        drawRcCanvas(12, 0.047);
        drawAcCanvas(230 * Math.SQRT2, 50);
        drawRlcCanvas();
        drawMotorTorqueCanvas();
      }, 100);
    } else if (tabName === 'history') {
      updateHistoryUI();
    } else if (tabName === 'wizard') {
      startWizard(CalcState.activeWizard || 'cable');
    }
  }

  window.switchNavTab = switchNavTab;

  function switchCategory(catName) {
    CalcState.activeCategory = catName;
    document.querySelectorAll('.calc-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === catName);
    });

    document.querySelectorAll('.calc-cat-section').forEach(sec => {
      sec.style.display = (sec.getAttribute('data-cat') === catName) ? 'flex' : 'none';
    });

    // Ensure we are in the calculators tab
    switchNavTab('calculators');
  }

  window.switchCategory = switchCategory;

  function setNotationMode(mode) {
    CalcState.notationMode = mode;
    document.querySelectorAll('.notation-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
    showToast(`Display format: ${mode.toUpperCase()}`);
  }

  window.setNotationMode = setNotationMode;

  /* ==========================================================================
     HISTORY UI UPDATE
     ========================================================================== */
  function updateHistoryUI() {
    const container = document.getElementById('history-list-container');
    const badge = document.getElementById('calc-history-badge');
    if (badge) badge.textContent = CalcState.history.length;

    if (!container) return;

    if (CalcState.history.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">📜</div>
          <p style="font-size: 15px; font-weight: 600;">No calculation history yet</p>
          <p style="font-size: 13px;">Perform calculations in any module and click "★ Save" or auto-save to log them here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="calc-history-table">
        <thead>
          <tr>
            <th>Date / Time</th>
            <th>Calculator</th>
            <th>Inputs</th>
            <th>Result</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${CalcState.history.map(item => `
            <tr>
              <td style="font-size: 12px; color: var(--text-muted);">${item.dateStr}</td>
              <td style="font-weight: 600; color: var(--accent-cyan);">${item.name}</td>
              <td style="font-family: var(--font-mono); font-size: 12px;">${item.inputs}</td>
              <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-emerald);">${item.result}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-sm btn-ghost" onclick="copyResult('${item.result.replace(/'/g, "\\'")}')" title="Copy result">📋</button>
                  <button class="btn btn-sm btn-ghost" style="color: var(--accent-rose);" onclick="deleteHistoryItem('${item.id}')" title="Delete">✕</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /* ==========================================================================
     UNIVERSAL UNIT CONVERTER ENGINE
     ========================================================================== */
  const CONVERSIONS = {
    voltage: {
      V: 1, mV: 1e-3, kV: 1e3, MV: 1e6
    },
    current: {
      A: 1, mA: 1e-3, uA: 1e-6, kA: 1e3
    },
    resistance: {
      ohm: 1, mohm: 1e-3, kohm: 1e3, Mohm: 1e6
    },
    power: {
      W: 1, mW: 1e-3, kW: 1e3, MW: 1e6, hp: 745.7
    },
    frequency: {
      Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rad_s: 1 / (2 * Math.PI)
    },
    capacitance: {
      F: 1, mF: 1e-3, uF: 1e-6, nF: 1e-9, pF: 1e-12
    },
    inductance: {
      H: 1, mH: 1e-3, uH: 1e-6
    },
    length: {
      m: 1, mm: 1e-3, cm: 1e-2, km: 1e3, inch: 0.0254, ft: 0.3048
    }
  };

  window.runUnitConverter = function (source) {
    const cat = document.getElementById('conv-category')?.value || 'voltage';
    const vFrom = parseFloat(document.getElementById('conv-val-from')?.value) || 0;
    const uFrom = document.getElementById('conv-unit-from')?.value;
    const uTo = document.getElementById('conv-unit-to')?.value;

    const rates = CONVERSIONS[cat];
    if (!rates || !rates[uFrom] || !rates[uTo]) return;

    const base = vFrom * rates[uFrom];
    const target = base / rates[uTo];

    const toInput = document.getElementById('conv-val-to');
    if (toInput) toInput.value = target.toPrecision(6);
  };

  window.updateConverterUnits = function () {
    const cat = document.getElementById('conv-category')?.value || 'voltage';
    const rates = CONVERSIONS[cat] || {};
    const keys = Object.keys(rates);

    const fromSel = document.getElementById('conv-unit-from');
    const toSel = document.getElementById('conv-unit-to');

    if (fromSel && toSel) {
      fromSel.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');
      toSel.innerHTML = keys.map((k, i) => `<option value="${k}" ${i === 1 ? 'selected' : ''}>${k}</option>`).join('');
    }
    runUnitConverter('from');
  };

  /* ==========================================================================
     INITIALIZATION ON DOM LOAD
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    // Setup unit converter defaults
    if (document.getElementById('conv-category')) {
      updateConverterUnits();
    }

    // Default calculations for pre-filled inputs
    setTimeout(() => {
      calcOhmsLaw();
      calcElectricalPower();
      calcConductorResistance();
      calcVoltageDivider();
      calcSeriesParallelResistors();
      calcRcTimeConstant();
      calcAcWaveform();
      calcComplexImpedance();
      calcPowerFactorCorrection();
      calcThreePhasePower();
      calcTransformerSizing();
      calcCableVoltageDrop();
      renderLoadScheduleTable();
      calcInstallationLoad();
      calcBatteryStorage();
      calcSolarSystem();
      calcLedResistor();
      calcOpAmp();
      calcSensorScaling();
    }, 250);
  });

})();
