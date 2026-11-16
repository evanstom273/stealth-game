# Regenerates the reference sheets: python3 make_sheets.py <output folder>  (e.g. python3 make_sheets.py .)
import math, os, sys
OUT=sys.argv[1]
INK='#1a1a26'; BG='#14141c'; PANEL='#1d1d29'; TXT='#e8e8f0'; MUTED='#9a9ab0'
WHITE='#f2f2f2'; POWER='#8fd3ff'; RED='#ff5a5a'; GOLD='#ffcf4a'; FOOT='#2a2a3a'
FONT="font-family=\"system-ui, -apple-system, 'Segoe UI', sans-serif\""

def poly(cx,cy,r,n,rot=-math.pi/2,sx=1,sy=1):
    return ' '.join(f"{cx+r*sx*math.cos(rot+2*math.pi*k/n):.1f},{cy+r*sy*math.sin(rot+2*math.pi*k/n):.1f}" for k in range(n))

class Sheet:
    def __init__(s,w,h,title,sub):
        s.w,s.h=w,h; s.o=[]
        s.o.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" {FONT}>')
        s.o.append(f'<defs><radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2e2e40"/><stop offset="0.35" stop-color="#22222f"/><stop offset="1" stop-color="#08080c"/></radialGradient><radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.45"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient><radialGradient id="hot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff0d8" stop-opacity="0.7"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient></defs>')
        s.o.append(f'<rect width="{w}" height="{h}" fill="{BG}"/>')
        s.o.append(f'<text x="40" y="52" fill="{TXT}" font-size="28" font-weight="800">{title}</text>')
        s.o.append(f'<text x="40" y="80" fill="{MUTED}" font-size="15">{sub}</text>')
    def add(s,x): s.o.append(x)
    def label(s,x,y,t,size=14,col=TXT,anchor='middle',weight='600'):
        s.add(f'<text x="{x}" y="{y}" fill="{col}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{t}</text>')
    def note(s,x,y,t,anchor='middle'): s.label(x,y,t,12,MUTED,anchor,'400')
    def panel(s,x,y,w,h,fill=PANEL): s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}"/>')
    def save(s,name):
        s.o.append('</svg>'); open(os.path.join(OUT,name),'w').write('\n'.join(s.o))

def body(sh,shape,cx,cy,S,fill,sw=None,sx=1,sy=1,rot=0):
    sw = sw if sw is not None else max(2,S*0.0625)
    st=f'fill="{fill}" stroke="{INK}" stroke-width="{sw:.1f}" stroke-linejoin="round"'
    if shape=='square': sh.add(f'<rect x="{cx-S*sx/2:.1f}" y="{cy-S*sy/2:.1f}" width="{S*sx:.1f}" height="{S*sy:.1f}" {st}/>')
    elif shape=='circle': sh.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{S/2*sx:.1f}" ry="{S/2*sy:.1f}" {st}/>')
    elif isinstance(shape,int): sh.add(f'<polygon points="{poly(cx,cy,S/2,shape,-math.pi/2+rot,sx,sy)}" {st}/>')

