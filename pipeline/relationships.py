"""Respondent-level relationships (aggregate output only): KPI-to-KPI association and segment gaps.
Unweighted (no vendor weights exist). Re-run when new respondent files arrive."""
import pandas as pd, numpy as np, csv, itertools
from scipy.stats import chi2_contingency, norm
W='/home/claude/work/'
a=pd.read_csv(W+'ana__A1.tsv',sep='\t',dtype=str,keep_default_na=False)
g=pd.read_csv(W+'gg__A1.tsv',sep='\t',dtype=str,keep_default_na=False)
# codes may come through as '4' or '4' depending on the dump; normalise to '4'
norm=lambda v: v[:-2] if isinstance(v,str) and v.endswith('.0') else v
a=a.map(norm); g=g.map(norm)
def t2b(s,top): return s.map(lambda v: np.nan if v=='' else (1.0 if v in top else 0.0))
A={'city_sent':t2b(a.A1,['4','5']),'va_aware':t2b(a.A2,['4','5']),'tour_sent':t2b(a.C1,['4','5']),'tour_impact':t2b(a.C2,['4','5']),
   'rec_res':t2b(a.B2,['1']),'rec_nonres':t2b(a.B3,['1']),'ben_aware':t2b(a.C3a,['1']),'tax':t2b(a.C6r1,['4','5']),'educated':t2b(a.C6r2,['4','5']),
   'values_res':t2b(a.C6r3,['4','5']),'stay':t2b(a.C6r4,['4','5']),'informed':t2b(a.C6r5,['4','5']),'disney_info':t2b(a.C6r6,['4','5']),
   'personal':t2b(a.C6r7,['4','5']),'discounts':t2b(a.C6r8,['4','5']),'used_comms':t2b(a.E2,['1'])}
G={'city_sent':t2b(g.A1,['1','2']),'va_aware':t2b(g.A5,['1','2']),'tour_sent':t2b(g.C1,['1','2']),'tour_impact':t2b(g.C2,['1','2']),
   'rec_res':t2b(g.B4,['1']),'rec_nonres':t2b(g.B6,['1']),'educated':t2b(g.C8r1,['1','2']),'values_res':t2b(g.C8r2,['1','2']),'stay':t2b(g.C8r3,['1','2']),
   'informed':t2b(g.C8r4,['1','2']),'disney_info':t2b(g.C8r5,['1','2']),'personal':t2b(g.C8r6,['1','2']),'discounts':t2b(g.C8r7,['1','2']),'used_comms':t2b(g.E2,['1'])}
LBL={'city_sent':'City sentiment','va_aware':'Visit Anaheim awareness','tour_sent':'Tourism sentiment','tour_impact':'Positive impact of tourism','rec_res':'Recommended to residents','rec_nonres':'Recommended day trips','ben_aware':'Aware of resident benefits','tax':'Understand tax benefits','educated':'Feel educated on tourism','values_res':'City values residents over visitors','stay':'Want to stay for life','informed':'Feel well-informed','disney_info':'Want Disneyland info','personal':'Tourism benefits me/family','discounts':'Would appreciate discounts','used_comms':'Used Visit Anaheim comms'}
rows=[]
def lift(df,city,wave,outcome):
    y=df[outcome]
    for x in df:
        if x==outcome: continue
        m=df[[x,outcome]].dropna(); yes=m[m[x]==1][outcome]; no=m[m[x]==0][outcome]
        if len(yes)<30 or len(no)<30:
            note='Base under 30 in one group: not tested'; p=''; sig=''
        else:
            tab=pd.crosstab(m[x],m[outcome]); p=round(chi2_contingency(tab)[1],4); sig='Significant' if p<0.05 else 'Not significant'; note=''
        rows.append(dict(city=city,wave_id=wave,outcome_kpi=outcome,outcome=LBL[outcome],driver_kpi=x,driver=LBL[x],
            outcome_pct_if_driver_yes=round(yes.mean()*100,1) if len(yes) else '',n_yes=len(yes),outcome_pct_if_driver_no=round(no.mean()*100,1) if len(no) else '',n_no=len(no),
            gap_pts=round((yes.mean()-no.mean())*100,1) if len(yes) and len(no) else '',phi=round(m[x].corr(m[outcome]),3) if m[x].std()>0 and m[outcome].std()>0 else '',chi2_p=p,bi_test=sig,note=note,
            source=('VA BHT W4 Data DELIVERABLE 10282026.xlsx' if city=='Anaheim' else 'VA GG Wave 2 Data DELIVERABLE 11052026.xlsx')+' (respondent-level, unweighted)'))
da,dg=pd.DataFrame(A),pd.DataFrame(G)
for o in ['values_res','personal','tour_sent','stay','va_aware']:
    lift(da,'Anaheim','ANA-W4',o); lift(dg,'Garden Grove','GG-W2',o)
with open('/home/claude/repo/relationships.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
# segment gaps from respondent data (tenure, housing, tourism household) - Anaheim only has these banners partly
seg=[]
def segs(df,raw,city,wave,defs):
    for sname,(col,mapping) in defs.items():
        lab=raw[col].map(mapping)
        for k in df:
            for sv in sorted(set(lab.dropna())):
                m=df[k][lab==sv].dropna()
                seg.append(dict(city=city,wave_id=wave,kpi_id=k,kpi=LBL[k],segment_group=sname,segment=sv,base_n=len(m),pct=round(m.mean()*100,1) if len(m) else '',flag='Suppressed (base under 30)' if len(m)<30 else ('Use caution (base under 50)' if len(m)<50 else ''),
                    source=('VA BHT W4 Data DELIVERABLE 10282026.xlsx' if city=='Anaheim' else 'VA GG Wave 2 Data DELIVERABLE 11052026.xlsx')+' (respondent-level, unweighted)'))
ten={'1':'Under 5 years','2':'Under 5 years','3':'5-20 years','4':'5-20 years','5':'20+ years','6':'20+ years','7':'20+ years'}
house={'1':'Own','2':'Rent','3':'Live with family','4':'Other'}
segs(da,a,'Anaheim','ANA-W4',{'Years in city':('S5',ten),'Housing':('P11',house),'Tourism household':('S6r13',{'1':'Yes','0':'No'})})
segs(dg,g,'Garden Grove','GG-W2',{'Years in city':('S5',ten),'Housing':('P11',house),'Survey language':('QLang',{'1':'English','3':'Vietnamese'})})
with open('/home/claude/repo/respondent_segments.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(seg[0].keys())); w.writeheader(); w.writerows(seg)
r=pd.DataFrame(rows); print(r[(r.bi_test=='Significant')].sort_values('gap_pts',ascending=False).groupby(['city','outcome_kpi']).head(3)[['city','outcome_kpi','driver_kpi','outcome_pct_if_driver_yes','outcome_pct_if_driver_no','gap_pts','chi2_p']].to_string())
s=pd.DataFrame(seg); print(s[(s.flag=='')&s.kpi_id.isin(['values_res','personal','stay','va_aware'])].pivot_table(index=['city','segment_group','segment'],columns='kpi_id',values='pct').to_string())
