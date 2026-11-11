/* ===== Side menu (OC Vibe Impact pattern): sections with their pages, current page marked ===== */
(function () {
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  let syncFn = () => {};
  dash.draw('side', {
    mount(host) {
      const narrow = () => (host.ownerDocument.defaultView || window).matchMedia('(max-width:900px)').matches;
      const tabs = Array.from(document.querySelectorAll('.rs-tabs [data-tab]'));
      const head = mk('div', 'rs-side-h'); const ttl = mk('span', null, 'Jump to');
      const detail = mk('button', null, 'Hide pages'); detail.type = 'button';
      const close = mk('button', null, '‹ Close'); close.type = 'button'; close.setAttribute('aria-label', 'Close the menu');
      head.append(ttl, detail, close);
      const nav = mk('nav'); nav.setAttribute('aria-label', 'All sections and pages'); const ul = mk('ul'); nav.append(ul);
      const open = mk('button', 'rs-sidetog', 'Menu ›'); open.type = 'button'; open.setAttribute('aria-label', 'Open the section menu');
      const items = [];
      tabs.forEach((t) => {
        const id = t.getAttribute('data-tab'), li = mk('li');
        const top = mk('button', 'top', t.textContent.trim()); top.type = 'button';
        top.addEventListener('click', () => { t.click(); if (narrow()) setOpen(false); });
        const subs = mk('div', 'subs');
        Array.from(document.querySelectorAll('#' + id + ' > .rs-subnav .rs-subchip')).forEach((c, k) => {
          const b = mk('button', 'sub', (k + 1) + '. ' + c.textContent.trim()); b.type = 'button';
          b.addEventListener('click', () => { t.click(); c.click(); const s = document.getElementById(c.getAttribute('data-subgo')); if (s) requestAnimationFrame(() => s.scrollIntoView({block: 'start'})); if (narrow()) setOpen(false); });
          subs.append(b); items.push({b, id, chip: c});
        });
        li.append(top); if (subs.children.length) li.append(subs);
        ul.append(li); items.push({b: top, id, top: true});
      });
      host.replaceChildren(head, nav, open);
      let compact = false;
      detail.addEventListener('click', () => { compact = !compact; host.classList.toggle('compact', compact); detail.textContent = compact ? 'Show pages' : 'Hide pages'; });
      function setOpen(on) { host.classList.toggle('mini', !on); open.hidden = on; head.hidden = !on; nav.hidden = !on; open.setAttribute('aria-expanded', String(on)); }
      close.addEventListener('click', () => setOpen(false)); open.addEventListener('click', () => setOpen(true));
      setOpen(!narrow());
      const sync = () => {
        const p = Array.from(document.querySelectorAll('.rs-page')).find((x) => !x.hidden), cur = p ? p.id : '';
        items.forEach((it) => {
          const on = it.top ? it.id === cur : (it.id === cur && it.chip.classList.contains('on'));
          if (it.b.getAttribute('aria-current') !== String(on)) it.b.setAttribute('aria-current', String(on));
        });
      };
      const root = document.querySelector('.rs') || document;
      root.addEventListener('click', () => requestAnimationFrame(sync));
      sync(); syncFn = sync;
      return {};
    },
    update() { syncFn(); }
  });
})();
