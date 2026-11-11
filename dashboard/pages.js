/* ===== One question per page: sub-pages, page strip and sticky page bar (OCVIBE pattern) ===== */
(function () {
  const SECS = ['overview', 'anaheim', 'gardengrove', 'both', 'every', 'decision', 'compare', 'methods', 'table', 'ask'];
  const NAME = {overview: 'Overview', anaheim: 'Anaheim', gardengrove: 'Garden Grove', both: 'Both cities', every: 'Every question', decision: 'Decision guide', compare: 'City comparison', methods: 'Methodology and notes', table: 'Data table', ask: 'Ask the data', detail: 'KPI summary'};
  const SUB = {};
  let scrollAll = false, sync = () => {};
  const subsOf = (id) => Array.from(document.querySelectorAll('#' + id + ' > .rs-sub'));
  const cur = () => { const p = Array.from(document.querySelectorAll('.rs-page')).find((x) => !x.hidden); return p ? p.id : 'overview'; };
  function apply(id) {
    const subs = subsOf(id); if (!subs.length) return;
    const i = Math.min(SUB[id] || 0, subs.length - 1);
    subs.forEach((s, k) => { const h = !scrollAll && k !== i; if (s.hidden !== h) s.hidden = h; });
    document.querySelectorAll('#' + id + ' .rs-subchip').forEach((c, k) => { c.classList.toggle('on', k === i); if (k === i) c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current'); });
    document.querySelectorAll('#' + id + ' > .rs-upnext').forEach((u) => { const h = !scrollAll && i < subs.length - 1; if (u.hidden !== h) u.hidden = h; });
  }
  const toTop = (id) => { const t = document.getElementById(id); if (t) requestAnimationFrame(() => t.scrollIntoView({block: 'start'})); };
  function go(id, i, scroll) { SUB[id] = i; apply(id); sync(); if (scroll) toTop(id); }
  function openSection(nid, i) { SUB[nid] = i; apply(nid); const t = document.querySelector('.rs-tabs [data-tab="' + nid + '"]'); if (t) t.click(); toTop(nid); }
  function target(d) {
    const id = cur(), subs = subsOf(id), i = SUB[id] || 0;
    if (id === 'detail') return null;
    if (!scrollAll && subs.length && i + d >= 0 && i + d < subs.length) return {id, i: i + d, label: (d > 0 ? 'Next: ' : 'Back: ') + subs[i + d].getAttribute('data-sub-title')};
    const ni = SECS.indexOf(id) + d; if (ni < 0 || ni >= SECS.length) return null;
    const nid = SECS[ni], n = subsOf(nid).length;
    return {id: nid, i: d < 0 && n ? n - 1 : 0, sec: true, label: (d > 0 ? 'Next section: ' : 'Back to ') + NAME[nid]};
  }
  function step(d) { const t = target(d); if (!t) return; if (t.sec) openSection(t.id, t.i); else go(t.id, t.i, true); }
  window.__rsSub = {all(id, on) { subsOf(id).forEach((s) => { if (on) s.hidden = false; }); if (!on) apply(id); }, apply};
  SECS.forEach(apply);
  document.querySelectorAll('.rs-subchip[data-subgo]').forEach((c) => c.addEventListener('click', () => {
    const el = document.getElementById(c.getAttribute('data-subgo')); if (!el) return;
    const sec = el.closest('.rs-page'); go(sec.id, subsOf(sec.id).indexOf(el), false);
  }));
  document.querySelectorAll('.rs-tabs [data-tab]').forEach((t) => t.addEventListener('click', () => { apply(t.getAttribute('data-tab')); sync(); }));
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => {
    const t = document.getElementById(b.getAttribute('data-target') || ''), w = t && t.closest('.rs-sub'), sec = t && t.closest('.rs-page');
    if (sec) { SUB[sec.id] = w ? subsOf(sec.id).indexOf(w) : 0; apply(sec.id); }
    sync();
  }));
  document.querySelectorAll('#detail-back, .rs-card, .rs-mini').forEach((b) => b.addEventListener('click', () => setTimeout(() => sync(), 0)));
  dash.draw('spbar', {
    mount(el) {
      const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
      const prev = mk('button', 'sp-b sp-prev'), next = mk('button', 'sp-b sp-next');
      prev.type = next.type = 'button';
      const mid = mk('div', 'sp-mid'), where = mk('span', 'sp-where'), dots = mk('span', 'sp-dots'), view = mk('span', 'sp-view');
      dots.setAttribute('aria-hidden', 'true');
      const one = mk('button', null, 'Page by page'), all = mk('button', null, 'Scroll all');
      one.type = all.type = 'button'; view.append(one, all); mid.append(where, dots, view);
      el.replaceChildren(prev, mid, next);
      prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1));
      one.addEventListener('click', () => { scrollAll = false; SECS.forEach(apply); sync(); });
      all.addEventListener('click', () => { scrollAll = true; SECS.forEach(apply); sync(); });
      sync = () => {
        const id = cur(), subs = subsOf(id), i = Math.min(SUB[id] || 0, Math.max(0, subs.length - 1));
        el.hidden = id === 'detail';
        const p = target(-1), n = target(1);
        prev.textContent = p ? '‹ ' + p.label : ''; prev.style.visibility = p ? 'visible' : 'hidden';
        next.textContent = n ? n.label + ' ›' : ''; next.style.visibility = n ? 'visible' : 'hidden';
        where.textContent = subs.length && !scrollAll ? NAME[id] + ' · page ' + (i + 1) + ' of ' + subs.length : NAME[id] || '';
        dots.replaceChildren(...(scrollAll ? [] : subs.map((_, k) => mk('i', k === i ? 'on' : (k < i ? 'done' : '')))));
        one.setAttribute('aria-pressed', String(!scrollAll)); all.setAttribute('aria-pressed', String(scrollAll));
      };
      sync();
      return {};
    },
    update() { sync(); }
  });
})();
