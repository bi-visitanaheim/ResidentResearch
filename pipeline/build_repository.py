"""Resident Sentiment reference repository: rebuild end-to-end when a new wave arrives.
Steps: extract_decks.py -> extract_xtabs.py -> relationships.py -> this script.
Outputs: out/resident_sentiment.db (SQLite), out/facts.csv (one searchable long table), out/documents.csv, out/data_dictionary.csv"""
import pandas as pd, sqlite3, re, os
R='/home/claude/repo/'; O=R+'out/'; DS='/home/claude/out/ds/'
WV={'ANA-BL':'Baseline','ANA-W2':'Wave 2','ANA-W3':'Wave 3','ANA-W4':'Wave 4','GG-W1':'Wave 1','GG-W2':'Wave 2'}
CITY=lambda w:'Anaheim' if w.startswith('ANA') else 'Garden Grove'
docs=pd.DataFrame([
 ('D01','ANA-BL','Vendor report deck','25_VA Resident Sentiment Tracking Report DELIVERABLE 04172025 CONFIDENTIAL.pptx'),
 ('D02','ANA-W2','Vendor report deck','25_VA Resident Sentiment BHT Wave 2 09242025 CONFIDENTIAL.pptx'),
 ('D03','ANA-W3','Vendor report deck','26_VA BHT Wave 3 Deliverable 05072026 CONFIDENTIAL.pptx'),
 ('D04','ANA-W4','Vendor report deck','26_VA Resident Sentiment BHT Report W4 DELIVERABLE 11052026.pptx'),
 ('D05','ANA-W4','Crosstabs','VA BHT Wave 4 Crosstabs DELIVERABLE 10292026.xlsx'),
 ('D06','ANA-W4','Respondent data (aggregated only)','VA BHT W4 Data DELIVERABLE 10282026.xlsx'),
 ('D07','GG-W1','Vendor report deck','26_GG ResidentReport W1 DELIVERABLE 05282026 CONFIDENTIAL (2).pptx'),
 ('D08','GG-W2','Vendor report deck','26_GG Resident BHT Report W2 DELIVERABLE 11052026.pptx'),
 ('D09','GG-W2','Crosstabs','VA GG Wave 2 Crosstabs DELIVERABLE 11022026.xlsx'),
 ('D10','GG-W2','Respondent data (aggregated only)','VA GG Wave 2 Data DELIVERABLE 11052026.xlsx')],columns=['doc_id','wave_id','doc_type','file_name'])
docs['city']=docs.wave_id.map(CITY); docs['pull_date']='2026-11-10'
F=[]
def add(**k): F.append(k)
# 1 KPI trend table (verified)
k=pd.read_csv(DS+'kpis.csv')
for r in k.itertuples():
    add(kind='KPI trend (verified)',city=r.city,wave_id=r.wave_id,wave=r.wave_short,topic=r.kpi,answer=r.response,segment_group='Total',segment=r.segment,
        pct=r.value_pct,base_n=r.base_n,sig=('vs prior: vendor '+str(r.vendor_sig_vs_prior)+' / BI '+str(r.bi_test_vs_prior)) if pd.notna(r.bi_test_vs_prior) else '',
        flag=r.base_flag if pd.notna(r.base_flag) else '',source=r.source)
# 2 crosstabs: every segment cell
x=pd.read_csv(R+'xtab_values.csv',keep_default_na=False)
for r in x.itertuples():
    b=int(r.base_n) if str(r.base_n).strip() not in ('','nan') else ''
    fl='Suppressed (base under 30)' if b!='' and b<30 else ('Use caution (base under 50)' if b!='' and b<50 else '')
    add(kind='Crosstab',city=r.city,wave_id=r.wave_id,wave=WV[r.wave_id],topic=r.question,answer=r.row_label,segment_group=r.segment_group,segment=r.segment,
        pct=r.pct if fl.startswith('Supp')==False else '',base_n=b,sig=('Vendor: higher than '+r.sig_higher_than) if r.sig_higher_than else '',flag=fl,
        source=f'{r.file} table {r.table}')
# 3 deck charts (all waves, incl. earlier waves with no data files)
d=pd.read_csv(R+'deck_chart_values.csv',keep_default_na=False)
for r in d.itertuples():
    try: v=float(r.value)
    except: continue
    pct=round(v*100,1) if abs(v)<=1.0001 else round(v,1)
    q=(r.question_text.split('\n')[0] if r.question_text else '') or r.slide_title
    fl=''
    if r.deck_wave=='GG-W2' and re.search('immersive|high-end',r.category,re.I) and v==0: fl='Vendor chart error: crosstab shows non-zero (see audit)'
    add(kind='Vendor deck chart',city=CITY(r.deck_wave),wave_id=r.deck_wave,wave=WV[r.deck_wave],topic=f'{r.slide_title} | {q}',answer=r.category,segment_group='Chart series',segment=r.series,
        pct=pct,base_n='',sig='',flag=fl or ('Value as charted; base not on chart (see wave register)'),source=f'{r.file} slide {r.slide} chart {r.chart}')