def face(sh,cx,cy,S,mood='idle',ox=0):
    k=S/48
    e=lambda x,y,rx,ry: sh.add(f'<ellipse cx="{cx+(x+ox)*k:.1f}" cy="{cy+y*k:.1f}" rx="{rx*k:.1f}" ry="{ry*k:.1f}" fill="{INK}"/>')
    hl=lambda x,y: sh.add(f'<circle cx="{cx+(x+ox)*k:.1f}" cy="{cy+y*k:.1f}" r="{1.5*k:.1f}" fill="#fff"/>')
    line=lambda d: sh.add(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{3*k:.1f}" stroke-linecap="round"/>')
    P=lambda x,y: f'{cx+(x+ox)*k:.1f} {cy+y*k:.1f}'
    if mood in ('idle','happy','surprised','sleepy'):
        if mood=='sleepy':
            line(f'M{P(-13,-5)} Q {P(-9,-1)} {P(-5,-5)}'); line(f'M{P(5,-5)} Q {P(9,-1)} {P(13,-5)}')
        else:
            ry=7 if mood=='surprised' else 6
            e(-9,-6,4,ry); e(9,-6,4,ry); hl(-7.5,-9); hl(10.5,-9)
        if mood=='happy': sh.add(f'<path d="M{P(-8,5)} A {8*k:.1f} {8*k:.1f} 0 0 0 {P(8,5)} Z" fill="{INK}"/>')
        elif mood=='surprised': sh.add(f'<ellipse cx="{cx+ox*k:.1f}" cy="{cy+9*k:.1f}" rx="{3.5*k:.1f}" ry="{4.5*k:.1f}" fill="{INK}"/>')
        else: line(f'M{P(-6,6)} Q {P(0,12)} {P(6,6)}')
    elif mood=='hurt':
        line(f'M{P(-14,-8)} L {P(-6,-4)} L {P(-14,0)}'); line(f'M{P(14,-8)} L {P(6,-4)} L {P(14,0)}')
        line(f'M{P(-6,12)} Q {P(0,5)} {P(6,12)}')
    elif mood=='determined':
        e(-4,-2,3.5,3); e(12,-2,3.5,3)
        line(f'M{P(-10,-12)} L {P(1,-8)}'); line(f'M{P(18,-12)} L {P(7,-8)}'); line(f'M{P(-1,9)} L {P(9,9)}')

def eye1(sh,cx,cy,r,iris=INK,look=(0,0),lid=0,brow=False,white='#f6efe3'):
    sh.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{r:.1f}" ry="{r*(1-lid):.1f}" fill="{white}" stroke="{INK}" stroke-width="{max(1.5,r*0.12):.1f}"/>')
    sh.add(f'<circle cx="{cx+look[0]*r*0.35:.1f}" cy="{cy+look[1]*r*0.35:.1f}" r="{r*0.45*(1-lid*0.5):.1f}" fill="{iris}"/>')
    if iris!=INK: sh.add(f'<ellipse cx="{cx+look[0]*r*0.35:.1f}" cy="{cy+look[1]*r*0.35:.1f}" rx="{r*0.1:.1f}" ry="{r*0.35:.1f}" fill="{INK}"/>')
    if lid: sh.add(f'<path d="M{cx-r:.1f} {cy:.1f} A {r:.1f} {r:.1f} 0 0 1 {cx+r:.1f} {cy:.1f} L {cx+r:.1f} {cy-r*(1-lid):.1f}" fill="none"/>')
    if brow: sh.add(f'<path d="M{cx-r*1.1:.1f} {cy-r*1.1:.1f} L {cx+r*1.0:.1f} {cy-r*0.6:.1f}" stroke="{INK}" stroke-width="{max(2,r*0.28):.1f}" stroke-linecap="round"/>')

def hands(sh,cx,cy,S,pose='idle',fill=WHITE):
    k=S/48; r=8*k
    pts={'idle':[(-36,-4),(36,-4)],'up':[(-40,-32),(40,-34)],'run':[(-36,-12),(36,4)],'wall':[(30,-14),(30,10)],'fwd':[(40,-6),(44,6)]}[pose]
    for x,y in pts: sh.add(f'<circle cx="{cx+x*k:.1f}" cy="{cy+y*k:.1f}" r="{r:.1f}" fill="{fill}" stroke="{INK}" stroke-width="{2.5*k:.1f}"/>')

def feet(sh,cx,bottom,S,lift=(0,0),f=1,dy=0):
    k=S/48
    for (fx,l) in zip((-12,10),lift):
        x=cx+fx*k; y=bottom+(2-l+dy)*k
        pts=[(-7,-10),(1,-10),(1,0),(13,0),(13,6),(-7,6)]
        d=' '.join(f'{x+px*f*k:.1f},{y+py*k:.1f}' for px,py in pts)
        sh.add(f'<polygon points="{d}" fill="{FOOT}" stroke="{INK}" stroke-width="{2*k:.1f}" stroke-linejoin="round"/>')

def hero(sh,cx,cy,S,mood='idle',hp='idle',sx=1,sy=1,fill=WHITE,lift=(0,0),showfeet=True):
    b=cy+S/2
    if showfeet: feet(sh,cx,b,S,lift)
    by=b-S*sy/2
    body(sh,'square',cx,by,S,fill,sx=sx,sy=sy)
    face(sh,cx,by,S*min(sx,sy)**0.3,mood)
    hands(sh,cx,by,S,hp)

# ---------- 01 anatomy ----------
sh=Sheet(1400,640,'1 · Anatomy of a character','Built in six steps from one shape. Measurements are in S, the body size (the hero here is S = 48 px in game; drawn at S = 96).')
steps=['Shape','Outline','Eyes','Mouth','Floating hands','Feet']
S=96
for i,t in enumerate(steps):
    x=40+i*225; sh.panel(x,110,205,330)
    cx=x+102; cy=260
    if i>=5: feet(sh,cx,cy+S/2,S)
    body(sh,'square',cx,cy,S,WHITE,sw=0 if i==0 else None)
    if i>=2:
        k=S/48
        for ex in (-9,9):
            sh.add(f'<ellipse cx="{cx+ex*k:.1f}" cy="{cy-6*k:.1f}" rx="{4*k:.1f}" ry="{6*k:.1f}" fill="{INK}"/>')
            sh.add(f'<circle cx="{cx+(ex+1.5)*k:.1f}" cy="{cy-9*k:.1f}" r="{1.5*k:.1f}" fill="#fff"/>')
    if i>=3: sh.add(f'<path d="M{cx-6*S/48:.1f} {cy+6*S/48:.1f} Q {cx} {cy+12*S/48:.1f} {cx+6*S/48:.1f} {cy+6*S/48:.1f}" fill="none" stroke="{INK}" stroke-width="{3*S/48:.1f}" stroke-linecap="round"/>')
    if i>=4: hands(sh,cx,cy,S)
    sh.label(cx,140,f'{i+1}. {t}',16)
notes=[('A primitive','you can name'),('Ink #1a1a26,','≈ 0.06 S thick'),('Ovals ≈ 0.17 × 0.25 S,','with a highlight dot'),('A short arc,','≈ 0.3 S wide'),('Circles ≈ 0.17 S,','centred ≈ 0.75 S out'),('Dark blocks, partly','behind the body')]
for i,(a,b) in enumerate(notes): sh.note(40+i*225+102,400,a); sh.note(40+i*225+102,418,b)
sh.panel(40,460,1320,150)
sh.label(60,492,'Rules',16,TXT,'start')
rules=['Hitbox = the plain shape. Face, hands, feet, squash and stretch are drawing only.',
 'Nothing is attached: hands and feet float near the body and move on their own (bob, swing, reach).',
 'Flat fills. At most a gentle top-to-bottom tint. No textures, no rendered shading.',
 'Every shape gets the same ink outline, scaled with its size: thicker on bodies, thinner on hands and details.']
for i,r in enumerate(rules): sh.label(60,522+i*24,'· '+r,14,MUTED,'start','400')
sh.save('01-anatomy.svg')

# ---------- 02 shapes ----------
sh=Sheet(1400,800,'2 · Shape language','What a base shape suggests before anything moves. A guide, not a law; break it on purpose.')
items=[('square','Steady','the hero, the reference shape',WHITE,'two'),
 ('circle','Quick, soft','hops, rolls, bounces','#ff8a2a','one'),
 (3,'Sharp, fast','points, aims, darts','#5ee36a','brow'),
 (5,'Heavy','slow, tough, slams','#e0453a','brow'),
 (6,'Built, precise','machines, cages, order','#4fe3ff','one'),
 (12,'Old, ritual','gates, halos, wheels','#c8913a','one'),
 (11,'Wrong','almost a circle: unsettling','#5b3a8a','red')]
for i,(shp,t,n,col,fc) in enumerate(items):
    x=40+i*190; sh.panel(x,110,175,300)
    cx=x+87; cy=250; S=110
    body(sh,shp,cx,cy,S,col)
    if fc=='two': face(sh,cx,cy,S)
    elif fc=='one': eye1(sh,cx,cy-4,S*0.17,look=(0.6,0))
    elif fc=='brow': eye1(sh,cx,cy+(8 if shp==3 else 0),S*0.15,look=(0.5,0.2),brow=True)
    else: eye1(sh,cx,cy,S*0.2,iris='#b3263a')
    sh.label(cx,140,t,16); sh.note(cx,385,n)
sh.panel(40,430,1320,340)
sh.label(60,462,'Compound shapes',16,TXT,'start')
sh.note(60,484,'Stack and combine primitives for bigger characters. Test: you can describe it in one sentence of shapes.','start')
# examples
# cairn
cx=200; base=700
for j,(n,w) in enumerate([(7,120),(6,100),(5,82),(4,64)]):
    body(sh,n,cx,base-30-j*38,w,'#e8dcc8',sx=1,sy=0.55)
sh.add(f'<ellipse cx="{cx}" cy="{base-30-4*38+6}" rx="20" ry="12" fill="#07060f" stroke="#5b3a8a" stroke-width="3"/>'); eye1(sh,cx,base-30-4*38+6,9,iris='#b3263a')
sh.note(cx,748,'a stack of polygons, one side fewer each','middle')
# gate
cx=560; cy=600
sh.add(f'<polygon points="{poly(cx,cy,62,12)}" fill="none" stroke="#c8913a" stroke-width="9" stroke-linejoin="round"/>')
sh.add(f'<polygon points="{poly(cx,cy,62,12)}" fill="none" stroke="{INK}" stroke-width="2"/>')
body(sh,3,cx,cy,70,'#5b3a8a'); body(sh,3,cx,cy,70,'#b9a6ff',rot=math.pi)
sh.add(f'<circle cx="{cx}" cy="{cy}" r="12" fill="#07060f"/>')
sh.add(f'<rect x="{cx-30}" y="{cy+62}" width="60" height="14" fill="#4a3e6a" stroke="{INK}" stroke-width="2"/>')
sh.note(cx,748,'a ring, two counter-turning triangles, a plinth')
# kite
cx=920; cy=590
for (a,b,c,col) in [((0,-60),(-38,-6),(0,-6),'#e8dcc8'),((0,-60),(38,-6),(0,-6),'#5b3a8a'),((-38,-6),(0,64),(0,-6),'#5b3a8a'),((38,-6),(0,64),(0,-6),'#e8dcc8')]:
    sh.add(f'<polygon points="{cx+a[0]},{cy+a[1]} {cx+b[0]},{cy+b[1]} {cx+c[0]},{cy+c[1]}" fill="{col}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
sh.add(f'<path d="M{cx} {cy+64} C {cx-25} {cy+80}, {cx+20} {cy+95}, {cx-10} {cy+110}" fill="none" stroke="#e8dcc8" stroke-width="2.5"/>')
for yy in (82,104): sh.add(f'<path d="M{cx-5} {cy+yy} l-10 -6 l1 12 z M{cx-5} {cy+yy} l10 -6 l-1 12 z" fill="#b3263a" stroke="{INK}" stroke-width="1"/>')
eye1(sh,cx,cy-6,10,iris='#b3263a')
sh.note(cx,748,'a diamond of four triangles, a tail of bows')
# star body
cx=1230; cy=610
pts=[(cx-90,cy+40),(cx-40,cy-30),(cx+20,cy+10),(cx+80,cy-50)]
for a,b in zip(pts,pts[1:]): sh.add(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#9fd8ff" stroke-width="2" opacity="0.7"/>')
for p in pts: sh.add(f'<polygon points="{poly(p[0],p[1],9,5)}" fill="#f6efe3" stroke="#c8913a" stroke-width="1.5"/>')
eye1(sh,cx+80,cy-50,12,iris='#b3263a')
sh.note(cx,748,'stars joined by lines: a constellation')
sh.save('02-shapes.svg')

# ---------- 03 faces ----------
sh=Sheet(1400,560,'3 · Faces and eyes','Eyes make a shape a character. What they look at says what it is paying attention to.')
moods=[('idle','Idle'),('happy','Pleased (a grin)'),('hurt','Hurt'),('determined','Determined (dash)'),('surprised','Surprised'),('sleepy','Asleep / idle long')]
for i,(m,t) in enumerate(moods):
    x=40+i*225; sh.panel(x,110,205,190); cx=x+102
    body(sh,'square',cx,210,96,WHITE); face(sh,cx,210,96,m); sh.label(cx,138,t,15)
sh.label(40,335,'One-eyed characters',16,TXT,'start')
ones=[('Tracking',dict(look=(1,0))),('Browed (aggressive)',dict(look=(0.6,0.3),brow=True)),('Half-lidded (idle)',dict(look=(0,0.4),lid=0.45)),('Wide, red iris (awake, sees you)',dict(iris='#b3263a'))]
for i,(t,kw) in enumerate(ones):
    x=40+i*335; sh.panel(x,350,320,180); cx=x+160
    body(sh,'circle' if i<2 else 11,cx,450,100,['#ff8a2a','#e0453a','#5b3a8a','#5b3a8a'][i])
    eye1(sh,cx,448,22,**kw); sh.label(cx,375,t,14)
sh.save('03-faces.svg')

# ---------- 04 motion ----------
sh=Sheet(1400,640,'4 · Motion: squash, stretch and effects','Shapes stay simple; how they move does the work. Scale x × y keeps the area roughly the same, then springs back.')
frames=[('Idle','1 × 1',1,1,'idle','idle'),('Jump','0.72 × 1.32',0.72,1.32,'idle','up'),('Rising','0.85 × 1.15',0.85,1.15,'idle','up'),('Land (hard)','1.4 × 0.6',1.4,0.6,'idle','idle'),('Stomp / hurt','1.35 × 0.7',1.35,0.7,'happy','up'),('Wall slide','0.9 × 1.1',0.9,1.1,'determined','wall')]
for i,(t,v,sx,sy,m,hp) in enumerate(frames):
    x=40+i*225; sh.panel(x,110,205,280); cx=x+102; floor=330
    sh.add(f'<line x1="{x+15}" y1="{floor+10}" x2="{x+190}" y2="{floor+10}" stroke="#3a3a4a" stroke-width="3"/>')
    S=80; b=floor
    if t!='Jump' and t!='Rising': feet(sh,cx,b,S*0.75)
    bb=b-(0 if t not in ('Jump','Rising') else 30)
    by=bb-S*sy/2
    body(sh,'square',cx,by,S,WHITE,sx=sx,sy=sy)
    face(sh,cx,by,S,m)
    hands(sh,cx,by,S*0.8,hp)
    if t=='Land (hard)':
        for d in (-1,1):
            for j in range(3): sh.add(f'<rect x="{cx+d*(60+j*16)-4:.0f}" y="{floor+2-j*5}" width="{8-j}" height="{8-j}" fill="#b4b4c6" opacity="{0.8-j*0.2}"/>')
    sh.label(cx,138,t,15); sh.note(cx,370,v)
sh.panel(40,410,1320,200)
# dash streak
cx=230; cy=510
for j in range(4): sh.add(f'<rect x="{cx-140+j*26}" y="{cy-20}" width="48" height="40" fill="{POWER}" opacity="{0.12+j*0.08}"/>')
body(sh,'square',cx,cy,48,POWER,sx=1.5,sy=0.75); face(sh,cx+6,cy,40,'determined')
sh.note(cx-30,590,'Dash: a streak with fading afterimages')
# dust
cx=470
for j,(dx,dy,s_) in enumerate([(-40,10,10),(-60,-4,8),(-78,-14,6),(40,10,10),(60,-4,8),(78,-14,6),(0,-20,7)]): sh.add(f'<rect x="{cx+dx}" y="{cy+dy}" width="{s_}" height="{s_}" fill="#b4b4c6" opacity="0.8" transform="rotate(20 {cx+dx} {cy+dy})"/>')
sh.note(cx,590,'Dust: small pale squares, drift and fade')
# ring
cx=760
for j,(r,a) in enumerate([(20,0.9),(40,0.55),(62,0.25)]): sh.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.4}" fill="none" stroke="{POWER}" stroke-width="{4-j}" opacity="{a}"/>')
sh.note(cx,590,'Ring: an outline that grows and fades')
# burst
cx=1040
for j in range(10):
    a=j/10*2*math.pi; r=28+(j%3)*14
    sh.add(f'<rect x="{cx+math.cos(a)*r-4:.0f}" y="{cy+math.sin(a)*r-4:.0f}" width="8" height="8" fill="{RED}" transform="rotate({j*23} {cx+math.cos(a)*r:.0f} {cy+math.sin(a)*r:.0f})"/>')
sh.note(cx,590,'Burst: shards in the event\'s colour')
cx=1260
sh.add(f'<rect x="{cx-30}" y="{cy-30}" width="60" height="60" fill="#fff" stroke="{POWER}" stroke-width="4"/>')
sh.note(cx,590,'Flash: a frame of white on a hit')
sh.label(60,440,'Effect vocabulary',16,TXT,'start')
sh.save('04-motion.svg')

# ---------- 05 light ----------
sh=Sheet(1400,620,'5 · Light and darkness','The world sits in the dark; a soft pool of light follows the hero. Characters and effects are never darkened.')
sh.panel(40,110,860,480,'#08080c')
sh.add('<clipPath id="lp"><rect x="40" y="110" width="860" height="480" rx="14"/></clipPath>'); sh.add('<g clip-path="url(#lp)">'); sh.add(f'<ellipse cx="470" cy="380" rx="420" ry="300" fill="url(#pool)"/>')
for (x,y,w) in [(100,520,760),(200,400,180),(560,330,200)]:
    sh.add(f'<rect x="{x}" y="{y}" width="{w}" height="18" fill="#3a3a4a"/><rect x="{x}" y="{y}" width="{w}" height="3" fill="#6a6e96"/>')
for j in range(25):
    import random; random.seed(j)
    x=random.uniform(80,860); y=random.uniform(140,560); d=math.hypot((x-470)/420,(y-380)/300)
    sh.add(f'<rect x="{x:.0f}" y="{y:.0f}" width="4" height="4" fill="#dcdcf0" opacity="{max(0,0.4-d*0.4):.2f}"/>')
hero(sh,470,488,48)
sh.add('</g>')
# enemy in the dark, not darkened
body(sh,'circle',800,490,52,'#ff8a2a'); eye1(sh,800,488,10,look=(-1,0))
sh.add(f'<circle cx="190" cy="370" r="60" fill="url(#glow)"/><rect x="185" y="380" width="10" height="20" fill="#e8dcc8"/><ellipse cx="190" cy="374" rx="4" ry="7" fill="#ffcf7a"/>')
sh.note(470,140,'The room falls into darkness at the edges of the screen')
sh.note(780,560,'Enemies stay fully bright in the dark')
sh.note(190,440,'Local lights: additive glows')
sh.panel(920,110,440,480)
sh.label(940,145,'How it works',16,TXT,'start')
lines=['A radial gradient over the room: clear in the middle,',
 'falling to ~90% black near the screen edge.',
 'It follows the hero and scales with the camera zoom',
 '(sized from the screen diagonal, not world units).','',
 'Layer order, back to front:',
 '  room background, platforms, decoration',
 '  drifting motes (they only show near the light)',
 '  THE DARKNESS',
 '  effects, shots, enemies, the hero','',
 'Glows (candles, charge-ups, beams) use additive',
 'blending, built from several faint layers rather',
 'than one bright disc.','',
 'Light can be a resource: shrink the pool, snuff',
 'local lights, give light back as a reward.']
for i,l in enumerate(lines): sh.label(940,175+i*22,l,13,MUTED,'start','400')
sh.save('05-light.svg')

# ---------- 06 readability ----------
sh=Sheet(1400,760,'6 · Readability: tells, vulnerability, death, size','A fast game is read in silhouettes and colours. Every state that matters must look different.')
sh.label(40,125,'Tell: heat towards white before an attack',16,TXT,'start')
cols=['#ff8a2a','#ffa85a','#ffcf9a','#fff0d8']
for i,c in enumerate(cols):
    cx=110+i*150; cy=210
    if i: sh.add(f'<circle cx="{cx}" cy="{cy}" r="{40+i*10}" fill="url(#hot)"/>')
    body(sh,'circle',cx,cy,70,c,sx=1+i*0.05,sy=1-i*0.06); eye1(sh,cx,cy-2,13,look=(1,0))
    sh.note(cx,280,['calm','wind-up','charging','about to go'][i])
sh.note(325,305,'+ a rising sound, a pose change, and (for ranged) an aim line that tracks, then locks')
sh.label(740,125,'Vulnerable: change the silhouette, not just the colour',16,TXT,'start')
cx=840; cy=210
for (a,b,c,col) in [((0,-60),(-38,-6),(0,-6),'#e8dcc8'),((0,-60),(38,-6),(0,-6),'#5b3a8a'),((-38,-6),(0,64),(0,-6),'#5b3a8a'),((38,-6),(0,64),(0,-6),'#e8dcc8')]:
    sh.add(f'<polygon points="{cx+a[0]},{cy+a[1]} {cx+b[0]},{cy+b[1]} {cx+c[0]},{cy+c[1]}" fill="{col}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
eye1(sh,cx,cy-6,9,lid=0.5)
sh.note(cx,295,'flying: wide, eye narrowed')
cx=1080; cy=210
for (a,b,c,col) in [((0,-80),(-18,-10),(0,-10),'#e8dcc8'),((0,-80),(18,-10),(0,-10),'#5b3a8a'),((-18,-10),(0,46),(0,-10),'#5b3a8a'),((18,-10),(0,46),(0,-10),'#e8dcc8')]:
    sh.add(f'<polygon points="{cx+a[0]},{cy+a[1]} {cx+b[0]},{cy+b[1]} {cx+c[0]},{cy+c[1]}" fill="{col}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
eye1(sh,cx,cy-10,13,iris='#b3263a')
sh.add(f'<rect x="{cx-60}" y="{cy+46}" width="120" height="10" fill="#6a4a36" stroke="{INK}" stroke-width="2"/>')
sh.note(cx,295,'perched: tall, narrow, eye wide open')
sh.label(40,360,'Death: break into pieces of your own shape',16,TXT,'start')
for i,(shp,col) in enumerate([('circle','#ff8a2a'),(3,'#5ee36a'),(5,'#e0453a')]):
    cx=140+i*230; cy=470
    import random; random.seed(i+3)
    for j in range(7):
        a=j/7*2*math.pi+0.3; r=40+random.uniform(0,25)
        x=cx+math.cos(a)*r; y=cy+math.sin(a)*r
        if shp=='circle': sh.add(f'<path d="M{x-10:.0f} {y:.0f} A 14 14 0 0 1 {x+10:.0f} {y-4:.0f} L {x+6:.0f} {y+2:.0f} A 9 9 0 0 0 {x-7:.0f} {y+5:.0f} Z" fill="{col}" stroke="{INK}" stroke-width="1.5" transform="rotate({j*50} {x:.0f} {y:.0f})"/>')
        else: sh.add(f'<polygon points="{poly(x,y,9,shp,j)}" fill="{col}" stroke="{INK}" stroke-width="1.5"/>')
sh.note(370,555,'arcs of a circle · little triangles · heavy pentagon chunks')
sh.label(740,360,'Size ladder: danger is read from size first',16,TXT,'start')
base=560
items=[('square',48,WHITE,'hero 1×'),(3,30,'#5ee36a','small, fast'),('circle',53,'#ff8a2a','1.1×'),(5,96,'#e0453a','2×'),(12,190,'#c8913a','boss 4×')]
x=760
for shp,S,col,t in items:
    cx=x+S/2
    body(sh,shp,cx,base-S/2,S,col)
    if shp=='square': face(sh,cx,base-S/2,S)
    else: eye1(sh,cx,base-S/2,S*0.14,look=(-0.5,0))
    sh.note(cx,base+22,t); x+=S+30
sh.add(f'<line x1="750" y1="{base+2}" x2="1360" y2="{base+2}" stroke="#3a3a4a" stroke-width="3"/>')
sh.panel(40,600,1320,130)
sh.label(60,632,'Checklist for any new character',16,TXT,'start')
chk=['Recognisable as a shape, in silhouette, at true size, in the dark?','Has eyes, and the eyes do something?','Not in the hero\'s colours, or damage red (unless that is the point)?',
 'Its attack has a tell: heat, pose, sound, a marker?','Its vulnerable state reads at a glance?','It dies in pieces of its own shape?']
for i,c in enumerate(chk): sh.label(60+(i%2)*650,660+(i//2)*24,'☐ '+c,13,MUTED,'start','400')
sh.save('06-readability.svg')

# ---------- 07 colour ----------
sh=Sheet(1400,760,'7 · Colour','Colour has jobs. Give each job one colour family and never let another thing borrow it.')
roles=[('Hero','#f2f2f2','the player\'s body'),('Power','#8fd3ff','the hero\'s abilities'),('Damage','#ff5a5a','getting hurt, health loss'),('Reward','#ffcf4a','currency, buying, pickups'),('Hot tell','#fff0d8','about to attack'),('Ink','#1a1a26','every outline')]
for i,(t,c,n) in enumerate(roles):
    x=40+i*225; sh.panel(x,110,205,150)
    sh.add(f'<rect x="{x+20}" y="{125}" width="165" height="60" rx="8" fill="{c}" stroke="#6a6a80" stroke-width="2"/>')
    sh.label(x+102,212,t,15); sh.note(x+102,234,c); sh.note(x+102,252,n)
sh.label(40,300,'A world palette, built the same way every time',16,TXT,'start')
recipe=[('Background','very dark, low saturation'),('Surfaces','dark, a step lighter'),('Blocks / walls','between the two'),('Lit edge','a light tint, 3 px on tops'),('Accent 1','the world\'s signature colour'),('Accent 2','its opposite or partner'),('Danger','its own red or hot colour')]
worlds=[('Gothic',['#140e24','#4a3e6a','#332a4c','#7a6ea0','#c8913a','#5b3a8a','#b3263a']),
 ('Frozen',['#0c1a2a','#2f5578','#132a44','#9fd2ec','#4fe3ff','#8a7dff','#ff5a7a']),
 ('Volcanic',['#1a1414','#4a3a36','#2b1c18','#8a6a5a','#ff8a2a','#ffb547','#ff3a1f']),
 ('Solarpunk',['#1f3a2c','#3f9a55','#2a6f86','#fff1b8','#ffd166','#ff8fb0','#e0453a'])]
for j,(r,d) in enumerate(recipe):
    y=330+j*52
    sh.label(40,y+30,r,14,TXT,'start'); sh.note(40,y+46,d,'start')
for i,(w,cs) in enumerate(worlds):
    x=300+i*265; sh.label(x+110,322,w,15)
    for j,c in enumerate(cs):
        sh.add(f'<rect x="{x}" y="{335+j*52}" width="220" height="42" rx="6" fill="{c}" stroke="#3a3a4a"/>')
        sh.add(f'<text x="{x+210}" y="{361+j*52}" fill="{"#1a1a26" if j in (3,4,5) and i!=0 else "#ffffffaa"}" font-size="11" text-anchor="end">{c}</text>')
sh.note(700,722,'Characters carry the saturation; rooms stay darker and duller than anything that moves.')
sh.note(700,742,'Gothic is the finished palette from simple-shooter; the other three are illustrative, filled out from early mockups.')
sh.save('07-colour.svg')
print('ok')
