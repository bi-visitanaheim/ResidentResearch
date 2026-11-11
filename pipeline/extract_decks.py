"""Extract every chart, table and text value from vendor decks into long format."""
import sys, csv, re
from pptx import Presentation
DECKS={'ANA-BL':'ana_2025_apr.pptx','ANA-W2':'ana_w2.pptx','ANA-W3':'ana_w3.pptx','ANA-W4':'ana_w4.pptx','GG-W1':'gg_w1.pptx','GG-W2':'gg_w2.pptx'}
NAMES={'ANA-BL':'25_VA Resident Sentiment Tracking Report DELIVERABLE 04172025 CONFIDENTIAL.pptx','ANA-W2':'25_VA Resident Sentiment BHT Wave 2 09242025 CONFIDENTIAL.pptx','ANA-W3':'26_VA BHT Wave 3 Deliverable 05072026 CONFIDENTIAL.pptx','ANA-W4':'VA Resident Sentiment BHT Report W4 DELIVERABLE 11052026.pptx','GG-W1':'26_GG ResidentReport W1 DELIVERABLE 05282026 CONFIDENTIAL (2).pptx','GG-W2':'GG Resident BHT Report W2 DELIVERABLE 11052026.pptx'}
def walk(shapes):
    for sh in shapes:
        if sh.shape_type==6: yield from walk(sh.shapes)
        else: yield sh
charts=[]; texts=[]
for wid,f in DECKS.items():
    prs=Presentation('/home/claude/src/'+f)
    for si,sl in enumerate(prs.slides,1):
        tx=[sh.text_frame.text.strip() for sh in walk(sl.shapes) if sh.has_text_frame and sh.text_frame.text.strip()]
        qtext=next((t for t in tx if re.match(r'^[A-Z]\d+[a-z]?(r\d+)?[\.:/ ]|^C8/C6|^C8r|^C6r|^E\d|^B\d|^A\d|^D\d',t)),'')
        title=next((t for t in tx if 3<len(t)<80 and not re.match(r'^\(|^\d+$|^n=',t)),'')
        for t in tx: texts.append(dict(deck_wave=wid,file=NAMES[wid],slide=si,text=t.replace('\n',' | ')))
        ci=0
        for sh in walk(sl.shapes):
            if not getattr(sh,'has_chart',False) or not sh.has_chart: continue
            ci+=1; ch=sh.chart
            try: cats=[str(c) for c in ch.plots[0].categories]
            except Exception: cats=[]
            for p in ch.plots:
                for s in p.series:
                    vals=list(s.values)
                    for i,v in enumerate(vals):
                        if v is None: continue
                        charts.append(dict(deck_wave=wid,file=NAMES[wid],slide=si,chart=ci,chart_type=str(ch.chart_type).split(' ')[0],slide_title=title[:120],question_text=qtext[:300],series=s.name,category=cats[i] if i<len(cats) else f'#{i}',value=round(float(v),4)))
for name,rows in [('deck_chart_values',charts),('deck_text',texts)]:
    with open(f'/home/claude/repo/{name}.csv','w',newline='') as fh:
        w=csv.DictWriter(fh,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    print(name,len(rows))
