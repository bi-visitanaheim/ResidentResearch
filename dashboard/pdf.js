/* ===== PDF export: one section per PDF, or every section in one PDF ===== */
(function () {
  const ORDER = ['overview', 'anaheim', 'gardengrove', 'both', 'every', 'decision', 'compare', 'methods', 'table', 'ask'];
  const NAME = {overview: 'Overview', anaheim: 'Anaheim', gardengrove: 'Garden Grove', both: 'Both cities', every: 'Every question', decision: 'Decision guide', compare: 'City comparison', methods: 'Methodology and notes', table: 'Data table', ask: 'Ask the data', detail: 'KPI summary'};
  const PROPS = ['display', 'position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'min-width', 'min-height', 'max-width', 'box-sizing',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
    'background-color', 'background-image', 'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform',
    'text-decoration-line', 'white-space', 'word-break', 'overflow-wrap', 'vertical-align', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self',
    'row-gap', 'column-gap', 'flex-grow', 'flex-shrink', 'flex-basis', 'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
    'opacity', 'transform', 'transform-origin', 'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'font-variant-numeric', 'text-anchor',
    'dominant-baseline', 'visibility', 'list-style-type', 'border-collapse', 'border-spacing', 'table-layout', 'box-shadow', 'object-fit', 'text-overflow', 'overflow-x', 'overflow-y'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  let downloads;
  const dlReady = (async () => { try { downloads = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null; } catch (e) { downloads = null; } })();

  function cloneStyled(src) {
    if (src.nodeType === 3) return src.cloneNode(false);
    if (src.nodeType !== 1) return null;
    if (src.hasAttribute('data-pdf-skip') || src.hidden) return null;
    const cs = getComputedStyle(src);
    if (cs.display === 'none') return null;
    const tag = src.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return null;
    if (tag === 'canvas') { const img = document.createElement('img'); try { img.src = src.toDataURL(); } catch (e) { return null; } img.setAttribute('style', 'width:' + cs.width + ';height:' + cs.height); return img; }
    let c;
    if (tag === 'input' || tag === 'textarea') { c = document.createElement('span'); c.textContent = src.value || src.placeholder || ''; }
    else if (tag === 'select') { c = document.createElement('span'); c.textContent = src.selectedOptions && src.selectedOptions[0] ? src.selectedOptions[0].textContent : ''; }
    else c = src.cloneNode(false);
    ['id', 'data-draw', 'role', 'tabindex'].forEach((a) => c.removeAttribute && c.removeAttribute(a));
    let s = '';
    for (const p of PROPS) { const v = cs.getPropertyValue(p); if (v) s += p + ':' + v + ';'; }
    if (/^(auto|scroll)$/.test(cs.overflowX)) s += 'overflow:visible;width:auto;';
    s += 'animation:none;transition:none;';
    c.setAttribute('style', s);
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') for (const k of src.childNodes) { const kc = cloneStyled(k); if (kc) c.appendChild(kc); }
    return c;
  }
  function breakPoints(sec) {
    const top = sec.getBoundingClientRect().top, ys = new Set([0]);
    sec.querySelectorAll(':scope > *, :scope > * > *, .rs-tbl tr, .rs-card, li').forEach((e) => { const r = e.getBoundingClientRect(); if (r.height) ys.add(Math.round(r.top - top)); });
    return Array.from(ys).sort((a, b) => a - b);
  }
  async function render(sec) {
    const root = sec.closest('.rs');
    root.classList.add('rs-pdf'); await frames();
    try {
      const w = Math.ceil(sec.getBoundingClientRect().width), h = Math.ceil(sec.scrollHeight);
      const bps = breakPoints(sec);
      const clone = cloneStyled(sec); clone.style.margin = '0'; clone.style.background = '#FFFFFF';
      const wrap = document.createElement('div'); wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml'); wrap.setAttribute('style', 'width:' + w + 'px;background:#FFFFFF;'); wrap.appendChild(clone);
      const xml = new XMLSerializer().serializeToString(wrap);
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><foreignObject x="0" y="0" width="100%" height="100%">' + xml + '</foreignObject></svg>';
      const img = new Image();
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('render')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
      const scale = Math.max(1, Math.min(2, 14000 / h));
      const cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
      const g = cv.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
      cv.toDataURL('image/jpeg', 0.1);
      return {cv, w, h, scale, bps};
    } finally { root.classList.remove('rs-pdf'); }
  }
  /* page slicing: US Letter portrait, 0.5in margins, header + footer */
  const PW = 612, PH = 792, M = 36, HEAD = 30, FOOT = 22;
  async function slices(shot) {
    const k = (PW - 2 * M) / shot.w, room = (PH - 2 * M - HEAD - FOOT) / k, out = [];
    let y = 0;
    while (y < shot.h - 2) {
      let end = Math.min(shot.h, y + room);
      if (end < shot.h) { const c = shot.bps.filter((b) => b > y + room * 0.45 && b <= y + room); if (c.length) end = c[c.length - 1]; }
      const sh = end - y, c = document.createElement('canvas');
      c.width = Math.round(shot.w * shot.scale); c.height = Math.max(1, Math.round(sh * shot.scale));
      const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(shot.cv, 0, Math.round(y * shot.scale), c.width, c.height, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
      out.push({jpg: new Uint8Array(await blob.arrayBuffer()), pw: c.width, ph: c.height, dw: PW - 2 * M, dh: sh * k});
      y = end;
    }
    return out;
  }
  const asc = (s) => String(s).replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/·/g, '-').replace(/[^\x20-\x7E]/g, '').replace(/([()\\])/g, '\\$1');
  function buildPdf(pages) {
    const enc = new TextEncoder(), parts = [], offs = [];
    let len = 0; const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const objs = []; const obj = (body) => { objs.push(body); return objs.length; };
    const font = obj(['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>']);
    const fontB = obj(['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']);
    const pagesId = objs.length + 1; objs.push(null);
    const kids = [];
    pages.forEach((p, i) => {
      const im = obj(['<< /Type /XObject /Subtype /Image /Width ' + p.pw + ' /Height ' + p.ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpg.length + ' >>\nstream\n', p.jpg, '\nendstream']);
      const top = PH - M - HEAD;
      const cs = 'q 0.07 0.36 0.38 rg ' + M + ' ' + (PH - M - 4) + ' ' + (PW - 2 * M) + ' 4 re f Q\n' +
        'BT /F2 10 Tf 0.07 0.36 0.38 rg ' + M + ' ' + (PH - M - 18) + ' Td (' + asc('Visit Anaheim | Resident Sentiment Tracker | ' + p.section) + ') Tj ET\n' +
        'BT /F1 8 Tf 0.3 0.3 0.3 rg ' + (PW - M - 150) + ' ' + (PH - M - 18) + ' Td (' + asc(p.stamp) + ') Tj ET\n' +
        'q ' + p.dw.toFixed(2) + ' 0 0 ' + p.dh.toFixed(2) + ' ' + M + ' ' + (top - p.dh).toFixed(2) + ' cm /Im' + i + ' Do Q\n' +
        'BT /F1 7.5 Tf 0.35 0.35 0.35 rg ' + M + ' ' + (M - 4) + ' Td (' + asc('Visit Anaheim Business Intelligence. Sources: vendor reports, crosstabs and survey data, pulled Nov 10, 2026. Internal use.') + ') Tj ET\n' +
        'BT /F1 7.5 Tf 0.35 0.35 0.35 rg ' + (PW - M - 40) + ' ' + (M - 4) + ' Td (' + asc('Page ' + (i + 1) + ' of ' + pages.length) + ') Tj ET\n';
      const cst = obj(['<< /Length ' + enc.encode(cs).length + ' >>\nstream\n' + cs + 'endstream']);
      kids.push(obj(['<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /Font << /F1 ' + font + ' 0 R /F2 ' + fontB + ' 0 R >> /XObject << /Im' + i + ' ' + im + ' 0 R >> >> /Contents ' + cst + ' 0 R >>']));
    });
    objs[pagesId - 1] = ['<< /Type /Pages /Kids [' + kids.map((k) => k + ' 0 R').join(' ') + '] /Count ' + kids.length + ' >>'];
    const cat = obj(['<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>']);
    const info = obj(['<< /Title (' + asc('Resident Sentiment Tracker') + ') /Producer (Visit Anaheim BI) >>']);
    put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    objs.forEach((body, i) => { offs[i] = len; put((i + 1) + ' 0 obj\n'); body.forEach(put); put('\nendobj\n'); });
    const xref = len;
    put('xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    put('trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + cat + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, {type: 'application/pdf'});
  }
  const stampText = () => 'Exported ' + new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  const tabFor = (id) => document.querySelector('.rs-tabs [data-tab="' + id + '"]');
  const current = () => { const p = Array.from(document.querySelectorAll('.rs-page')).find((x) => !x.hidden); return p ? p.id : 'overview'; };
  async function save(blob, name, say) {
    await dlReady;
    if (!downloads) throw {code: 'unavailable'};
    try { await downloads.save({filename: name, data: blob}); say('Saved ' + name + '.'); }
    catch (e) { if (e && e.code === 'declined') say('Download cancelled.'); else throw e; }
  }
  function printFallback(sec, say) {
    sec.classList.add('rs-print');
    say('Opening your print window. Choose "Save as PDF". If nothing opens, press Ctrl+P (Cmd+P on Mac).');
    try { window.print(); } catch (e) { /* print blocked */ }
    setTimeout(() => sec.classList.remove('rs-print'), 1500);
  }
  let busy = false;
  async function exportSections(ids, say, setBusy) {
    if (busy) return; busy = true; setBusy(true);
    const back = current(), pages = [], stamp = stampText();
    window.__rsNoMotion = true;
    try {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        say('Preparing ' + NAME[id] + (ids.length > 1 ? ' (' + (i + 1) + ' of ' + ids.length + ')' : '') + '…');
        if (current() !== id) { const t = tabFor(id); if (t) t.click(); await sleep(1400); }
        await frames();
        const sec = document.getElementById(id);
        if (window.__rsSub) { window.__rsSub.all(id, true); await sleep(1200); await frames(); }
        let shot; try { shot = await render(sec); } finally { if (window.__rsSub) window.__rsSub.all(id, false); }
        (await slices(shot)).forEach((p) => pages.push(Object.assign(p, {section: NAME[id] || id, stamp})));
      }
      const name = ids.length > 1 ? 'Resident Sentiment Tracker - All sections.pdf' : 'Resident Sentiment Tracker - ' + (NAME[ids[0]] || ids[0]) + '.pdf';
      say('Building PDF (' + pages.length + ' page' + (pages.length === 1 ? '' : 's') + ')…');
      await save(buildPdf(pages), name, say);
    } catch (e) {
      const sec = document.getElementById(ids.length === 1 ? ids[0] : back);
      if (current() !== back) { const t = tabFor(back); if (t) t.click(); }
      printFallback(sec || document.getElementById(back), say);
    } finally {
      window.__rsNoMotion = false;
      if (current() !== back && back !== 'detail') { const t = tabFor(back); if (t) t.click(); }
      busy = false; setBusy(false);
    }
  }
  const wired = new WeakSet();
  dash.draw('pdfstat', {
    mount(el) {
      const bar = el.parentElement; if (!bar || wired.has(bar)) return {};
      wired.add(bar);
      const say = (t) => document.querySelectorAll('[data-draw="pdfstat"]').forEach((s) => { s.textContent = t; });
      const btns = bar.querySelectorAll('[data-pdf]');
      const setBusy = (b) => document.querySelectorAll('.rs-pdfbtn').forEach((x) => { x.disabled = b; });
      btns.forEach((b) => b.addEventListener('click', () => {
        const all = b.getAttribute('data-pdf') === 'all';
        exportSections(all ? ORDER : [current()], say, setBusy);
      }));
      el.textContent = '';
      return {};
    },
    update() {}
  });
})();
