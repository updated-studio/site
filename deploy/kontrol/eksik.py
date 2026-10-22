import json, os, base64, urllib.request, urllib.error, urllib.parse
WP = os.environ.get('WP_URL', 'https://updated.com.tr').rstrip('/')
V2 = 'http://v2.updated.com.tr'; PANEL = 'https://panel.updated.com.tr'
auth = base64.b64encode(f"{os.environ.get('WP_USER','')}:{os.environ.get('WP_APP_PASSWORD','')}".encode()).decode()
def get(u, a=False):
    r = urllib.request.Request(u, headers={'User-Agent': 'updated-kontrol', **({'Authorization': 'Basic ' + auth} if a else {})})
    with urllib.request.urlopen(r, timeout=40) as x: return json.loads(x.read()), dict(x.headers)
def toplam(path):
    try: _, h = get(f'{WP}/wp-json/wp/v2/{path}{"&" if "?" in path else "?"}per_page=1', True); return int(h.get('X-WP-Total') or h.get('x-wp-total') or 0)
    except Exception as e: return f'hata {e}'
def hepsi(path):
    out, p = [], 1
    while True:
        try: d, h = get(f'{WP}/wp-json/wp/v2/{path}{"&" if "?" in path else "?"}per_page=100&page={p}', True)
        except Exception: break
        out += d
        if p >= int(h.get('X-WP-TotalPages') or 1): break
        p += 1
    return out
def durum(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'updated-kontrol'}), timeout=30) as x: return x.status
    except urllib.error.HTTPError as e: return e.code
    except Exception as e: return str(e)[:40]
R = {}
for k in ['posts?status=publish', 'posts?status=draft', 'posts?status=future', 'posts?status=private', 'pages?status=publish', 'categories', 'tags', 'comments', 'users', 'media']:
    R['WP ' + k] = toplam(k)
for k in ['news', 'reviews', 'categories', 'authors', 'media', 'pages', 'tags']:
    try: R['Panel ' + k] = get(f'{PANEL}/api/{k}?limit=1&depth=0')[0].get('totalDocs')
    except Exception as e: R['Panel ' + k] = f'yok ({str(e)[:30]})'
eksik = []
for p in hepsi('posts?status=publish&_fields=link'):
    path = urllib.parse.urlparse(p['link']).path.rstrip('/') or '/'
    s = durum(V2 + path)
    if s != 200: eksik.append(f'{path} → {s}')
sayfalar = []
for p in hepsi('pages?status=publish&_fields=link,title'):
    path = urllib.parse.urlparse(p['link']).path.rstrip('/') or '/'
    sayfalar.append(f"{path} ({p['title']['rendered'][:40]}) → {durum(V2 + path)}")
kat = []
for c in hepsi('categories?hide_empty=1&_fields=link,count'):
    path = urllib.parse.urlparse(c['link']).path.rstrip('/')
    s = durum(V2 + path)
    if s != 200: kat.append(f'{path} ({c["count"]}) → {s}')
try: menu = [i['title']['rendered'] + ' ' + i['url'] for i in get(f'{WP}/wp-json/wp/v2/menu-items?per_page=100', True)[0]]
except Exception as e: menu = [f'okunamadı {str(e)[:40]}']
rap = ['SAYILAR'] + [f'{k}: {v}' for k, v in R.items()] + [f'', f'v2de AÇILMAYAN YAZI: {len(eksik)}'] + eksik[:40] + ['', 'WP SAYFALARI'] + sayfalar + ['', 'AÇILMAYAN KATEGORİ'] + kat + ['', 'MENÜ'] + menu[:40]
txt = '\n'.join(rap); print(txt)
open(os.environ.get('GITHUB_STEP_SUMMARY', '/dev/null'), 'a').write('```\n' + txt + '\n```\n')
for i in range(0, len(txt), 3500): print('::notice title=Eksik kontrolü ' + str(i // 3500 + 1) + '::' + txt[i:i+3500].replace('%', '%25').replace('\n', '%0A'))
