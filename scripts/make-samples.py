from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, textwrap
root=Path(__file__).resolve().parents[1]
out=root/'dist'/'samples'
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
warning='(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
def make(name,abv='45',heading='GOVERNMENT WARNING:',body=warning):
    im=Image.new('RGB',(1500,1300),'#fffef8');d=ImageDraw.Draw(im)
    d.rectangle((38,38,1462,1262),outline='#203e31',width=6)
    def center(y,s,size=42,b=False):
        f=ImageFont.truetype(bold if b else font,size);d.text(((1500-d.textlength(s,font=f))/2,y),s,font=f,fill='#172f25')
    center(100,'OLD TOM DISTILLERY',68,True)
    d.line((180,210,1320,210),fill='#927947',width=3)
    center(260,'Kentucky Straight Bourbon Whiskey',44)
    center(358,abv+'% Alc./Vol. (90 Proof)',42)
    center(445,'750 mL',44)
    center(545,'Bottled by Old Tom Distillery',36)
    center(605,'Louisville, Kentucky',36)
    d.line((120,710,1380,710),fill='#927947',width=2)
    d.text((120,760),heading,font=ImageFont.truetype(bold,35),fill='#101d16')
    y=825
    for line in textwrap.wrap(body,width=69):
        d.text((120,y),line,font=ImageFont.truetype(font,31),fill='#101d16');y+=48
    center(1190,'FICTIONAL SAMPLE LABEL - FOR PROTOTYPE TESTING ONLY',20)
    im.save(out/name)
make('old-tom.png')
make('wrong-abv.png',abv='40')
make('warning-case.png',heading='Government Warning:')
base={'brand':'OLD TOM DISTILLERY','type':'Kentucky Straight Bourbon Whiskey','abv':'45','net':'750 mL','producer':'Old Tom Distillery','address':'Louisville, Kentucky','origin':'','imported':False}
(out/'applications.json').write_text(json.dumps([{'filename':name,**base} for name in ['old-tom.png','wrong-abv.png','warning-case.png']],indent=2))
