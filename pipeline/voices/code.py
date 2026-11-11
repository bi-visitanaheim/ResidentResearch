import csv,re,json,sys
sys.path.insert(0,'.')
from frames import *
from frames2 import FR2, NONE_RE2
FR.update(FR2); NONE_RE.update(NONE_RE2)
from translations import TR
csv.field_size_limit(10**9)
from python_calamine import CalamineWorkbook
_wb={}
def load(f,col):
    p='/home/claude/src/'+('ana_w4_data.xlsx' if f.startswith('ana') else 'gg_w2_data.xlsx')
    if p not in _wb: _wb[p]=CalamineWorkbook.from_path(p).get_sheet_by_name('A1').to_python()
    r=_wb[p]; i=r[0].index(col)
    return [(str(int(x[0])),str(x[i]).strip()) for x in r[1:] if str(x[i]).strip()]
def norm(t): return t.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"').replace('–','-')
OVR = json.load(open('overrides.json')) if __import__('os').path.exists('overrides.json') else {}
rows=[]
for q,m in Q.items():
    for rec,raw in load(m['file'],m['col']):
        eng=TR.get((q,rec)); text=norm(eng or raw); low=text.lower()
        themes=[]
        for lab,fam,rx in FR[q]:
            if re.search(rx,low): themes.append(lab)
        none=False
        if q in NONE_RE and re.search(NONE_RE[q],low):
            none=True
        key=f'{q}|{rec}'
        if key in OVR:
            themes=OVR[key].get('themes',themes); none=OVR[key].get('none',False)
        if none and q in ('GG-A4','GG-C3a','GG-D3','GG-B9','ANA-C4'):
            # "none" only stands alone if no concrete theme found, except when explicit override
            if themes and key not in OVR: none=False
        rows.append(dict(qid=q,rec=rec,text=text,raw=raw,translated=bool(eng),themes=themes,none=none))
json.dump(rows,open('coded.json','w'),ensure_ascii=False)
import collections
for q in Q:
    R=[r for r in rows if r['qid']==q]; n=len(R)
    oth=[r for r in R if not r['themes'] and not r['none']]
    print(f'== {q} n={n} other={len(oth)} ({100*len(oth)//max(n,1)}%) none={sum(r["none"] for r in R)}')
    c=collections.Counter(t for r in R for t in r['themes'])
    for t,k in c.most_common(): print('   ',k,t)
