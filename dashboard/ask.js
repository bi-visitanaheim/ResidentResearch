/* ===== Ask the data (searches every document in the BI repository) ===== */
(function () {
  const $ = (s) => document.querySelector(s);
  const P = () => dash.params();
  const STOP = new Set('the a an of in on to for and or is are do does did how what which who whom why when where with by about at from than that this these those our we us me show tell it its they them their there feel feels think say said much many most more less vs versus compare compared between residents resident people percent share would could should can any all'.split(' '));
  const PHRASES = [
    ['gen z', ['gen z']], ['genz', ['gen z']], ['gen x', ['gen x']], ['millennial', ['millennial']], ['boomer', ['boomer']],
    ['tourism worker', ['tourism worker']], ['work in tourism', ['tourism worker', 'tourism household']], ['homeowner', ['own']], ['home owner', ['own']], ['renter', ['rent']],
    ['zip', ['zip']], ['vietnamese', ['vietnamese']], ['west anaheim', ['west anaheim']], ['anaheim hills', ['anaheim hills']], ['resort', ['resort']],
    ['values residents', ['values resident', 'residents over']], ['valued', ['values resident', 'residents over']], ['prioritiz', ['prioritiz', 'values resident']],
    ['sentiment', ['feel about', 'sentiment']], ['feel about', ['feel about']], ['impact', ['impact']], ['benefit', ['benefit', 'impacts me']], ['personally', ['impacts me']], ['personal benefit', ['benefits me', 'personal']], ['benefit me', ['benefits me']], ['awareness', ['aware']], ['familiar', ['familiar']],
    ['favorab', ['favorab', 'sentiment towards visit']], ['channel', ['channel', 'source', 'communicat']], ['discount', ['discount']], ['barrier', ['barrier', 'prevent']],
    ['offering', ['offering']], ['recommend', ['recommend']], ['stay', ['stay']], ['informed', ['informed']], ['educat', ['educat']], ['tax', ['tax']]
  ];
  const GROUPWORDS = ['gen z', 'gen x', 'millennial', 'boomer', 'tourism worker', 'tourism household', 'own', 'rent', 'vietnamese', 'west anaheim', 'anaheim hills', 'resort', 'zip'];
  const KIND_RANK = {'Headline KPI': 6, 'Linked attitudes': 5, 'Results by resident group': 4, 'Resident needs': 3, 'Lists and channels': 3, "In residents' own words": 3, 'Vendor report chart': 1};
  const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '');
  let cache = {data: null, hay: null};
  function hay(rows) {
    if (cache.data === rows) return cache.hay;
    cache = {data: rows, hay: rows.map((r) => ({t: (r.topic + ' ' + r.answer).toLowerCase(), g: (r.group + ' ' + r.segment).toLowerCase(), k: r.kind.toLowerCase()}))};
    return cache.hay;
  }
  function terms(q) {
    const s = ' ' + q.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ') + ' ';
    const out = [], groups = [];
    PHRASES.forEach(([p, pats]) => { if (s.includes(p)) pats.forEach((x) => { out.push(x); if (GROUPWORDS.includes(x)) groups.push(x); }); });
    s.split(/\s+/).filter((w) => w && w.length > 2 && !STOP.has(w)).forEach((w) => { if (!out.includes(w)) out.push(stem(w)); });
    const zips = s.match(/\b9\d{4}\b/g) || [];
    zips.forEach((z) => groups.push(z));
    return {terms: Array.from(new Set(out)), groups: Array.from(new Set(groups))};
  }
  function search(rows, p) {
    const q = (p.q || '').trim(); if (!q) return {q: '', hits: []};
    const {terms: T, groups: G} = terms(q);
    let city = p.qcity || '';
    const ql = q.toLowerCase();
    if (!city && ql.includes('garden grove')) city = 'Garden Grove';
    else if (!city && /\banaheim\b/.test(ql.replace(/visit anaheim|anaheim hills|west anaheim/g, '')) && !ql.includes('garden grove')) city = 'Anaheim';
    const H = hay(rows), hits = [];
    const words = T.filter((t) => !['garden', 'grove', 'anaheim', 'visit'].includes(t));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i], x = H[i];
      if (city && r.city !== city) continue;
      if (p.qwave && r.wave_id !== p.qwave) continue;
      if (p.qkind ? r.kind !== p.qkind : r.kind === 'Group size') continue;
      if (G.length && !G.some((g) => x.g.includes(g))) continue;
      let sc = 0, matched = 0;
      for (const t of words) { let m = 0; if (x.t.includes(t)) m += 3; if (x.g.includes(t)) m += 2; if (x.k.includes(t)) m += 1; if (m) matched++; sc += m; }
      if (!sc && !G.length) continue;
      if (words.length && matched === 0) continue;
      if (/^S\d/.test(r.topic)) sc -= 6;
      if (/^Top 2 Box/.test(r.answer)) sc += 3;
      if (G.some((g) => r.segment.toLowerCase().includes(g))) sc += 3;
      sc += matched * 4 + (KIND_RANK[r.kind] || 0) * 0.6 + (r.wave_id.endsWith('W4') || r.wave_id === 'GG-W2' ? 1 : 0);
      hits.push({r, sc});
    }
    hits.sort((a, b) => b.sc - a.sc || (+b.r.pct) - (+a.r.pct));
    const small = G.length ? rows.filter((r) => r.kind === 'Group size' && (!city || r.city === city) && (!p.qwave || r.wave_id === p.qwave) && G.some((g) => r.segment.toLowerCase().includes(g) || (r.group + ' ' + r.segment).toLowerCase().includes(g)) && +r.n < 30) : [];
    return {q, hits, city, small};
  }
  const clean = (t) => String(t).replace(/^[A-Z]{1,2}\d+[a-z]?\d*[.:]?\s*(r\d+[:.]?\s*)?/, '').replace(/\s+-\s+(Please select|Which of the following best|How much do you agree).*$/i, '').replace(/\s+/g, ' ').trim();
  const ZG = ['Zip Code', 'Zip Codes', 'West Anaheim', 'Anaheim Hills', 'Disneyland Resort Area'];
  function who(r) {
    if (r.segment === 'Total') return 'residents';
    if (ZG.includes(r.group)) return 'residents in ZIP ' + r.segment + (r.group.startsWith('Zip') ? '' : ' (' + r.group + ')');
    if (r.group === 'Generational Cohort') return r.segment.replace(/s$/, '') + ' residents';
    if (r.group === 'Gender') return r.segment.toLowerCase() + ' residents';
    return r.segment.charAt(0).toLowerCase() + r.segment.slice(1);
  }
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function pctMark(r) { const s = mk('b', null, r.pct + '%'); s.setAttribute('data-source', 'facts'); s.setAttribute('data-field', 'pct'); s.setAttribute('data-where', 'fact_id=' + r.fact_id); return s; }
  function sentence(r) {
    const li = mk('li');
    if (r.kind === 'Linked attitudes') { li.append(r.vendor_note + ' '); li.append(mk('span', 'src', '(' + r.city + ', ' + r.wave + ', n=' + r.n + ' · ' + r.source + ')')); return li; }
    li.append(pctMark(r), ' of ' + who(r) + ' in ' + r.city + ' · ');
    const ans = /^Top 2 Box/.test(r.answer) ? 'positive or agree · ' : ((r.answer && !/^(Share shown on chart|Agree \(top 2 box\) or Yes)$/.test(r.answer)) ? '"' + clean(r.answer) + '" · ' : '');
    li.append(ans + clean(r.topic) + ' ');
    li.append(mk('span', 'src', '(' + r.wave + (r.n !== '' && r.n != null ? ', n=' + r.n : '') + ' · ' + r.source + ')'));
    if (r.caution) li.append(mk('span', 'rs-dir', r.caution.startsWith('Small group') ? 'Directional: small group' : r.caution));
    if (r.vendor_note && r.kind !== 'Linked attitudes') li.append(mk('span', 'src', ' ' + r.vendor_note + '.'));
    return li;
  }
  let lastRun = {key: '', res: null};
  function run(rows) {
    const p = P(), key = [p.q, p.qcity, p.qwave, p.qkind].join('|');
    if (lastRun.key !== key || lastRun.rows !== rows) lastRun = {key, rows, res: search(rows, p)};
    return lastRun.res;
  }
  dash.draw('askans', (el) => {
    const d = dash.data('facts');
    if (d.status !== 'ok') { el.textContent = d.status === 'loading' ? 'Loading every document…' : 'The findings file did not load. Refresh the page; if it persists, contact BI.'; return; }
    const res = run(d.data);
    if (!res.q) { el.replaceChildren(mk('p', null, 'Type a question above or pick an example. You will get a short plain-language answer here and every matching result below.')); return; }
    const notes = (res.small || []).map((r) => mk('p', null, 'Only ' + r.n + ' ' + who(r) + ' in ' + r.city + ' (' + r.wave + ') answered the survey. That is too few to report their answers reliably, so their results are left out.'));
    if (!res.hits.length && notes.length) { el.replaceChildren(...notes); return; }
    if (!res.hits.length) { el.replaceChildren(mk('p', null, 'Nothing matched "' + res.q + '". Try a topic (awareness, discounts, personal benefit, channels, offerings, barriers), a resident group (Gen Z, homeowners, renters, tourism workers, a ZIP code), or widen the city, wave or kind filters.')); return; }
    const docs = new Set(res.hits.map((h) => h.r.source.split(',')[0]));
    const top = [], seen = new Set();
    const pool = res.hits.some((h) => !/^S\d/.test(h.r.topic)) ? res.hits.filter((h) => !/^S\d/.test(h.r.topic)) : (notes.length ? [] : res.hits);
    if (!pool.length) { el.replaceChildren(...notes); return; }
    for (const h of pool) { const k = h.r.kind + h.r.topic + h.r.segment + h.r.city + h.r.wave_id; if (seen.has(k)) continue; seen.add(k); top.push(h.r); if (top.length === 6) break; }
    const ul = mk('ul'); top.forEach((r) => ul.append(sentence(r)));
    const lead = mk('p'); lead.append(mk('strong', null, res.hits.length.toLocaleString() + ' matching results'), ' from ' + docs.size + ' document' + (docs.size === 1 ? '' : 's') + (res.city ? ' (' + res.city + ' only)' : '') + '. The strongest matches:');
    const foot = mk('p', 'src', 'Shares are the percent of residents giving that answer. n is the number of residents the share is based on. "Linked attitudes" show two views that tend to go together; they do not prove one causes the other.');
    el.replaceChildren(...notes, lead, ul, foot);
  });
  dash.draw('askrows', (tb) => {
    const d = dash.data('facts'); if (d.status !== 'ok') { tb.replaceChildren(); return; }
    const res = run(d.data), lim = +(P().qlim || 40);
    const rows = res.hits.slice(0, lim).map(({r}) => {
      const tr = mk('tr'); tr.setAttribute('data-key', encodeURIComponent(r.fact_id));
      const td = (t, c) => { const x = mk('td', c, t == null ? '' : String(t)); tr.append(x); return x; };
      td(r.city); td(r.wave); td(clean(r.topic), 'wide'); td(clean(r.answer)); td(r.segment === 'Total' ? 'All residents' : r.segment);
      td(r.pct, 'n'); td(r.n === '' ? 'See wave' : r.n, 'n');
      td([r.vendor_note, r.caution].filter(Boolean).join(' · ') || '·'); td(r.source);
      return tr;
    });
    tb.replaceChildren(...rows);
    document.querySelectorAll('#rs-askmore').forEach((b) => { const want = res.hits.length <= lim; if (b.hidden !== want) b.hidden = want; });
  });
  const go = (q) => dash.setParams({q: String(q || '').slice(0, 200), qlim: 40});
  document.querySelectorAll('#rs-q').forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(inp.value); } }));
  document.querySelectorAll('#rs-askgo').forEach((b) => b.addEventListener('click', () => { const i = $('#rs-q'); go(i ? i.value : ''); }));
  document.querySelectorAll('.rs-chip[data-q]').forEach((b) => b.addEventListener('click', () => { const i = $('#rs-q'); if (i) i.value = b.textContent; go(b.getAttribute('data-q')); }));
  document.querySelectorAll('#rs-askclear').forEach((b) => b.addEventListener('click', () => { const i = $('#rs-q'); if (i) i.value = ''; dash.setParams({q: '', qcity: '', qwave: '', qkind: '', qlim: 40}); }));
  document.querySelectorAll('#rs-askmore').forEach((b) => b.addEventListener('click', () => dash.setParams({qlim: +(P().qlim || 40) + 40})));
  [['#rs-qcity', 'qcity'], ['#rs-qwave', 'qwave'], ['#rs-qkind', 'qkind']].forEach(([s, k]) => document.querySelectorAll(s).forEach((el) => el.addEventListener('change', () => dash.setParams({[k]: el.value, qlim: 40}))));
  dash.onData(() => {
    const p = P();
    [['#rs-qcity', 'qcity'], ['#rs-qwave', 'qwave'], ['#rs-qkind', 'qkind']].forEach(([s, k]) => document.querySelectorAll(s).forEach((el) => { if (document.activeElement !== el) el.value = p[k] || ''; }));
  });
})();
