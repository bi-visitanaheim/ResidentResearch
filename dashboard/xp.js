/* ===== Click to explain: any chart mark shows the selected data point in words, under its chart ===== */
(function () {
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function linesFrom(host, tgt) {
    const tip = host.querySelector('.rs-tip');
    let ls = tip && tip.children.length ? Array.from(tip.children).map((c) => c.textContent).filter((t) => t && !/^Click/.test(t)) : [];
    if (!ls.length && tgt && tgt.closest) { const a = tgt.closest('[aria-label]'); if (a) ls = [a.getAttribute('aria-label')]; }
    return ls;
  }
  window.__rsXP = function (host, ev, lines, nav, opts) {
    if (!host) return;
    const tgt = ev && ev.currentTarget;
    const ls = (lines && lines.length) ? lines : linesFrom(host, tgt);
    host.querySelectorAll('.rs-hit').forEach((e) => e.classList.remove('rs-hit'));
    let m = tgt;
    if (m && m.style && m.style.fill === 'transparent') { const g = m.parentNode; m = g && g.tagName && g.tagName.toLowerCase() === 'g' ? g.querySelector('circle,rect,path') : null; }
    if (m && typeof SVGElement !== 'undefined' && m instanceof SVGElement && m.tagName.toLowerCase() !== 'svg') m.classList.add('rs-hit');
    host.classList.add('rs-hl');
    let p = host.querySelector(':scope > .rs-xp');
    if (!p) { p = mk('div', 'rs-xp'); p.setAttribute('role', 'status'); p.setAttribute('aria-live', 'polite'); host.append(p); }
    const t = mk('div', 't');
    ls.forEach((l, i) => t.append(i === 0 ? mk('b', null, l) : mk('span', null, l)));
    const b = mk('div', 'b');
    if (nav) { const go = mk('button', null, (opts && opts.navLabel) || 'Open full summary →'); go.type = 'button'; go.addEventListener('click', nav); b.append(go); }
    const x = mk('button', 'x', 'Clear'); x.type = 'button';
    x.addEventListener('click', () => { host.querySelectorAll('.rs-hit').forEach((e) => e.classList.remove('rs-hit')); host.classList.remove('rs-hl'); p.remove(); });
    b.append(x);
    p.replaceChildren(mk('span', 'k', (opts && opts.kicker) || 'Selected data point'), t, b);
  };
})();
