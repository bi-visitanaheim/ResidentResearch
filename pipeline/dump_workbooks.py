"""Step 0: dump vendor workbooks to TSV in /home/claude/work (openpyxl fails on these files; calamine works).
Respondent data (<city>__<sheet>.tsv): pandas, first row = column names.
Crosstabs (<city>x__<sheet>.tsv): raw calamine rows joined by tabs, as extract_xtabs.py expects.
For a new wave, add its files to DATA / XTAB with a new prefix and add the matching entries in later scripts."""
import pandas as pd, os
from python_calamine import CalamineWorkbook
W='/home/claude/work/'; S='/home/claude/src/'; os.makedirs(W,exist_ok=True)
DATA={'ana':'ana_w4_data.xlsx','gg':'gg_w2_data.xlsx'}
XTAB={'anax':'ana_w4_xtab.xlsx','ggx':'gg_w2_xtab.xlsx'}
for pre,f in DATA.items():
    for name,df in pd.read_excel(S+f,sheet_name=None,engine='calamine').items():
        df.to_csv(f'{W}{pre}__{name.replace(" ","_")}.tsv',sep='\t',index=False)
cell=lambda v: '' if v is None else str(v).replace('\t',' ').replace('\n',' ')
for pre,f in XTAB.items():
    wb=CalamineWorkbook.from_path(S+f)
    for name in wb.sheet_names:
        rows=wb.get_sheet_by_name(name).to_python()
        open(f'{W}{pre}__{name.replace(" ","_")}.tsv','w').write('\n'.join('\t'.join(cell(c) for c in r) for r in rows)+'\n')
print('workbooks dumped')
