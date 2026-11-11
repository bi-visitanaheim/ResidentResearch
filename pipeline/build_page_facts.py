"""Plain-language, page-ready slice of the repository for the dashboard's Ask page.
Audience: marketing leaders. No test statistics; only vendor-reported significance, in words.
Groups under 30 residents are left out here (kept in resident_sentiment.db)."""
import pandas as pd, re
R='/home/claude/repo/'; f=pd.read_csv(R+'out/facts.csv',keep_default_na=False,dtype=str)
x=pd.read_csv(R+'xtab_values.csv',keep_default_na=False,dtype=str)
WN={'ANA-BL':'Baseline (Apr 2025)','ANA-W2':'Wave 2 (Sep 2025)','ANA-W3':'Wave 3 (May 2026)','ANA-W4':'Wave 4 (Oct 2026)','GG-W1':'Wave 1 (May 2026)','GG-W2':'Wave 2 (Oct 2026)'}
DOC={'Resident Sentiment Tracking Report':'Anaheim Baseline report','Resident Sentiment BHT Wave 2':'Anaheim Wave 2 report','VA BHT Wave 3':'Anaheim Wave 3 report',
 'Resident Sentiment BHT Report W4':'Anaheim Wave 4 report','VA BHT Wave 4 Crosstabs':'Anaheim Wave 4 crosstabs','VA BHT W4 Data':'Anaheim Wave 4 survey data',
 'GG ResidentReport W1':'Garden Grove Wave 1 report','GG Resident BHT Report W2':'Garden Grove Wave 2 report','VA GG Wave 2 Crosstabs':'Garden Grove Wave 2 crosstabs','VA GG Wave 2 Data':'Garden Grove Wave 2 survey data'}
def src(s):
    for k,v in DOC.items():
        if k in s:
            m=re.search(r'(slide \d+|table \S+)',s); return v+(', '+m.group(1) if m else '')
    s=re.sub(r'\| trend: .*','',s).replace('deck','report').strip()
    for a,b in [('GG W2 ','Garden Grove Wave 2 '),('GG W1 ','Garden Grove Wave 1 '),('W4 ','Anaheim Wave 4 '),('crosstab ','crosstabs, table ')]: s=s.replace(a,b)
    return s
# letter -> segment name per city/segment_group
L={(r.city,r.segment_letter):r.segment for r in x[['city','segment_letter','segment']].drop_duplicates().itertuples()}
WK={'Tourism Worker':('Tourism worker households','Non-tourism households'),'GG Tourism Worker':('Residents who work in Garden Grove tourism','Residents who do not work in Garden Grove tourism'),'Family GG Tourism Worker':('Family member works in Garden Grove tourism (tourism worker family)','No family member in Garden Grove tourism')}
out=[]
for r in f.itertuples():
    k=r.kind; note=''; caution=''; ans=r.answer; seg=r.segment; grp=r.segment_group; topic=r.topic
    if k=='Crosstab':
        if r.pct=='': continue
        if r.sig.startswith('Vendor: higher than '):
            names=[L.get((r.city,c),c) for c in r.sig.replace('Vendor: higher than ','').replace(',','').replace(' ','')]
            note='Vendor flagged as notably higher than '+', '.join(names)
        kind='Results by resident group'
    elif k=='Vendor deck chart':
        if re.match(r'^\d(st|nd|rd|th) Qtr$',ans):
            if ans!='1st Qtr': continue
            ans='Share shown on chart'
        if seg in('Series 1','Column1','T2B','Percent','Total Sample','Sales'): seg='Total'
        grp='Total' if seg=='Total' else 'Chart series'
        topic=re.sub(r'\s+',' ',re.sub(r'\[.*?\]','',topic)).strip(); p=[t.strip() for t in topic.split('|')]; topic=p[0] if len(p)<2 or p[0]==p[1] else p[0]+': '+p[1]; kind='Vendor report chart'
        note=r.flag if r.flag.startswith('Vendor chart error') else ''
    elif k=='Relationship (BI-computed)':
        if 'Significant' not in r.sig or 'Not' in r.sig: continue
        m=re.search(r'No group: ([\d.]+)% \(n=(\d+)\)',r.flag)
        o,d=topic.split(' by ')
        topic=f'What goes with "{o}"'; ans=f'Residents who say "{d}"'; seg=f'{r.pct}% vs {m.group(1)}% of those who don\'t' if m else seg; grp='Linked attitudes (BI analysis of survey data)'
        note=f'Residents who agree "{d}" are {round(float(r.pct)-float(m.group(1)))} points more likely to say "{o}". This shows the two go together, not that one causes the other.' if m else ''
        kind='Linked attitudes'
    elif k=='Segment (BI-computed)':
        if r.pct=='': continue
        kind='Results by resident group'; ans='Agree (top 2 box) or Yes'; note='BI tabulation of vendor survey data'
    elif k=='KPI trend (verified)': kind='Headline KPI'; note=''
    else: kind={'Multi-select item':'Lists and channels','Resident needs':'Resident needs','Open-end theme':'In residents\' own words'}.get(k,k)
    if grp in WK and seg in ('Yes','No'): seg=WK[grp][0 if seg=='Yes' else 1]
    if ans=='Top 2 Box': ans='Top 2 Box (positive or agree)'
    elif ans=='Bottom 2 Box': ans='Bottom 2 Box (negative or disagree)'
    try: n=int(float(r.base_n)) if r.base_n else ''
    except: n=''
    if n!='' and n<50: caution='Small group (under 50 residents): read as directional'
    if r.flag and ('Suppressed' in r.flag or 'error' in r.flag): caution=(caution+'; ' if caution else '')+r.flag
    out.append(dict(fact_id=r.fact_id,kind=kind,city=r.city,wave=WN.get(r.wave_id,r.wave),wave_id=r.wave_id,topic=topic,answer=ans,group=grp,segment=seg,pct=r.pct,n=n,vendor_note=note,caution=caution,source=src(r.source)))
# group sizes (every group, including those too small to report)
xs=x.copy(); xs['b']=pd.to_numeric(xs.base_n,errors='coerce')
tot=xs[xs.segment_group=='Total'].groupby('city').b.max().to_dict()
gs=xs.groupby(['city','wave_id','segment_group','segment']).b.max().reset_index()
for i,g in enumerate(gs.itertuples()):
    if g.segment_group=='Total' or pd.isna(g.b): continue
    seg=WK[g.segment_group][0 if g.segment=='Yes' else 1] if g.segment_group in WK and g.segment in('Yes','No') else g.segment
    out.append(dict(fact_id=f'G{i}',kind='Group size',city=g.city,wave=WN[g.wave_id],wave_id=g.wave_id,topic='Residents surveyed in this group (share of all residents surveyed)',answer='Residents surveyed',group=g.segment_group,segment=seg,
        pct=round(g.b/tot[g.city]*100,1),n=int(g.b),vendor_note='',caution='Under 30 residents: results for this group are not reported' if g.b<30 else ('Small group (under 50 residents): read as directional' if g.b<50 else ''),source=('Anaheim Wave 4 crosstabs' if g.city=='Anaheim' else 'Garden Grove Wave 2 crosstabs')+', base counts'))
o=pd.DataFrame(out); o.to_csv(R+'out/ask_facts.csv',index=False)
print(len(o), o.kind.value_counts().to_dict()); import os; print(os.path.getsize(R+'out/ask_facts.csv'))
print((o.pct=='').sum(), 'blank pct'); 
