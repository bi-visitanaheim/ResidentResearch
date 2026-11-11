import csv,sqlite3,json,re,collections,sys
sys.path.insert(0,'/home/claude/voices')
OUT='/home/claude/build/ds'; import os; os.makedirs(OUT,exist_ok=True)
def w(name,rows):
    with open(f'{OUT}/{name}.csv','w',newline='',encoding='utf-8') as f:
        cw=csv.DictWriter(f,fieldnames=list(rows[0])); cw.writeheader(); [cw.writerow(r) for r in rows]
    print(name,len(rows))
K=list(csv.DictReader(open('/home/claude/out/ds/kpis.csv')))
def kv(wave,kpi):
    for r in K:
        if r['wave_id']==wave and r['kpi_id']==kpi and r['segment']=='Total': return r
# ---------- links (linked views, both groups 30+) ----------
c=sqlite3.connect('/home/claude/repo/out/resident_sentiment.db')
L=[]
for i,r in enumerate(c.execute("select city,wave_id,outcome_kpi,outcome,driver_kpi,driver,outcome_pct_if_driver_yes,n_yes,outcome_pct_if_driver_no,n_no,gap_pts,source from relationships where n_yes>=30 and n_no>=30 order by city, gap_pts+0 desc")):
    city,wave,ok,o,dk,d,py,ny,pn,nn,gap,src=r
    L.append(dict(link_id=f'{wave}|{dk}|{ok}',city=city,wave_id=wave,driver_kpi=dk,driver=d,outcome_kpi=ok,outcome=o,pct_if_yes=round(float(py)),n_yes=int(ny),pct_if_no=round(float(pn)),n_no=int(nn),gap_pts=round(float(py))-round(float(pn)),source=src.split(' (')[0]+' (BI tabulation of the survey file, aggregate only)'))
w('links',L)
# ---------- city comparison: data only ----------
C=list(csv.DictReader(open('/home/claude/out/ds/city_compare.csv')))
seen=set(); C2=[]
for r in C:
    if r['kpi_id'] in seen: continue
    seen.add(r['kpi_id'])
    C2.append(dict(kpi_id=r['kpi_id'],kpi=r['kpi'],kpi_order=r['kpi_order'],anaheim_w4_pct=r['anaheim_w4_pct'],anaheim_w4_n=r['anaheim_w4_n'],garden_grove_w2_pct=r['garden_grove_w2_pct'],garden_grove_w2_n=r['garden_grove_w2_n'],gap_pts=int(r['garden_grove_w2_pct'])-int(r['anaheim_w4_pct']),wording_match=r['wording_match'],base_definition=r['base_definition'],source=r['source']))
w('city_compare2',C2)
# ---------- not compared: show each city's own data ----------
NC=[]
lab={'ben_aware':'Aware of resident benefits from tourism','tax':'Understand the tax benefits of tourism','informed':'Feel well-informed about future developments'}
why={'ben_aware':'Asked in Anaheim only.','tax':'Asked in Anaheim only.','informed':'Wording differs: Anaheim W4 asks about OCVIBE\'s opening and offerings; Garden Grove asks about future developments in the city.'}
for kpi in ['ben_aware','tax','informed']:
    for r in K:
        if r['kpi_id']==kpi and r['segment']=='Total' and r['value_pct'] not in ('','n/a'):
            NC.append(dict(row_id=f"{kpi}|{r['wave_id']}",item=lab[kpi],why=why[kpi],city=r['city'],wave_id=r['wave_id'],wave=r['wave_short'],wave_order=r['wave_order'],pct=r['value_pct'],base_n=r['base_n'],wording=r['base_definition'],source=r['source']))
IT=list(csv.DictReader(open('/home/claude/out/ds/items.csv')))
for r in IT:
    if r['question_id']=='offerings' and r['wave_id'] in ('ANA-W4','GG-W2') and r['pct'] not in ('',):
        NC.append(dict(row_id=f"offerings|{r['wave_id']}|{r['item']}",item='Aware of local offerings: '+r['item'],why='Each city lists its own offerings, so the lists differ.',city=r['city'],wave_id=r['wave_id'],wave=r['wave_short'],wave_order=r['wave_order'],pct=r['pct'],base_n=r['base_n'],wording='Aware of local offerings (B1)',source=r['source']))
w('notcmp',NC)
# ---------- insights: linked views and opportunities ----------
LD={l['link_id']:l for l in L}
S=list(csv.DictReader(open('/home/claude/voices/ds/voices_themes.csv')))
def th(q,t): 
    for r in S:
        if r['qid']==q and r['theme']==t: return r
seg=[dict(zip(['city','wave_id','kpi_id','kpi','grp','segment','base_n','pct'],x)) for x in c.execute("select city,wave_id,kpi_id,kpi,segment_group,segment,base_n,pct from respondent_segments where base_n>=30 and segment_group in ('Housing','Years in city')")]
I=[]
def add(scope,kind,rank,head,detail,nums,src):
    row=dict(ins_id=f'{scope}|{kind}|{rank}',scope=scope,kind=kind,rank=rank,headline=head,detail=detail,source=src)
    for i in range(4):
        a,b=(nums[i] if i<len(nums) else ('',''))
        row[f'v{i+1}']=a; row[f'n{i+1}']=b
    I.append(row)
