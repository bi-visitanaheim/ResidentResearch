/* ===== Decision guide: respond to what the guide shows, then generate a decision from your input ===== */
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
      state = {w: Object.fromEntries(crit.map((c) => [c.criterion_id, +c.weight_pct])), keep: Object.fromEntries(opts.map((o) => [o.option_id, true]))};
      const wf = h('fieldset', null, h('legend', null, '1. How much does each factor matter to you?'));
      crit.forEach((c) => {
        const out = h('output', null, c.weight_pct + '%');
        const rg = h('input', {type: 'range', min: '0', max: '40', step: '5', value: c.weight_pct, 'aria-label': c.criterion});
        rg.addEventListener('input', () => { state.w[c.criterion_id] = +rg.value; out.textContent = rg.value + '%'; });
        wf.append(h('label', null, h('span', null, c.criterion), rg, out));
      });
      wf.append(h('p', {class: 'rs-cap'}, 'Starting weights are the guide’s. Weights are rescaled to total 100%.'));
      const of = h('fieldset', null, h('legend', null, '2. Which options are on the table?'));
      opts.forEach((o) => { const cb = h('input', {type: 'checkbox', checked: ''}); cb.addEventListener('change', () => { state.keep[o.option_id] = cb.checked; }); of.append(h('label', {class: 'opt'}, cb, h('span', null, h('strong', null, o.option), ' — ' + o.option_detail))); });
      const ta = h('textarea', {'aria-label': 'Your response', placeholder: 'For example: budget is tight this quarter; Scott wants something we can show residents before the next wave; partners for discounts are not lined up yet.'});
      const tm = h('select', {class: 'dash-select', 'aria-label': 'Timing'}, new Option('Before the next survey wave', 'Before the next survey wave'), new Option('In the next 90 days', 'In the next 90 days'), new Option('This fiscal year', 'This fiscal year'));
      const rf = h('fieldset', null, h('legend', null, '3. Your response to what the guide shows'), ta, h('label', {class: 'opt'}, h('span', null, 'Timing'), tm));
      const go = h('button', {type: 'button', class: 'go'}, 'Generate decision');
      const memo = h('div', {role: 'status', 'aria-live': 'polite'});
      go.addEventListener('click', () => {
        const tot = Object.values(state.w).reduce((s, v) => s + v, 0) || 1;
        const kept = opts.filter((o) => state.keep[o.option_id]);
        if (!kept.length) { memo.replaceChildren(h('p', {class: 'rs-flag'}, 'Keep at least one option to generate a decision.')); return; }
        const scored = kept.map((o) => {
          const rows = d.data.filter((r) => r.option_id === o.option_id);
          const s = rows.reduce((a, r) => a + state.w[r.criterion_id] * (+r.score), 0) / tot;
          const why = rows.slice().sort((a, b) => state.w[b.criterion_id] * (+b.score) - state.w[a.criterion_id] * (+a.score)).slice(0, 3);
          return {o, s: Math.round(s * 100) / 100, why};
        }).sort((a, b) => b.s - a.s);
        const top = scored[0], next = scored[1], note = ta.value.trim();
        const wtxt = crit.map((c) => c.criterion.replace(/ \(.*\)/, '') + ' ' + Math.round(100 * state.w[c.criterion_id] / tot) + '%').join(', ');
        const lines = ['Decision: lead with ' + top.o.option + '.', next ? 'Then: ' + next.o.option + '.' : '', 'Timing: ' + tm.value + '.', 'Score with your weights: ' + top.s.toFixed(2) + ' of 5' + (next ? ' (next best ' + next.s.toFixed(2) + ')' : '') + '.', 'Why, from the data:', ...top.why.map((r) => '- ' + r.criterion + ': ' + r.reasoning), note ? 'Your response: ' + note : '', 'Track in the next wave: ' + (TRACK[top.o.option_id] || '') + '.', 'Your weights: ' + wtxt + '.'].filter(Boolean);
        memo.replaceChildren(h('div', {class: 'rs-memo', id: 'decision-memo'},
          h('span', {class: 'rs-hint'}, 'Generated from your weights, the options you kept and the survey data'),
          h('h4', null, 'Decision: lead with ' + top.o.option), next ? h('p', null, h('strong', null, 'Then: '), next.o.option + ' (' + next.o.option_detail + ').') : null,
          h('p', null, h('strong', null, 'Timing: '), tm.value + '.'),
          h('p', null, h('strong', null, 'Score with your weights: '), top.s.toFixed(2) + ' of 5' + (next ? ', next best ' + next.s.toFixed(2) : '') + '.'),
          h('p', null, h('strong', null, 'Why, from the data:')), h('ul', {class: 'rs-list'}, ...top.why.map((r) => h('li', null, h('strong', null, r.criterion + ': '), r.reasoning))),
          note ? h('div', null, h('p', null, h('strong', null, 'Your response, kept with the decision:')), h('blockquote', null, note)) : h('p', {class: 'rs-cap'}, 'No written response added.'),
          h('p', null, h('strong', null, 'How we will know: '), 'track ' + (TRACK[top.o.option_id] || 'the related measures') + ' in the next wave.'),
          h('p', {class: 'rs-cap'}, 'Your weights: ' + wtxt + '. The ranking comes from your weights and the options you kept; your written response is kept with the decision as written.'),
          (() => { const c = h('button', {type: 'button', class: 'go'}, 'Copy decision'); c.addEventListener('click', async () => { try { await navigator.clipboard.writeText(lines.join('\n')); c.textContent = 'Copied'; } catch (_) { c.textContent = 'Copy not available here'; } }); const sv = h('button', {type: 'button', class: 'go'}, 'Save as text'); sv.addEventListener('click', async () => { try { const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (!dl) { sv.textContent = 'Saving not available here'; return; } await dl.save({filename: 'resident-engagement-decision.txt', data: new Blob([lines.join('\n')], {type: 'text/plain'})}); sv.textContent = 'Saved'; } catch (_) { sv.textContent = 'Not saved'; } }); return h('div', {style: 'display:flex;gap:8px;flex-wrap:wrap'}, c, sv); })()));
        requestAnimationFrame(() => memo.scrollIntoView({block: 'nearest'}));
      });
      host.replaceChildren(h('div', {class: 'rs-decide'}, h('p', null, 'Look over the matrix and the data, then tell the guide what matters to you. It ranks the options with your weights and writes up a decision you can copy or save.'), wf, of, rf, go, memo));
  }
})();
