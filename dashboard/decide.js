/* ===== Decision guide: you set the weights and scores; the guide ranks the options from your input and the survey evidence ===== */
(function () {
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
    for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k instanceof Node ? k : document.createTextNode(String(k))); }
    return e;
  }
  const TRACK = {O1: 'City values residents over visitors; tourism benefits me or my family; understand tax benefits (Anaheim)', O2: 'Would appreciate resident discounts; tourism benefits me or my family (both cities)', O3: 'Visit Anaheim awareness and favorability (Garden Grove)', O4: 'Feel well-informed; want more information on Disneyland’s plans (both cities)', O5: 'Vendor confirmations received; Garden Grove and Anaheim wording aligned before the next wave'};
  let state = null;
  let HOST = null;
  dash.draw('decide', {
    mount(host) {
      HOST = host; host.replaceChildren(h('p', {class: 'rs-cap'}, 'Loading the options…'));
      build(host);
      return {};
    },
    update() { if (HOST) build(HOST); }
  });
  function build(host) {
      const d = dash.data('decision'); if (d.status !== 'ok') return;
      if (state && host.querySelector('.rs-decide')) return;
      const crit = Array.from(new Map(d.data.map((r) => [r.criterion_id, r])).values());
      const opts = Array.from(new Map(d.data.map((r) => [r.option_id, r])).values());
      const ev = (o, c) => { const r = d.data.find((x) => x.option_id === o && x.criterion_id === c); return r ? r.evidence : 'No evidence row'; };
      state = {w: Object.fromEntries(crit.map((c) => [c.criterion_id, 0])), s: {}, keep: Object.fromEntries(opts.map((o) => [o.option_id, true]))};
      const wf = h('fieldset', null, h('legend', null, '1. How much does each factor matter to you?'));
      crit.forEach((c) => {
        const out = h('output', null, 'Not set');
        const rg = h('input', {type: 'range', min: '0', max: '40', step: '5', value: '0', 'aria-label': c.criterion});
        rg.addEventListener('input', () => { state.w[c.criterion_id] = +rg.value; out.textContent = +rg.value ? rg.value + '%' : 'Not set'; });
        wf.append(h('label', null, h('span', null, c.criterion), rg, out));
      });
      wf.append(h('p', {class: 'rs-cap'}, 'Every weight starts unset: the guide does not suggest any. Weights are rescaled to total 100%.'));
      const sf = h('fieldset', null, h('legend', null, '2. Score each option 1–5 on each factor (5 = best)'),
        h('p', {class: 'rs-cap'}, 'Use the survey evidence shown under each choice. Cost and effort need Marketing’s budget, timeline and team capacity.'));
      opts.forEach((o) => {
        const grp = h('div', {class: 'rs-block'}, h('p', null, h('strong', null, o.option_id.replace('O', 'Option ') + ': ' + o.option)));
        crit.forEach((c) => {
          const sel = h('select', {class: 'dash-select', 'aria-label': o.option + ': ' + c.criterion});
          sel.append(new Option('Not scored', ''), ...[1, 2, 3, 4, 5].map((n) => new Option(String(n), String(n))));
          sel.addEventListener('change', () => { state.s[o.option_id + '|' + c.criterion_id] = sel.value ? +sel.value : null; });
          grp.append(h('label', {class: 'opt'}, h('span', null, h('strong', null, c.criterion), h('span', {class: 'rs-cap'}, ' ' + ev(o.option_id, c.criterion_id))), sel));
        });
        sf.append(grp);
      });
      const of = h('fieldset', null, h('legend', null, '3. Which options are on the table?'));
      opts.forEach((o) => { const cb = h('input', {type: 'checkbox', checked: ''}); cb.addEventListener('change', () => { state.keep[o.option_id] = cb.checked; }); of.append(h('label', {class: 'opt'}, cb, h('span', null, h('strong', null, o.option), ' — ' + o.option_detail))); });
      const ta = h('textarea', {'aria-label': 'Your response', placeholder: 'Add context the survey can’t give, such as budget, timing or partner readiness.'});
      const tm = h('select', {class: 'dash-select', 'aria-label': 'Timing'}, new Option('Before the next survey wave', 'Before the next survey wave'), new Option('In the next 90 days', 'In the next 90 days'), new Option('This fiscal year', 'This fiscal year'));
      const rf = h('fieldset', null, h('legend', null, '4. Your response'), ta, h('label', {class: 'opt'}, h('span', null, 'Timing'), tm));
      const go = h('button', {type: 'button', class: 'go'}, 'Generate decision');
      const memo = h('div', {role: 'status', 'aria-live': 'polite'});
      go.addEventListener('click', () => {
        const tot = Object.values(state.w).reduce((s, v) => s + v, 0);
        const kept = opts.filter((o) => state.keep[o.option_id]);
        if (!tot) { memo.replaceChildren(h('p', {class: 'rs-flag'}, 'Set at least one weight in step 1 to generate a decision.')); return; }
        if (!kept.length) { memo.replaceChildren(h('p', {class: 'rs-flag'}, 'Keep at least one option to generate a decision.')); return; }
        const used = crit.filter((c) => state.w[c.criterion_id] > 0);
        const missing = [];
        kept.forEach((o) => used.forEach((c) => { if (!state.s[o.option_id + '|' + c.criterion_id]) missing.push(o.option + ': ' + c.criterion); }));
        if (missing.length) { memo.replaceChildren(h('p', {class: 'rs-flag'}, 'Score these before generating (only factors with a weight are needed):'), h('ul', {class: 'rs-list'}, ...missing.map((m) => h('li', null, m)))); return; }
        const scored = kept.map((o) => {
          const s = used.reduce((a, c) => a + state.w[c.criterion_id] * state.s[o.option_id + '|' + c.criterion_id], 0) / tot;
          const why = used.slice().sort((a, b) => state.w[b.criterion_id] * state.s[o.option_id + '|' + b.criterion_id] - state.w[a.criterion_id] * state.s[o.option_id + '|' + a.criterion_id]).slice(0, 3)
            .map((c) => ({criterion: c.criterion, score: state.s[o.option_id + '|' + c.criterion_id], evidence: ev(o.option_id, c.criterion_id)}));
          return {o, s: Math.round(s * 100) / 100, why};
        }).sort((a, b) => b.s - a.s);
        const top = scored[0], next = scored[1], note = ta.value.trim();
        const wtxt = used.map((c) => c.criterion + ' ' + Math.round(100 * state.w[c.criterion_id] / tot) + '%').join(', ');
        const lines = ['Decision: lead with ' + top.o.option + '.', next ? 'Then: ' + next.o.option + '.' : '', 'Timing: ' + tm.value + '.', 'Score with your weights and scores: ' + top.s.toFixed(2) + ' of 5' + (next ? ' (next best ' + next.s.toFixed(2) + ')' : '') + '.', 'Survey evidence behind it:', ...top.why.map((r) => '- ' + r.criterion + ' (your score ' + r.score + '): ' + r.evidence), note ? 'Your response: ' + note : '', 'Track in the next wave: ' + (TRACK[top.o.option_id] || 'the related measures') + '.', 'Your weights: ' + wtxt + '.'].filter(Boolean);
        memo.replaceChildren(h('div', {class: 'rs-memo', id: 'decision-memo'},
          h('span', {class: 'rs-hint'}, 'Generated from your weights and scores, the options you kept and the survey evidence'),
          h('h4', null, 'Decision: lead with ' + top.o.option), next ? h('p', null, h('strong', null, 'Then: '), next.o.option + ' (' + next.o.option_detail + ').') : null,
          h('p', null, h('strong', null, 'Timing: '), tm.value + '.'),
          h('p', null, h('strong', null, 'Score with your weights and scores: '), top.s.toFixed(2) + ' of 5' + (next ? ', next best ' + next.s.toFixed(2) : '') + '.'),
          h('p', null, h('strong', null, 'Survey evidence behind it:')), h('ul', {class: 'rs-list'}, ...top.why.map((r) => h('li', null, h('strong', null, r.criterion + ' (your score ' + r.score + '): '), r.evidence))),
          note ? h('div', null, h('p', null, h('strong', null, 'Your response, kept with the decision:')), h('blockquote', null, note)) : h('p', {class: 'rs-cap'}, 'No written response added.'),
          h('p', null, h('strong', null, 'How we will know: '), 'track ' + (TRACK[top.o.option_id] || 'the related measures') + ' in the next wave.'),
          h('p', {class: 'rs-cap'}, 'Your weights: ' + wtxt + '. The ranking comes only from the weights and scores you entered.'),
          (() => { const c = h('button', {type: 'button', class: 'go'}, 'Copy decision'); c.addEventListener('click', async () => { try { await navigator.clipboard.writeText(lines.join('\n')); c.textContent = 'Copied'; } catch (_) { c.textContent = 'Copy not available here'; } }); const sv = h('button', {type: 'button', class: 'go'}, 'Save as text'); sv.addEventListener('click', async () => { try { const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (!dl) { sv.textContent = 'Saving not available here'; return; } await dl.save({filename: 'resident-engagement-decision.txt', data: new Blob([lines.join('\n')], {type: 'text/plain'})}); sv.textContent = 'Saved'; } catch (_) { sv.textContent = 'Not saved'; } }); return h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'}, c, sv); })()));
        requestAnimationFrame(() => memo.scrollIntoView({block: 'nearest'}));
      });
      host.replaceChildren(h('div', {class: 'rs-decide'}, h('p', null, 'Weigh what matters, score each option against the survey evidence, and the guide ranks the options and writes up a decision you can copy or save. Nothing is pre-filled.'), wf, sf, of, rf, go, memo));
  }
})();