def link(wave,dk,ok): return LD[f'{wave}|{dk}|{ok}']
P={'Understand tax benefits':"understand tourism's tax benefits",'Feel well-informed':'feel well-informed','Feel educated on tourism':'feel educated about tourism','Would appreciate discounts':'would appreciate resident discounts','Want to stay for life':'want to stay in the city for life','Want Disneyland info':"want more information on Disneyland's plans",'Recommended day trips':'have recommended day trips to non-residents','City values residents over visitors':'feel the city values residents over visitors','Tourism sentiment':'feel positive about tourism','Positive impact of tourism':'see a positive impact from tourism','Visit Anaheim awareness':'are aware of Visit Anaheim','City sentiment':'feel positive about their city','Used Visit Anaheim comms':'have used Visit Anaheim communications','Tourism benefits me/family':'say tourism benefits them or their family','Recommended offerings to residents':'have recommended local offerings to other residents','Recommended offerings':'have recommended local offerings to other residents','Aware of benefits':'are aware of resident benefits from tourism','Visit Anaheim familiarity':'are familiar with Visit Anaheim','Visit Anaheim sentiment':'feel favorable toward Visit Anaheim'}
def po(x):
    p=ph(x)
    return 'be '+p[4:] if p.startswith('are ') else p
def ph(x):
    if x not in P: print('MISSING PHRASE',x)
    return P.get(x,x.lower())
# Anaheim linked views (top 4 by gap, distinct drivers)
for scope,wave in [('Anaheim','ANA-W4'),('Garden Grove','GG-W2')]:
    ls=[l for l in L if l['wave_id']==wave]; ls.sort(key=lambda l:-l['gap_pts'])
    used=set();k=0
    for l in ls:
        if l['driver'] in used or l['outcome'] in used and k>=2: continue
        used.add(l['driver']); k+=1
        add(scope,'Linked views',k,f"Residents who {ph(l['driver'])} are more likely to {po(l['outcome'])}",
            f"{{v1}}% of residents who {ph(l['driver'])} (n={{n1}}) vs {{v2}}% of those who do not (n={{n2}}).",
            [(l['pct_if_yes'],l['n_yes']),(l['pct_if_no'],l['n_no'])],l['source'])
        if k==4: break
# Both cities: same pair present in both
pairs=collections.defaultdict(dict)
for l in L: pairs[(l['driver_kpi'],l['outcome_kpi'])][l['wave_id']]=l
both=[(p,v) for p,v in pairs.items() if 'ANA-W4' in v and 'GG-W2' in v]
both.sort(key=lambda x:-(x[1]['ANA-W4']['gap_pts']+x[1]['GG-W2']['gap_pts']))
keep=[];sp=set()
for p,v in both:
    if frozenset(p) in sp: continue
    sp.add(frozenset(p)); keep.append((p,v))
for k,(p,v) in enumerate(keep[:4],1):
    a,g=v['ANA-W4'],v['GG-W2']
    add('All','Linked views',k,f"In both cities, residents who {ph(a['driver'])} are more likely to {po(a['outcome'])}",
        f"Anaheim W4: {{v1}}% vs {{v2}}% (n={{n1}} / {{n2}}). Garden Grove W2: {{v3}}% vs {{v4}}% (n={{n3}} / {{n4}}).",
        [(a['pct_if_yes'],a['n_yes']),(a['pct_if_no'],a['n_no']),(g['pct_if_yes'],g['n_yes']),(g['pct_if_no'],g['n_no'])],'Anaheim W4 and Garden Grove W2 survey files (BI tabulation, aggregate only)')
# Opportunities (data findings suggest)
A=lambda k:kv('ANA-W4',k); G=lambda k:kv('GG-W2',k); G1=lambda k:kv('GG-W1',k); AB=lambda k:kv('ANA-BL',k)
inf=A('informed'); l1=link('ANA-W4','informed','values_res')
add('Anaheim','Opportunity',1,'Reach the residents who do not yet feel informed',
    "Only {v1}% of Anaheim residents feel well-informed about developments such as OCVIBE (n={n1}). Among them, {v2}% say the city values residents over visitors, vs {v3}% of everyone else (n={n3}).",
    [(inf['value_pct'],inf['base_n']),(l1['pct_if_yes'],l1['n_yes']),(l1['pct_if_no'],l1['n_no'])],'W4 crosstabs C6r5; BI tabulation of W4 survey file')
t=A('tax'); l2=link('ANA-W4','tax','personal')
add('Anaheim','Opportunity',2,'Explain the tax benefits of tourism',
    "{v1}% understand tourism's tax benefits (n={n1}). Of those who do, {v2}% say tourism benefits them or their family, vs {v3}% of those who do not (n={n3}).",
    [(t['value_pct'],t['base_n']),(l2['pct_if_yes'],l2['n_yes']),(l2['pct_if_no'],l2['n_no'])],'W4 crosstabs C6r1, C6r7; BI tabulation of W4 survey file')
