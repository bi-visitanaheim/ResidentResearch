"""Extract every crosstab table, every banner column (segment), freq, %, base and significance letters."""
import csv, json
SRC={'ANA-W4':('/home/claude/work/anax__Visit_Anaheim_Wave_4.tsv','VA BHT Wave 4 Crosstabs DELIVERABLE 10292026.xlsx','Anaheim'),
     'GG-W2':('/home/claude/work/ggx__Garden_Grove_Wave_2.tsv','VA GG Wave 2 Crosstabs DELIVERABLE 11022026.xlsx','Garden Grove')}
out=[]
for wid,(path,fname,city) in SRC.items():
    rows=[l.rstrip('\n').split('\t') for l in open(path)]
    banner=[r for r in rows if r and r[0]=='Banner Text']
    groups,labels,letters=banner[0][2:],banner[1][2:],banner[2][2:]
    g='Total'; grp=[]
    for i,x in enumerate(groups):
        if x.strip(): g=x.strip()
        grp.append('Total' if i==0 else g)
    # fix W4 duplicated zip label groups: label zips with their group
    cur=None; tname=None; title=None; bases=None; last=None
    for r in rows:
        k=r[0] if r else ''
        if k in('Apply Filter','Table Name') and len(r)>1 and r[1].startswith('Table '): tname=r[1][6:]
        elif k=='Table Title 1': title=r[1]; bases=None
        elif k=='Filter Frequency Row': bases=r[2:]
        elif k=='Frequency Row':
            last=dict(label=r[1],n=r[2:],pct=None,sig=None)
            for i,lab in enumerate(labels):
                if i>=len(last['n']): break
                out.append(dict(city=city,wave_id=wid,file=fname,table=tname,question=title,row_label=last['label'].replace('﻿','').strip(),segment_group=grp[i],segment=lab.strip(),segment_letter=letters[i].strip('()'),base_n=(bases[i] if bases and i<len(bases) else ''),n=last['n'][i],pct='',sig_higher_than=''))
        elif k=='Vertical % Row':
            m=len(labels)
            for i,v in enumerate(r[2:2+m]):
                idx=len(out)-m+i
                if v not in('','-'): out[idx]['pct']=round(float(v)*100,1)
        elif k=='Sig-Testing Results':
            m=len(labels)
            for i,v in enumerate(r[2:2+m]):
                if v.strip(): out[len(out)-m+i]['sig_higher_than']=v.strip()
for o in out:
    for f in('n','base_n'):
        o[f]= '' if o[f] in('-','') else int(float(o[f]))
    if o['pct']=='' and o['n']==0: o['pct']=0.0
    if o['pct']=='' and o['n']=='' : o['pct']=0.0; o['n']=0
with open('/home/claude/repo/xtab_values.csv','w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
import collections
print(len(out), collections.Counter((o['wave_id']) for o in out))
print(sorted(set((o['wave_id'],o['segment_group'],o['segment']) for o in out))[:60])
