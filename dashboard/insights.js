/* ===== Every question summaries: views that go together and opportunities, from the data ===== */
(function () {
  const enc = (s) => encodeURIComponent(String(s));
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); }
    for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k instanceof Node ? k : document.createTextNode(String(k))); }
    return e;
  }
  function fill(r) {
    const out = [], re = /\{([vn])(\d)\}/g; let i = 0, m;
    while ((m = re.exec(r.detail))) { if (m.index > i) out.push(r.detail.slice(i, m.index)); const f = m[1] + m[2]; out.push(h('span', {'data-source': 'insights', 'data-field': f, 'data-where': 'ins_id=' + enc(r.ins_id)}, r[f])); i = re.lastIndex; }
    if (i < r.detail.length) out.push(r.detail.slice(i)); return out;
  }
  const plain = (r) => r.detail.replace(/\{([vn]\d)\}/g, (_, f) => r[f]);
  function pairChart(r) {
    const pairs = [[r.v1, r.v2, r.scope === 'All' ? 'Anaheim' : '']]; if (r.scope === 'All' && r.v3 !== '') pairs.push([r.v3, r.v4, 'Garden Grove']);
    const Wd = 260, rowH = 20, top = pairs[0][2] ? 16 : 0, blk = top + rowH * 2 + 8, H = pairs.length * blk + 2, x = d3.scaleLinear([0, 100], [104, Wd - 36]);
    const svg = d3.create('svg').attr('width', Wd).attr('height', H).attr('role', 'img').attr('aria-label', plain(r));
    pairs.forEach(([a, b, c], i) => {
      const y0 = i * blk;
      if (c) svg.append('text').attr('x', 0).attr('y', y0 + 12).style('font-size', '12px').style('font-weight', 700).style('fill', 'var(--color-fg)').text(c);
      [[a, 'Those who do', true], [b, 'Those who don\u2019t', false]].forEach(([v, lab, yes], k) => {
        const y = y0 + top + k * rowH;
        svg.append('text').attr('x', 100).attr('y', y + 14).attr('text-anchor', 'end').attr('class', 'rs-axis').style('font-size', '11px').text(lab);
        svg.append('rect').attr('x', 104).attr('y', y + 4).attr('height', 13).attr('width', x(100) - 104).style('fill', 'var(--cds-chart-grid)');
        svg.append('rect').attr('x', 104).attr('y', y + 4).attr('height', 13).attr('width', x(+v) - 104).style('fill', yes ? '#125C60' : 'var(--cds-chart-muted)');
        svg.append('text').attr('x', x(+v) + 4).attr('y', y + 15).attr('class', 'rs-vlab').style('font-size', '11px').text(v + '%');
      });
    });
    return svg.node();
  }
  dash.draw('ins', (host) => {
    const d = dash.data('insights'); if (d.status !== 'ok') { host.replaceChildren(); if (d.status === 'error' || d.status === 'missing') host.append(h('p', {class: 'rs-fail'}, 'Failed to load')); return; }
    const scope = host.getAttribute('data-scope'), kind = host.getAttribute('data-kind');
    const rows = d.data.filter((r) => r.scope === scope && r.kind === kind).sort((a, b) => +a.rank - +b.rank);
    host.replaceChildren(h('div', {class: 'rs-ins'}, ...rows.map((r) => {
      const card = h('button', {type: 'button', class: 'rs-insc' + (kind === 'Opportunity' ? ' opp' : ''), id: 'ins-' + r.ins_id.replace(/[^A-Za-z0-9]+/g, '-')},
        h('span', {class: 'k'}, kind === 'Opportunity' ? 'The data findings suggest' : 'Views that go together'), h('h4', null, r.headline), h('p', null, ...fill(r)),
        kind === 'Linked views' ? pairChart(r) : null, h('p', {class: 'rs-cap'}, 'Source: ' + r.source));
      card.addEventListener('click', (ev) => {
        host.querySelectorAll('.rs-insc.sel').forEach((c) => c.classList.remove('sel')); card.classList.add('sel');
        window.__rsXP(host, ev, [r.headline, plain(r), kind === 'Linked views' ? 'These views go together in the same residents’ answers. That does not show that one causes the other (Formula F6).' : 'An opportunity the numbers point to; confirm cost and timing before acting.', 'Source: ' + r.source], null, {kicker: 'Selected finding'});
      });
      return card;
    })));
  });
})();