d=A('discounts'); dr=th('ANA-C4','Resident discounts and savings')
add('Anaheim','Opportunity',3,'Lead with resident value',
    "{v1}% would appreciate resident discounts (n={n1}). When asked what benefits residents get from tourism, {v2}% named discounts or savings unprompted (n={n2}).",
    [(d['value_pct'],d['base_n']),(dr['pct'],dr['base_n'])],'W4 crosstabs C6r8; W4 survey file C4 written answers (BI coding)')
vr=A('values_res'); vb=AB('values_res')
own=[s for s in seg if s['wave_id']=='ANA-W4' and s['kpi_id']=='values_res' and s['grp']=='Housing']
o={s['segment']:s for s in own}
if 'Own' in o and 'Rent' in o:
    add('Anaheim','Opportunity',4,'Win back the sense of being valued, starting with renters',
        "{v1}% feel the city values residents over visitors, down from {v2}% at Baseline (n={n1} / {n2}). Renters: {v3}% (n={n3}); homeowners: {v4}% (n={n4}).",
        [(vr['value_pct'],vr['base_n']),(vb['value_pct'],vb['base_n']),(round(float(o['Rent']['pct'])),o['Rent']['base_n']),(round(float(o['Own']['pct'])),o['Own']['base_n'])],'W4 crosstabs C6r3; Baseline deck slide 28; BI tabulation of W4 survey file')
else:
    print('housing segments',[s['segment'] for s in own])
ga=G('va_aware'); g1=G1('va_aware'); l3=link('GG-W2','informed','stay')
add('Garden Grove','Opportunity',1,'Rebuild awareness of Visit Anaheim',
    "Awareness fell from {v1}% (W1, n={n1}) to {v2}% (W2, n={n2}). Of residents who feel informed, {v3}% want to stay in the city for life, vs {v4}% of others (n={n4}).",
    [(g1['value_pct'],g1['base_n']),(ga['value_pct'],ga['base_n']),(l3['pct_if_yes'],l3['n_yes']),(l3['pct_if_no'],l3['n_no'])],'GG W1/W2 decks; GG W2 crosstabs; BI tabulation of GG W2 survey file')
FAMS=list(csv.DictReader(open('/home/claude/voices/ds/voices_families.csv')))
fb=[r for r in FAMS if r['qid']=='GG-B9' and r['family']=='Getting around'][0]; fa=[r for r in FAMS if r['qid']=='GG-A4' and r['family']=='Getting around'][0]
add('Garden Grove','Opportunity',2,'Make offerings easier to reach',
    "{v1}% named parking, traffic or transit when asked what would make local offerings easier to use (n={n1}), and {v2}% raised them as a concern about living in Garden Grove (n={n2}).",
    [(fb['pct'],fb['base_n']),(fa['pct'],fa['base_n'])],'GG W2 survey file, B9 and A4 written answers (BI coding)')
i1=th('GG-B9','Clear information about local events'); i2=th('GG-B9','Events on weekends and evenings')
add('Garden Grove','Opportunity',3,'One clear source for local events',
    "{v1}% asked for clearer information about local events and {v2}% for events on weekends or evenings (n={n1}).",
    [(i1['pct'],i1['base_n']),(i2['pct'],i2['base_n'])],'GG W2 survey file, B9 written answers (BI coding)')
gd=G('discounts'); gp=G('personal'); gp1=G1('personal')
add('Garden Grove','Opportunity',4,'Build on the jump in personal benefit',
    "{v1}% now say tourism benefits them or their family, up from {v2}% in W1 (n={n1} / {n2}). {v3}% would appreciate resident discounts (n={n3}).",
    [(gp['value_pct'],gp['base_n']),(gp1['value_pct'],gp1['base_n']),(gd['value_pct'],gd['base_n'])],'GG W1 and W2 decks; GG W2 crosstabs')
ad,gdd=A('discounts'),G('discounts'); ai,gi=A('disney_info'),G('disney_info')
add('All','Opportunity',1,'Resident value is the shared ask',
    "Resident discounts: {v1}% in Anaheim (n={n1}) and {v2}% in Garden Grove (n={n2}). More information on Disneyland's plans: {v3}% and {v4}%.",
    [(ad['value_pct'],ad['base_n']),(gdd['value_pct'],gdd['base_n']),(ai['value_pct'],ai['base_n']),(gi['value_pct'],gi['base_n'])],'W4 and GG W2 crosstabs')
li=link('ANA-W4','informed','values_res'); lg=link('GG-W2','informed','values_res')
add('All','Opportunity',2,'Informing residents goes with feeling valued, in both cities',
    "Feel the city values residents: Anaheim {v1}% of informed vs {v2}% of others; Garden Grove {v3}% vs {v4}%.",
    [(li['pct_if_yes'],li['n_yes']),(li['pct_if_no'],li['n_no']),(lg['pct_if_yes'],lg['n_yes']),(lg['pct_if_no'],lg['n_no'])],'BI tabulation of W4 and GG W2 survey files')
w('insights',I)
