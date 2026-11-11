/* Standalone runtime for the Resident Sentiment Tracker (stands in for the Claude dashboard runtime). */
(function () {
  const draws = {}, mounted = new WeakMap(), onDatas = [], calcs = {}, errors = [];
  const DEF = {dcity: 'Anaheim', dkpi: 'va_aware', ecity: 'Anaheim', eq: 'offerings', kpi: 'va_aware', tcity: 'all', tkpi: 'all', q: '', qcity: '', qwave: '', qkind: '', qlim: 40};
  let params = Object.assign({}, DEF);
  const D = window.__DATA__ || {};
  function data(id) {
    if (calcs[id]) { const c = calcs[id], ins = c.inputs.map(data); if (ins.some((x) => x.status !== 'ok')) return {status: 'loading', data: null}; return {status: 'ok', data: c.fn(...ins.map((x) => x.data))}; }
    const rows = D[id]; return rows ? {status: 'ok', data: rows, columns: rows.length ? Object.keys(rows[0]) : []} : {status: 'missing', data: []};
  }
  let pending = false;
  function runAll() {
    onDatas.forEach((f) => { try { f(); } catch (e) { errors.push(e); console.error(e); } });
    Object.entries(draws).forEach(([name, fn]) => document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
      if (el.closest('[hidden]')) return;
      try {
        if (typeof fn === 'object') { if (!mounted.has(el)) mounted.set(el, fn.mount ? fn.mount(el) : {}); if (fn.update) fn.update(el, mounted.get(el)); }
        else fn(el);
      } catch (e) { errors.push(e); console.error(name, e); }
    }));
  }
  const schedule = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; runAll(); }); };
  window.dash = {
    data, colors: ['#125C60', '#43A3A3', '#77C7C9', '#B4D9E3'],
    draw(name, fn) { if (fn === undefined) { schedule(); return; } draws[name] = fn; },
    calc(id, o) { calcs[id] = o; }, loader() {},
    onData(fn) { onDatas.push(fn); },
    params() { return Object.assign({}, params); },
    setParams(o) { Object.assign(params, o); runAll(); },
    resetParams() { params = Object.assign({}, DEF); runAll(); },
    setLink(id) { try { history.replaceState(null, '', '#' + id); } catch (e) {} },
    refresh() {}
  };
  if (matchMedia('(prefers-color-scheme: dark)').matches) dash.colors = ['#B4D9E3', '#43A3A3', '#77C7C9', '#FFAC62'];
  /* PDF downloads: save straight to the browser */
  window.claude = {use: async (n) => n === 'downloads' ? {save: async ({filename, data}) => { const u = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }} : null};
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(schedule).observe(document.getElementById('dash-root'), {attributes: true, subtree: true, attributeFilter: ['hidden']});
    let w = innerWidth; addEventListener('resize', () => { if (innerWidth !== w) { w = innerWidth; schedule(); } });
    runAll();
  });
})();
