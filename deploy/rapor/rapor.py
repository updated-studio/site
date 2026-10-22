"""Eski site raporu: etiketler, görsellerin kullanımı, sıkıştırma karşılaştırması. Hiçbir şeyi değiştirmez; çıktı rapor/ klasörüne yazılır."""
import json, os, re, base64, urllib.request, urllib.parse, collections
WP = os.environ.get('WP_URL', 'https://updated.com.tr').rstrip('/'); PANEL = 'https://panel.updated.com.tr'
auth = 'Basic ' + base64.b64encode(f"{os.environ['WP_USER']}:{os.environ['WP_APP_PASSWORD']}".encode()).decode()
os.makedirs('rapor', exist_ok=True)
def get(u, a=True):
    r = urllib.request.Request(u, headers={'User-Agent': 'updated-rapor', **({'Authorization': auth} if a else {})})
    with urllib.request.urlopen(r, timeout=60) as x: return json.loads(x.read()), dict(x.headers)
def hepsi(path, **q):
    out, p = [], 1
    while True:
        qs = urllib.parse.urlencode({'per_page': 100, 'page': p, **q})
        try: d, h = get(f'{WP}/wp-json/wp/v2/{path}?{qs}')
        except Exception as e: print('hata', path, p, e); break
        out += d
        if p >= int(h.get('X-WP-TotalPages') or h.get('x-wp-totalpages') or 1): break
        p += 1
    return out
R = []
import traceback, sys
def _hata(t, v, tb):
    open('rapor/hata.txt', 'w').write(''.join(traceback.format_exception(t, v, tb)) + '\n\nKısmi:\n' + '\n'.join(R))
    sys.__excepthook__(t, v, tb)
sys.excepthook = _hata
# 1) Etiketler
tags = hepsi('tags', _fields='id,name,slug,count')
cnt = collections.Counter('0' if t['count'] == 0 else '1' if t['count'] == 1 else '2-4' if t['count'] < 5 else '5-9' if t['count'] < 10 else '10+' for t in tags)
R += ['ETİKETLER', f'toplam {len(tags)} · kullanım dağılımı (kaç yazıda): ' + ', '.join(f'{k}: {cnt[k]}' for k in ['0', '1', '2-4', '5-9', '10+'])]
R += ['en çok kullanılan 40: ' + ' | '.join(f"{t['name']} ({t['count']})" for t in sorted(tags, key=lambda t: -t['count'])[:40])]
R += ['rastgele 1 yazılık örnekler: ' + ' | '.join(t['name'] for t in [t for t in tags if t['count'] == 1][::max(1, cnt['1'] // 30)][:30])]
# 2) Görsellerin kullanımı
base = lambda u: re.sub(r'(-\d+x\d+|-scaled|-e\d{10,})+$', '', os.path.splitext(urllib.parse.unquote(urllib.parse.urlparse(u).path).split('/')[-1])[0]).lower()
media = hepsi('media', _fields='id,source_url,post,media_details,mime_type', context='edit')
yazilar = {s: hepsi('posts', status=s, _fields='id,content,featured_media', context='edit') for s in ['publish', 'draft', 'pending', 'private', 'future']}
sayfalar = hepsi('pages', status='publish,draft,private', _fields='id,content,featured_media', context='edit')
def refs(items):
    ids, names = set(), set()
    for p in items:
        if p.get('featured_media'): ids.add(p['featured_media'])
        c = (p.get('content') or {}); c = c.get('raw') or c.get('rendered') or ''
        ids |= {int(x) for x in re.findall(r'wp-image-(\d+)|"id":(\d+)', c) for x in x if x}
        names |= {base(u) for u in re.findall(r'wp-content/uploads/[^"\'\s)>]+', c)}
    return ids, names
yayin = refs(yazilar['publish']); taslak = refs(sum((yazilar[s] for s in ['draft', 'pending', 'private', 'future']), [])); sayfa = refs(sayfalar)
try:
    ayar = urllib.request.urlopen(urllib.request.Request(WP + '/', headers={'User-Agent': 'updated-rapor'}), timeout=60).read().decode('utf8', 'ignore')
    sablon = {base(u) for u in re.findall(r'wp-content/uploads/[^"\'\s)>]+', ayar)}
except Exception: sablon = set()
kume = collections.Counter(); ornek = collections.defaultdict(list); boyut = collections.Counter()
for m in media:
    b = base(m['source_url']); i = m['id']
    hit = lambda r: i in r[0] or b in r[1]
    k = 'yayındaki yazıda' if hit(yayin) else 'yalnız taslakta' if hit(taslak) else 'sayfada' if hit(sayfa) else 'sitenin tasarımında (logo, banner…)' if b in sablon else 'yazıya eklenmiş ama metinde yok' if m.get('post') else 'hiçbir yerde'
    if k == 'yazıya eklenmiş ama metinde yok':
        ust = m['post']; st = next((s_ for s_, L in yazilar.items() if any(x['id'] == ust for x in L)), 'sayfa' if any(x['id'] == ust for x in sayfalar) else 'silinmiş')
        k = f'{k} (bağlı olduğu yazı: {st})'
    kume[k] += 1; boyut[k] += (m.get('media_details') or {}).get('filesize') or 0
    if len(ornek[k]) < 12: ornek[k].append(m['source_url'].split('/wp-content/uploads/')[-1])
R += ['', 'WORDPRESS GÖRSELLERİ', f'toplam {len(media)}'] + [f'{k}: {v} görsel · {boyut[k] / 1e6:.1f} MB' for k, v in kume.most_common()]
for k in ornek:
    if k != 'yayındaki yazıda': R += [f'  örnek ({k}): ' + ' | '.join(ornek[k])]
# 3) Sıkıştırma: WordPress'teki asıl dosya ↔ paneldeki
wpboy = {base(m['source_url']): (m.get('media_details') or {}).get('filesize') or 0 for m in media}
pm, _ = get(f'{PANEL}/api/media?limit=2000&depth=0', a=False)
top_wp = top_asil = top_tur = n = 0; tur = collections.Counter(); satir = []
for d in pm['docs']:
    w = wpboy.get(base(d.get('sourceUrl') or ''), 0)
    if not w: continue
    n += 1; top_wp += w; top_asil += d.get('filesize') or 0
    for s, v in (d.get('sizes') or {}).items():
        if v and v.get('filesize'): tur[s] += v['filesize']; top_tur += v['filesize']
    if len(satir) < 8: satir.append(f"{d.get('filename')}: WP {w / 1024:.0f} KB → asıl {(d.get('filesize') or 0) / 1024:.0f} KB {d.get('width')}x{d.get('height')} · kart {(((d.get('sizes') or {}).get('card') or {}).get('filesize') or 0) / 1024:.0f} KB · kapak {(((d.get('sizes') or {}).get('hero') or {}).get('filesize') or 0) / 1024:.0f} KB")
R += ['', 'SIKIŞTIRMA', f'karşılaştırılan {n} görsel · WordPress asıl: {top_wp / 1e6:.1f} MB · paneldeki asıl (WebP): {top_asil / 1e6:.1f} MB · sitede kullanılan türevler toplamı: {top_tur / 1e6:.1f} MB']
R += ['türevler: ' + ', '.join(f'{k} {v / 1e6:.1f} MB' for k, v in tur.items())] + satir
open('rapor/rapor.txt', 'w').write('\n'.join(R)); print('\n'.join(R))
json.dump({'etiketler': sorted(tags, key=lambda t: -t['count'])}, open('rapor/etiketler.json', 'w'), ensure_ascii=False)
