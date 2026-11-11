/* ===== In residents' own words: theme analysis of written answers and the word meaning chart ===== */
(function () {
  const enc = (s) => encodeURIComponent(String(s));
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
    for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k instanceof Node ? k : document.createTextNode(String(k))); }
    return e;
  }
  const mark = (src, f, where, txt) => h('span', {'data-source': src, 'data-field': f, 'data-where': where}, txt);
  const ok = (...ids) => ids.every((i) => dash.data(i).status === 'ok');
  function wait(host, ...ids) { const bad = ids.map((i) => dash.data(i)).find((d) => d.status !== 'ok'); host.replaceChildren(); if (bad && (bad.status === 'error' || bad.status === 'missing')) host.append(h('p', {class: 'rs-fail'}, 'Failed to load')); }
  const LANG = (q) => q.startsWith('ANA') ? 'Spanish' : 'Vietnamese';
  function marked(text) { // [[word]] -> <mark>
    const out = []; const re = /\[\[(.+?)\]\]/g; let i = 0, m;
    while ((m = re.exec(text))) { if (m.index > i) out.push(text.slice(i, m.index)); out.push(h('mark', null, m[1])); i = re.lastIndex; }
    if (i < text.length) out.push(text.slice(i)); return out;
  }
  const quoteEl = (q, txt, tr) => h('blockquote', {class: 'rs-quote'}, '“', ...marked(txt), '”', tr === 'Y' ? h('cite', null, 'Translated from ' + LANG(q) + ' by BI') : null);
  const META = () => { const d = dash.data('voices_meta'); return d.status === 'ok' ? Object.fromEntries(d.data.map((r) => [r.qid, r])) : {}; };

  dash.calc('voices_totals', {
    inputs: ['voices_meta'], title: 'Written answers coded', description: 'Totals across the nine open-ended questions',
    fn: (questions) => {
      const answers = questions.reduce((s, q) => s + (+q.base_n), 0), unclassified = questions.reduce((s, q) => s + (+q.other_n), 0);
      return [{answers, questions: questions.length, coded_pct: Math.round(100 * (answers - unclassified) / answers), translated: questions.reduce((s, q) => s + (+q.translated_n), 0), unclassified}];
    }
  });

  dash.draw('vstats', (host) => {
    const d = dash.data('voices_totals'); if (d.status !== 'ok' || !d.data) { wait(host, 'voices_meta'); return; }
    const r = d.data[0], c = (lab, f, suf, note) => h('div', {class: 'rs-card'}, h('p', {class: 'rs-card-label'}, lab), h('p', {class: 'rs-card-val'}, h('span', {'data-source': 'voices_totals', 'data-field': f, 'data-row': '0'}, r[f]), suf || ''), note ? h('p', {class: 'rs-cap'}, note) : null);
    host.replaceChildren(h('div', {class: 'rs-kpis3'}, c('Written answers read', 'answers', '', 'Anaheim W4 and Garden Grove W2'), c('Open-ended questions', 'questions', '', '1 in Anaheim, 8 in Garden Grove'), c('Answers placed in a theme', 'coded_pct', '%', 'The rest were too vague to code'), c('Answers translated', 'translated', '', 'Vietnamese and Spanish, by BI')));
  });

  dash.draw('vsum', (host) => {
    if (!ok('voices_meta', 'voices_themes')) { wait(host, 'voices_meta', 'voices_themes'); return; }
    const meta = dash.data('voices_meta').data, th = dash.data('voices_themes').data;
    host.replaceChildren(h('ul', {class: 'rs-list'}, ...meta.map((m) => {
      const top = th.filter((t) => t.qid === m.qid && t.kind === 'theme').sort((a, b) => +a.rank - +b.rank).slice(0, 2);
      if (!top.length) return null;
      const w = (t) => 'qid=' + enc(t.qid) + '&theme=' + enc(t.theme);
      return h('li', null, h('strong', null, m.city + ': ' + m.short.charAt(0).toLowerCase() + m.short.slice(1) + ': '), top[0].theme.toLowerCase() + ' (', mark('voices_themes', 'pct', w(top[0]), top[0].pct), '%)', top[1] ? [', then ' + top[1].theme.toLowerCase() + ' (', mark('voices_themes', 'pct', w(top[1]), top[1].pct), '%)'] : '', '. n=', mark('voices_meta', 'base_n', 'qid=' + enc(m.qid), m.base_n), '.');
    })));
  });

  /* family x question heat table */
  dash.draw('vheat', (host) => {
    if (!ok('voices_meta', 'voices_families', 'voices_themes')) { wait(host, 'voices_meta', 'voices_families', 'voices_themes'); return; }
    const meta = dash.data('voices_meta').data, fam = dash.data('voices_families').data, th = dash.data('voices_themes').data;
    const fams = Array.from(new Set(fam.map((r) => r.family))).filter((f) => f !== 'No answer of substance');
    const tot = (f) => fam.filter((r) => r.family === f).reduce((s, r) => s + (+r.count), 0);
    fams.sort((a, b) => tot(b) - tot(a));
    const short = {'ANA-C4': 'Anaheim: benefits from tourism', 'GG-A2': 'GG: why they feel that way', 'GG-A3': 'GG: benefits of living there', 'GG-A4': 'GG: concerns', 'GG-A8': 'GG: views of Visit Anaheim', 'GG-B9': 'GG: easier to use offerings', 'GG-C3a': 'GG: tourism’s positive effect', 'GG-D2': 'GG: tourism career, why', 'GG-D3': 'GG: tourism career, what would help'};
    const tbl = h('table', {class: 'rs-heat', 'data-source': 'voices_families'});
    tbl.append(h('thead', null, h('tr', null, h('th', null, 'Theme family'), ...meta.map((m) => h('th', {class: 'q', scope: 'col'}, short[m.qid] || m.short)))));
    const tb = h('tbody');
    fams.forEach((f) => {
      const tr = h('tr', null, h('th', {scope: 'row'}, f));
      meta.forEach((m) => {
        const r = fam.find((x) => x.qid === m.qid && x.family === f);
        if (!r) { tr.append(h('td', {class: 'empty'}, '·')); return; }
        const v = +r.pct, td = h('td', {tabindex: '0', 'aria-label': f + ', ' + m.short + ': ' + v + '%'}, mark('voices_families', 'pct', 'qid=' + enc(m.qid) + '&family=' + enc(f), r.pct), '%');
        td.style.background = 'color-mix(in srgb, #125C60 ' + Math.min(100, Math.round(v * 1.6) + 8) + '%, var(--color-panel))';
        td.style.color = v >= 30 ? '#FFFFFF' : 'var(--color-fg)';
        const go = (ev) => {
          tbl.querySelectorAll('td.sel').forEach((c) => c.classList.remove('sel')); td.classList.add('sel');
          const parts = th.filter((t) => t.qid === m.qid && t.family === f && t.kind === 'theme').sort((a, b) => +a.rank - +b.rank);
          window.__rsXP(host, ev, [f + ' · ' + m.city + ' ' + m.wave, v + '% of residents who answered "' + m.wording + '" (' + r.count + ' of ' + r.base_n + ')', 'Themes in this family: ' + parts.map((p) => p.theme + ' ' + p.pct + '%').join('; ')], null, {kicker: 'Selected cell'});
        };
        td.addEventListener('click', go); td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
        tr.append(td);
      });
      tb.append(tr);
    });
    tbl.append(tb);
    host.replaceChildren(h('div', {class: 'rs-scroll'}, tbl));
  });

  /* one question: theme bars + quotes */
  dash.draw('vq', (host) => {
    if (!ok('voices_meta', 'voices_themes', 'voices_quotes')) { wait(host, 'voices_meta', 'voices_themes', 'voices_quotes'); return; }
    const q = host.getAttribute('data-qid'), m = META()[q]; if (!m) { host.replaceChildren(); return; }
    const th = dash.data('voices_themes').data.filter((t) => t.qid === q).sort((a, b) => +a.rank - +b.rank);
    const qs = dash.data('voices_quotes').data.filter((x) => x.qid === q);
    const max = Math.max(...th.map((t) => +t.pct), 1);
    const head = h('div', {class: 'rs-answer'}, h('p', null, h('strong', null, '“' + m.wording + '”')), h('p', {class: 'rs-cap'}, 'Asked of: ' + m.asked + ' · ' + m.city + ' ' + m.wave + ' · ', mark('voices_meta', 'base_n', 'qid=' + enc(q), m.base_n), ' written answers' + (+m.translated_n ? ' (' + m.translated_n + ' translated by BI)' : '') + (m.flag ? ' · ' + m.flag : '') + '. One answer can mention several themes, so shares add to more than 100%.'));
    const bars = h('div', {class: 'rs-vq', role: 'list'});
    const qbox = h('div', {class: 'rs-quotes'});
    const qttl = h('h4', {class: 'rs-h3'});
    function pick(t, ev) {
      bars.querySelectorAll('.rs-vbar.sel').forEach((b) => b.classList.remove('sel'));
      const b = bars.querySelector('[data-theme="' + CSS.escape(t.theme) + '"]'); if (b) b.classList.add('sel');
      const list = qs.filter((x) => x.theme === t.theme).slice(0, 3);
      qttl.textContent = t.kind === 'none' ? t.theme : 'In their words: ' + t.theme.toLowerCase();
      qbox.replaceChildren(...(list.length ? list.map((x) => quoteEl(q, x.quote, x.translated)) : [h('p', {class: 'rs-cap'}, 'No quote shown for this theme.')]));
      if (ev) window.__rsXP(host, ev, [t.theme + ' · ' + m.city + ' ' + m.wave, t.pct + '% of residents who answered (' + t.count + ' of ' + t.base_n + ')', 'Theme family: ' + t.family, 'Rank ' + (t.kind === 'none' ? '—' : t.rank) + ' of ' + th.filter((x) => x.kind === 'theme').length + ' themes'], null, {kicker: 'Selected theme'});
    }
    th.forEach((t) => {
      const w = 'qid=' + enc(q) + '&theme=' + enc(t.theme);
      const fill = h('div', {class: 'fill'}); fill.style.width = (100 * +t.pct / max).toFixed(1) + '%';
      const b = h('button', {type: 'button', class: 'rs-vbar' + (t.kind === 'none' ? ' none' : ''), 'data-theme': t.theme, role: 'listitem'}, h('span', {class: 'lab'}, t.theme), h('span', {class: 'track'}, fill), h('span', {class: 'val'}, mark('voices_themes', 'pct', w, t.pct), '%'));
      b.addEventListener('click', (ev) => pick(t, ev));
      bars.append(b);
    });
    host.replaceChildren(head, h('p', {class: 'rs-hint'}, 'Select a theme to see what residents wrote.'), bars, qttl, qbox, h('p', {class: 'rs-cap'}, 'Source: ' + m.source + '. Coded by BI; quotes are shown as written, with identifying details screened out. Formula F3 in Methodology and notes.'));
    if (th.length) pick(th[0]);
  });

  /* word meaning chart */
  let tcity = 'Garden Grove', tsel = null;
  function vtermsRender(host) {
    if (!ok('voices_terms', 'voices_meta')) { wait(host, 'voices_terms', 'voices_meta'); return; }
    const all = dash.data('voices_terms').data, meta = META();
    const merged = (key) => {
      const rs = all.filter((r) => r.key === key && (tcity === 'Both' || r.city === tcity)); if (!rs.length) return null;
      const qn = {}; rs.forEach((r) => r.questions.split('|').forEach((p) => { const [k, n] = p.split(':'); qn[k] = (qn[k] || 0) + (+n); }));
      const wn = {}; rs.forEach((r) => (r.appears_with || '').split('|').filter(Boolean).forEach((p) => { const [k, n] = p.split(':'); wn[k] = (wn[k] || 0) + (+n); }));
      const ex = []; rs.forEach((r) => [1, 2, 3].forEach((i) => { if (r['ex' + i]) ex.push({t: r['ex' + i], q: r['ex' + i + '_q'], tr: r['ex' + i + '_tr']}); }));
      return {key, term: rs[0].term, family: rs[0].family, rows: rs, n: rs.reduce((s, r) => s + (+r.respondents), 0), base: rs.reduce((s, r) => s + (+r.base_n), 0), qn, wn, ex};
    };
    const keys = Array.from(new Set(all.map((r) => r.key))).map(merged).filter(Boolean).filter((t) => t.n >= 3).sort((a, b) => b.n - a.n);
    const seg = h('div', {class: 'rs-seg', role: 'group', 'aria-label': 'City'});
    ['Garden Grove', 'Anaheim', 'Both'].forEach((c) => { const b = h('button', {type: 'button', 'aria-pressed': String(c === tcity)}, c === 'Both' ? 'Both cities' : c); b.addEventListener('click', () => { tcity = c; tsel = null; vtermsRender(host); }); seg.append(b); });
    const sel = h('select', {class: 'dash-select', 'aria-label': 'Pick a word'}, ...keys.map((t) => { const o = new Option(t.term + ' (' + t.n + ')', t.key); return o; }));
    const chart = h('div', {class: 'rs-terms'}); const panel = h('div', {class: 'rs-term-panel', role: 'status', 'aria-live': 'polite'});
    const wrap = h('div', {class: 'rs-terms-wrap'}, chart, panel);
    const fams = Array.from(new Set(keys.map((t) => t.family)));
    const ramp = ['#125C60', '#2E7F80', '#43A3A3', '#5FB5B6', '#77C7C9', '#94D0D5', '#B4D9E3'];
    const famCol = (f) => ramp[fams.indexOf(f) % ramp.length];
    const legend = h('div', {class: 'rs-famlegend'}, ...fams.map((f) => { const i = h('i'); i.style.background = famCol(f); return h('span', null, i, f); }));
    host.replaceChildren(h('div', {class: 'rs-controls'}, h('div', {class: 'rs-field'}, h('span', null, 'Residents of'), seg), h('label', {class: 'rs-field'}, 'Or pick a word ', sel)), wrap, h('p', {class: 'rs-cap'}, 'Bubble size = number of residents who used the word. Grouped by theme family. Common words (the, a, good, great), place and brand names (Anaheim, Garden Grove, Visit), and words that only restate the question (tourism, residents, city) are left out. Anaheim answered one question and Garden Grove eight, so compare words within a city, not across. Formula F4 in Methodology and notes.'));
    function show(t, ev) {
      tsel = t.key; sel.value = t.key;
      chart.querySelectorAll('.rs-hit').forEach((e) => e.classList.remove('rs-hit'));
      const node = chart.querySelector('[data-key="' + CSS.escape(t.key) + '"]'); if (node) node.classList.add('rs-hit');
      const qrows = Object.entries(t.qn).sort((a, b) => b[1] - a[1]);
      const where = h('ul', {class: 'rs-list rs-cap'}, ...qrows.map(([q, n]) => h('li', null, (meta[q] ? meta[q].city + ': ' + meta[q].short : q) + ' (' + n + ')')));
      const withs = Object.entries(t.wn).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
      const rowsMarked = t.rows.map((r) => h('span', null, r.city + ': ', h('span', {'data-source': 'voices_terms', 'data-field': 'respondents', 'data-where': 'term_id=' + enc(r.term_id)}, r.respondents), ' of ', r.base_n, ' residents (', h('span', {'data-source': 'voices_terms', 'data-field': 'pct', 'data-where': 'term_id=' + enc(r.term_id)}, r.pct), '%)'));
      panel.replaceChildren(h('span', {class: 'k', style: 'font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--va-h)'}, 'What residents mean by'), h('h4', null, t.term),
        h('p', {class: 'rs-cap'}, 'Theme family: ' + t.family), h('p', null, ...rowsMarked.flatMap((x, i) => i ? ['; ', x] : [x]), '.'),
        h('p', null, h('strong', null, 'Comes up when asked about:')), where,
        withs.length ? h('p', null, h('strong', null, 'Often in the same answer as: '), withs.join(', ')) : null,
        h('p', null, h('strong', null, 'In their words:')), ...t.ex.slice(0, 3).map((x) => quoteEl(x.q, x.t, x.tr)));
    }
    sel.addEventListener('change', () => { const t = keys.find((k) => k.key === sel.value); if (t) show(t); });
    function draw() {
      const Wd = Math.max(280, chart.clientWidth || 520), H = Math.min(Math.max(Wd * 0.95, 340), 620);
      const H2 = H; const root = d3.hierarchy({children: fams.map((f) => ({name: f, children: keys.filter((t) => t.family === f)}))}).sum((d) => d.n || 0).sort((a, b) => b.value - a.value);
      d3.pack().size([Wd, H - 14]).padding((d) => d.depth === 0 ? 16 : 2)(root); root.each((d) => { d.y += 14; });
      chart.replaceChildren();
      const svg = d3.select(chart).append('svg').attr('width', Wd).attr('height', H).attr('role', 'img').attr('aria-label', 'Word meaning chart, ' + tcity + ': ' + keys.slice(0, 8).map((t) => t.term + ' ' + t.n).join(', '));
      const fg = svg.selectAll('g.f').data(root.children || []).join('g');
      fg.append('circle').attr('cx', (d) => d.x).attr('cy', (d) => d.y).attr('r', (d) => d.r).style('fill', 'var(--color-panel)').style('stroke', (d) => famCol(d.data.name)).style('stroke-width', 1.5).style('stroke-dasharray', '3 3');
      fg.append('text').attr('x', (d) => d.x).attr('y', (d) => d.y - d.r + (d.r > 40 ? 13 : -3)).attr('text-anchor', 'middle').attr('class', 'rs-axis').style('font-size', '11px').style('font-weight', 700).text((d) => { const k = Math.max(10, Math.floor(d.r / 3)); return d.data.name.length > k ? d.data.name.slice(0, k) + '…' : d.data.name; });
      const lv = svg.selectAll('g.t').data(root.leaves()).join('g').attr('transform', (d) => `translate(${d.x},${d.y})`).style('cursor', 'pointer');
      lv.append('circle').attr('r', (d) => d.r).attr('data-key', (d) => d.data.key).style('fill', (d) => famCol(d.data.family)).style('stroke', 'var(--color-bg)').style('stroke-width', 1)
        .on('click', (ev, d) => show(d.data, ev));
      lv.filter((d) => d.r >= 15).append('text').attr('text-anchor', 'middle').attr('dy', (d) => d.r >= 26 ? -2 : 4).style('font-size', (d) => Math.max(10, Math.min(16, d.r / 3.3)) + 'px').style('font-weight', 700)
        .style('fill', (d) => fams.indexOf(d.data.family) % ramp.length < 3 ? '#FFFFFF' : '#231F20').text((d) => d.data.term.length * 6.5 > d.r * 2 ? d.data.term.slice(0, Math.max(3, Math.floor(d.r / 3.3))) + '…' : d.data.term);
      lv.filter((d) => d.r >= 26).append('text').attr('text-anchor', 'middle').attr('dy', 14).style('font-size', '11px').style('fill', (d) => fams.indexOf(d.data.family) % ramp.length < 3 ? '#FFFFFF' : '#231F20').text((d) => d.data.n);
      lv.append('title').text((d) => d.data.term + ': ' + d.data.n + ' residents');
      const cur = keys.find((k) => k.key === tsel) || keys[0]; if (cur) show(cur);
    }
    requestAnimationFrame(draw);
  }
  dash.draw('vterms', vtermsRender);

  dash.draw('vqa', (tb) => {
    if (!ok('voices_meta')) { tb.replaceChildren(); return; }
    tb.replaceChildren(...dash.data('voices_meta').data.map((m) => h('tr', {'data-key': enc(m.qid)}, h('td', null, m.city + ' ' + m.wave + ' · ' + m.code), h('td', {class: 'wide'}, m.wording), h('td', {class: 'n'}, m.base_n), h('td', {class: 'n'}, m.coded_n), h('td', {class: 'n'}, m.none_n), h('td', {class: 'n'}, m.other_n), h('td', {class: 'n'}, m.translated_n), h('td', null, m.flag || ''))));
  });
})();
