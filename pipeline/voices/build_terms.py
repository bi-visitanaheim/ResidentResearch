import json,re,csv,collections,sys
sys.path.insert(0,'.')
from frames import *
from frames2 import FR2
FR.update(FR2)
FAM={(q,lab):fam for q in FR for lab,fam,_ in FR[q]}
R=json.load(open('coded.json'))
exec(open('terms_explore.py').read().split('docs=[]')[0])  # STOP, DOMAIN, toks, lem
STOP|=set("""options easier brings bring brought creates create created helps help helped supports support supported keep keeps find found without now enough far due receive received sure plenty strong advantage current already different working hours easy nearby consider positive open less lower close more most much give gives giving provide provides providing offer offered offers allow allows increase increased increases also feel feeling makes making seems actually simply quite pretty around within like liked kind sort part whole every certain overall general generally especially various several lots alot okay fine good great nice better best decent average plenty would could should might really very able want wanted wants etc way able visiting visited new near busy work field experience industry comfortable management free stable travel""".split())
GENBI=set("tourism brings|tourism creates|tourism supports|supports local|giving residents|creates local|bring money|term afford|different places|located near|nearby cities|tourism industry|change career|current job".split('|'))
DISPLAY={'job':'jobs','event':'events','business':'businesses','restaurant':'restaurants','shop':'shops','discount':'discounts','attraction':'attractions','park':'parks','afford':'affordability','congest':'congestion','crowd':'crowds','friend':'friendly people','diversity':'diversity','convenience':'convenience','welcome':'welcoming','safety':'safety','opportunity':'opportunities','activity':'activities','amenity':'amenities','neighborhood':'neighborhoods','ticket':'tickets','festival':'festivals','road':'roads','school':'schools','culture':'culture','cost':'cost','price':'prices','tax':'taxes','career':'careers','expense':'expense','spots':'local spots','local business':'local businesses','local event':'local events','local shop':'local shops','local restaurant':'local restaurants','local job':'local jobs','local attraction':'local attractions','job opportunity':'job opportunities','food options':'food options','theme park':'theme parks','housing cost':'housing costs','discount ticket':'discount tickets','traffic congest':'traffic congestion','public spaces':'public spaces','event updates':'event updates','parking options':'parking options','rush hour':'rush hour','rush hours':'rush hour','weekend event':'weekend events','upcoming event':'upcoming events','community event':'community events','public transportation':'public transportation','public transit':'public transit','freeway access':'freeway access','grocery stores':'grocery stores','limited parking':'limited parking','lower utility':'lower utility bills','city services':'city services','career growth':'career growth','tax revenue':'tax revenue','local economy':'local economy','dining options':'dining options','entertainment options':'entertainment options','chemical leak':'chemical leak','daily life':'daily life','working hours':'working hours','public facilities':'public facilities','traffic management':'traffic management','central location':'central location','economic growth':'economic growth','public services':'public services','safety measures':'safety measures','housing options':'housing options','amusement park':'amusement parks','disneyland ticket':'Disneyland tickets','disneyland':'Disneyland'}
MERGE={'rush hours':'rush hour','weekends':'weekend','weekend event':'weekend event'}
def terms_of(text):
    ws=[lem(w) for w in toks(text)]
    u=set(w for w in ws if w not in STOP and w not in DOMAIN and len(w)>2)
    b=set()
    for a,c in zip(ws,ws[1:]):
        if a in STOP or c in STOP: continue
        if (a in DOMAIN and c in DOMAIN): continue
        if len(a)>2 and len(c)>2:
            t=MERGE.get(a+' '+c,a+' '+c)
            if t not in GENBI: b.add(t)
    u={MERGE.get(x,x) for x in u}
    return u|b, ws
docs=[]
for r in R:
    ts,ws=terms_of(r['text'])
    docs.append(dict(r=r,terms=ts,city=Q[r['qid']]['city']))
df=collections.Counter(t for d in docs for t in d['terms'])
resp=collections.defaultdict(set)
for d in docs:
    for t in d['terms']: resp[t].add((d['city'],d['r']['rec']))