# 4 relationships + respondent segments (BI-computed, aggregate)
for r in pd.read_csv(R+'relationships.csv',keep_default_na=False).itertuples():
    add(kind='Relationship (BI-computed)',city=r.city,wave_id=r.wave_id,wave=WV[r.wave_id],topic=f'{r.outcome} by {r.driver}',answer=f'{r.outcome} among those who agree: {r.driver}',
        segment_group='Driver',segment=f'Yes vs No (gap {r.gap_pts} pts)',pct=r.outcome_pct_if_driver_yes,base_n=r.n_yes,
        sig=f'Chi-square p={r.chi2_p}: {r.bi_test}' if r.bi_test else '',flag=r.note or f'No group: {r.outcome_pct_if_driver_no}% (n={r.n_no}); association, not cause',source=r.source)
for r in pd.read_csv(R+'respondent_segments.csv',keep_default_na=False).itertuples():
    add(kind='Segment (BI-computed)',city=r.city,wave_id=r.wave_id,wave=WV[r.wave_id],topic=r.kpi,answer='Top-2 box / Yes',segment_group=r.segment_group,segment=r.segment,
        pct=r.pct if not str(r.flag).startswith('Supp') else '',base_n=r.base_n,sig='',flag=r.flag,source=r.source)
# 5 items, needs, themes
for r in pd.read_csv(DS+'items.csv',keep_default_na=False).itertuples():
    add(kind='Multi-select item',city=r.city,wave_id=r.wave_id,wave=r.wave_short,topic=r.question,answer=r.item,segment_group='Total',segment='Total',pct=r.pct,base_n=r.base_n,sig='',flag=r.note,source=r.source)
for r in pd.read_csv(DS+'needs.csv',keep_default_na=False).itertuples():
    add(kind='Resident needs',city=r.city,wave_id=r.wave_id,wave=r.wave,topic=r.measure,answer=r.item,segment_group='Total',segment='Total',pct=r.pct,base_n=r.base_n,sig='',flag='',source=r.source)
for r in pd.read_csv(DS+'themes.csv',keep_default_na=False).itertuples():
    wid=('ANA-' if r.city=='Anaheim' else 'GG-')+{'Baseline':'BL','Wave 2':'W2','Wave 3':'W3','Wave 4':'W4','Wave 1':'W1'}.get(r.wave,'')
    add(kind='Open-end theme',city=r.city,wave_id=wid,wave=r.wave,topic=r.question,answer=r.theme,segment_group=r.coding,segment='Total',pct=r.pct,base_n=r.base_n,sig='',flag=r.base_note,source=r.source)
f=pd.DataFrame(F); f.insert(0,'fact_id',range(1,len(f)+1))
for c in f.columns: f[c]=f[c].fillna('').astype(str).str.replace(r'\.0$','',regex=True) if c in('base_n',) else f[c].fillna('')
f.to_csv(O+'facts.csv',index=False); docs.to_csv(O+'documents.csv',index=False)
dd=pd.DataFrame([('facts','One row per reported or computed value across every document. Use for search and Q&A.'),('fact_id','Row id'),('kind','KPI trend (verified) | Crosstab | Vendor deck chart | Relationship (BI-computed) | Segment (BI-computed) | Multi-select item | Resident needs | Open-end theme'),
 ('city','Anaheim or Garden Grove'),('wave_id','ANA-BL..ANA-W4, GG-W1..GG-W2'),('topic','Question or measure'),('answer','Response option, item, theme or relationship'),('segment_group / segment','Banner group and segment (Total when none)'),
 ('pct','Percent (0-100). Blank only when suppressed (base under 30)'),('base_n','Unweighted base; blank on deck charts (base from wave register)'),('sig','Vendor sig letters or BI test'),('flag','Base caution, suppression, or known vendor error'),('source','File and table/slide')],columns=['field','definition'])
dd.to_csv(O+'data_dictionary.csv',index=False)
con=sqlite3.connect(O+'resident_sentiment.db')
for name,df in {'facts':f,'documents':docs,'data_dictionary':dd,'kpis':k,'xtab_values':x,'deck_chart_values':d,'deck_text':pd.read_csv(R+'deck_text.csv'),
  'relationships':pd.read_csv(R+'relationships.csv'),'respondent_segments':pd.read_csv(R+'respondent_segments.csv'),'waves':pd.read_csv(DS+'waves.csv'),
  'crosswalk':pd.read_csv(DS+'crosswalk.csv'),'items':pd.read_csv(DS+'items.csv'),'needs':pd.read_csv(DS+'needs.csv'),'themes':pd.read_csv(DS+'themes.csv'),'dq':pd.read_csv(DS+'dq.csv')}.items():
    df.to_sql(name,con,if_exists='replace',index=False)
con.executescript("""
DROP VIEW IF EXISTS v_kpi_by_segment; CREATE VIEW v_kpi_by_segment AS SELECT city,wave_id,topic,answer,segment_group,segment,pct,base_n,sig,flag,source FROM facts WHERE kind='Crosstab';
DROP VIEW IF EXISTS v_drivers; CREATE VIEW v_drivers AS SELECT * FROM relationships WHERE bi_test='Significant' ORDER BY gap_pts DESC;
DROP VIEW IF EXISTS v_trend; CREATE VIEW v_trend AS SELECT city,kpi,wave_short,value_pct,base_n,bi_test_vs_prior,comparability FROM kpis ORDER BY city,kpi,wave_order;""")
con.commit(); print(f.kind.value_counts()); print('facts',len(f), os.path.getsize(O+'facts.csv')); print((f.pct=='').sum(),'blank pct')
