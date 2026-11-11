import json,re,collections
R=json.load(open('coded.json'))
STOP=set("""a an the and or but if so of to in on at by for with from as is are was were be been being am it its it's this that these those there here i me my we our us you your they them their he she his her not no nor do does did done have has had having will would could should can may might must shall just very really also too even still yet than then when while which who whom whose what where why how all any both each few more most other some such only own same about above after again against along among around before below between during into through under until up down out over off once because though although however since per via get gets got getting go goes going went make makes made making take takes took taking see sees saw seen seem seems seemed say says said one two three lot lots many much little bit quite pretty rather something anything everything nothing someone anyone everyone people person thing things way ways time times day days year years like likes liked love loves enjoy enjoys think thinks feel feels felt know knows need needs want wants good great nice well better best fine okay ok big small little high low new old long short main major overall especially mostly mainly usually often sometimes always never again able ability etc eg ie yes none dont don't doesn't didn't isn't aren't wasn't can't won't im i'm i've it's there's that's also let lets us""".split())
DOMAIN=set("""anaheim garden grove visit visitor visitors tourism tourist tourists city cities resident residents orange county area areas place places local living live lives lived benefit benefits concern concerns offer offers offering offerings""".split())
def toks(t):
    t=t.lower().replace("’","'")
    w=re.findall(r"[a-z][a-z'\-]+",t)
    return w
def lem(w):
    m={'businesses':'business','opportunities':'opportunity','oppurtinities':'opportunity','activities':'activity','communities':'community','cultures':'culture','cultural':'culture','conveniences':'convenience','convenient':'convenience','conviences':'convenience','restaurants':'restaurant','shops':'shop','jobs':'job','discounts':'discount','discounted':'discount','events':'event','attractions':'attraction','costs':'cost','prices':'price','taxes':'tax','revinue':'revenue','revenues':'revenue','amenities':'amenity','neighborhoods':'neighborhood','neighbourhood':'neighborhood','neighbourhoods':'neighborhood','tickets':'ticket','parks':'park','streets':'street','roads':'road','schools':'school','festivals':'festival','crowded':'crowd','crowds':'crowd','expensive':'expense','affordable':'afford','affordability':'afford','congestion':'congest','congested':'congest','parting':'parking','employment':'job','careers':'career','rents':'rent','homes':'home','friendly':'friend','diverse':'diversity','welcoming':'welcome','safe':'safety','events':'event','visitors':'visitor'}
    if w in m: return m[w]
    return w
docs=[]
for r in R:
    ws=[lem(w) for w in toks(r['text'])]
    docs.append((r['qid'],ws))
uni=collections.Counter(); bi=collections.Counter()
for q,ws in docs:
    u=set(w for w in ws if w not in STOP and w not in DOMAIN and len(w)>2)
    uni.update(u)
    b=set()
    for a,c in zip(ws,ws[1:]):
        if a in STOP or c in STOP or a in DOMAIN and c in DOMAIN: continue
        if len(a)>2 and len(c)>2: b.add(a+' '+c)
    bi.update(b)
print('UNI',uni.most_common(110))
print('BI',[x for x in bi.most_common(80)])