cand=[t for t,c in df.items() if len(resp[t])>=4]
# bigrams need 3+ and must be "content" (both words not generic adjectives)
uni=[t for t in cand if ' ' not in t]; bis=[t for t in cand if ' ' in t and len(resp[t])>=3]
# subsumption: drop unigram mostly explained by one bigram
drop=set()
for b in bis:
    for part in b.split():
        if part in resp and len(resp[b])>=0.7*len(resp[part]): drop.add(part)
# drop bigrams that are just generic pairs (like 'local' + generic)
LOW=set("local public different".split())
sel=[t for t in uni if t not in drop and t not in ('local','public','nearby','daily','life')]+[t for t in bis if not all(p in LOW for p in t.split())]
sel=sorted(sel,key=lambda t:-len(resp[t]))[:60]
BASE={'Anaheim':len({d['r']['rec'] for d in docs if d['city']=='Anaheim'}),'Garden Grove':len({d['r']['rec'] for d in docs if d['city']=='Garden Grove'})}
def mark(text,term):
    parts=term.split(); words=list(re.finditer(r"[A-Za-z][A-Za-z'\-]+",text))
    lw=[lem(m.group(0).lower().replace('’',"'")) for m in words]
    lw=[MERGE.get(x,x) for x in lw]
    out=text
    spans=[]
    for i in range(len(lw)):
        if len(parts)==1 and lw[i]==parts[0]: spans.append((words[i].start(),words[i].end()))
        elif len(parts)==2 and i+1<len(lw) and MERGE.get(lw[i]+' '+lw[i+1],lw[i]+' '+lw[i+1])==term: spans.append((words[i].start(),words[i+1].end()))
    for s,e in reversed(spans): out=out[:s]+'[['+out[s:e]+']]'+out[e:]
    return out, bool(spans)
quotes={(q['qid'],q['quote']) for q in csv.DictReader(open('ds/voices_quotes.csv'))}
PII=re.compile(r"@|\d{5,}|\b(my|our) (business|bakery|shop|store|husband|wife|son|daughter|boss|employer)\b|\bwe run\b|\bi own\b|\bi work (at|for)\b",re.I)
rows=[]
for t in sel:
    dd=[d for d in docs if t in d['terms']]
    famc=collections.Counter(FAM[(d['r']['qid'],th)] for d in dd for th in d['r']['themes'])
    fam=famc.most_common(1)[0][0] if famc else 'Other'
    for city in ['Anaheim','Garden Grove']:
        cd=[d for d in dd if d['city']==city]
        if not cd: continue
        nres=len({d['r']['rec'] for d in cd})
        qs=collections.Counter(d['r']['qid'] for d in cd)
        co=collections.Counter(x for d in cd for x in d['terms'] if x in sel and x!=t and x not in t.split() and t not in x.split())
        withs=[f"{DISPLAY.get(x,x)}:{n}" for x,n in co.most_common(6) if n>=2][:3]
        ex=[]
        cands=sorted(cd,key=lambda d:(abs(len(d['r']['text'])-110),d['r']['rec']))
        for d in cands:
            if PII.search(d['r']['text']) or len(d['r']['text'])>240 or len(d['r']['text'])<20: continue
            m,ok=mark(d['r']['text'],t)
            if ok: ex.append((d['r']['qid'],m,d['r']['translated']))
            if len(ex)==3: break
        row=dict(term_id=t.replace(' ','_')+'|'+city,term=DISPLAY.get(t,t),key=t,family=fam,city=city,respondents=nres,base_n=BASE[city],pct=round(100*nres/BASE[city]),
                 questions='|'.join(f"{q}:{n}" for q,n in qs.most_common()),appears_with='|'.join(withs))
        for i in range(3):
            row[f'ex{i+1}']=ex[i][1] if i<len(ex) else ''; row[f'ex{i+1}_q']=ex[i][0] if i<len(ex) else ''; row[f'ex{i+1}_tr']=('Y' if ex[i][2] else 'N') if i<len(ex) else ''
        rows.append(row)
with open('ds/voices_terms.csv','w',newline='',encoding='utf-8') as f:
    cw=csv.DictWriter(f,fieldnames=list(rows[0])); cw.writeheader(); [cw.writerow(r) for r in rows]
print(len(sel),len(rows),BASE)
print([ (DISPLAY.get(t,t),len(resp[t])) for t in sel])
