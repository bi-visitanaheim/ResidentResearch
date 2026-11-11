import json,re,csv,collections,hashlib,sys
sys.path.insert(0,'.')
from frames import *
from frames2 import FR2
FR.update(FR2)
R=json.load(open('coded.json'))
FAM={ (q,lab):fam for q in FR for lab,fam,_ in FR[q] }
SHORT={q:Q[q]['short'] for q in Q}
CITY={q:Q[q]['city'] for q in Q}
# ---------- meta / themes ----------
meta=[];themes=[];quotes=[]
PII=re.compile(r"@|\d{5,}|https?:|www\.|\b(my|our) (business|bakery|shop|store|husband|wife|son|daughter|boss|employer|neighbor)\b|\bwe run\b|\bi own\b|\bi work (at|for)\b|\bmy name\b",re.I)
def clean(t):
    t=re.sub(r'\s+',' ',t).strip()
    t=re.sub(r"\b(\d{3})[-. ]?(\d{3})[-. ]?(\d{4})\b",'[number removed]',t)
    return t
FLAGLAB={}
def flag(n): return 'Suppressed (under 30)' if n<30 else ('Use caution (under 50)' if n<50 else '')
for q,m in Q.items():
    rows=[r for r in R if r['qid']==q]; n=len(rows)
    none_n=sum(r['none'] for r in rows); oth=sum((not r['themes']) and (not r['none']) for r in rows)
    meta.append(dict(qid=q,city=m['city'],wave=m['wave'],code=m['code'],wording=m['wording'],short=m['short'],asked=m['asked'],base_n=n,
        coded_n=n-oth-none_n,none_n=none_n,none_label=NONE_LABEL.get(q,''),other_n=oth,translated_n=sum(r['translated'] for r in rows),
        flag=flag(n),source=m['file_name']))
    cnt=collections.Counter(t for r in rows for t in r['themes'])
    order=sorted(cnt.items(),key=lambda x:(-x[1],x[0]))
    for rank,(t,c) in enumerate(order,1):
        themes.append(dict(qid=q,city=m['city'],wave=m['wave'],theme=t,family=FAM[(q,t)],count=c,base_n=n,pct=round(100*c/n),rank=rank,flag=flag(n),kind='theme'))
    if none_n and q in NONE_LABEL:
        themes.append(dict(qid=q,city=m['city'],wave=m['wave'],theme=NONE_LABEL[q],family=F_NONE,count=none_n,base_n=n,pct=round(100*none_n/n),rank=99,flag=flag(n),kind='none'))
    # quotes
    used=set()
    for t,c in order:
        cands=[r for r in rows if t in r['themes']]
        def score(r):
            L=len(r['text']); s=0
            if 45<=L<=210: s+=3
            elif 30<=L<=260: s+=1
            if r['text'][-1:] in '.!': s+=1
            if len(r['themes'])<=2: s+=2
            if r['translated']: s-=1
            return -s
        cands=[r for r in cands if not PII.search(r['text']) and len(r['text'])>=25 and len(r['text'])<=260]
        cands.sort(key=lambda r:(score(r),r['rec']))
        k=0
        for r in cands:
            if (q,r['rec']) in used and k>=1: continue
            if k>=4: break
            qid_=hashlib.md5(f"{q}|{r['rec']}".encode()).hexdigest()[:8]
            quotes.append(dict(quote_id=qid_,qid=q,theme=t,quote=clean(r['text']),translated='Y' if r['translated'] else 'N'))
            used.add((q,r['rec'])); k+=1
    if q in NONE_LABEL:
        pass
def w(path,rows,cols):
    with open(path,'w',newline='',encoding='utf-8') as f:
        cw=csv.DictWriter(f,fieldnames=cols); cw.writeheader(); [cw.writerow(r) for r in rows]
import os; os.makedirs('ds',exist_ok=True)
w('ds/voices_meta.csv',meta,list(meta[0]))
w('ds/voices_themes.csv',themes,list(themes[0]))
w('ds/voices_quotes.csv',quotes,list(quotes[0]))
# ---------- family x question ----------
fam_rows=[]
for q in Q:
    rows=[r for r in R if r['qid']==q]; n=len(rows)
    famsets=collections.defaultdict(set)
    for r in rows:
        for t in r['themes']: famsets[FAM[(q,t)]].add(r['rec'])
    for fam,s in famsets.items():
        fam_rows.append(dict(qid=q,city=Q[q]['city'],wave=Q[q]['wave'],family=fam,count=len(s),base_n=n,pct=round(100*len(s)/n),flag=flag(n)))
w('ds/voices_families.csv',fam_rows,list(fam_rows[0]))
print('meta',len(meta),'themes',len(themes),'quotes',len(quotes),'fam',len(fam_rows))
# quality summary
tot=sum(m['base_n'] for m in meta); oth=sum(m['other_n'] for m in meta)
print('answers',tot,'unclassified',oth, 'translated',sum(m['translated_n'] for m in meta))
