import csv, math, itertools
R = list(csv.DictReader(open('/home/' + __import__('getpass').getuser() + '/scratch/c15.csv')))
for r in R:
    for k in ['latitude','longitude','need_score','w','b','h','wh','a']: r[k] = float(r[k])
COUNTY = {'b': .542, 'h': .084, 'wh': .290, 'a': .054}   # county uninsured shares
def km(p, q):
    p1, p2 = math.radians(p['latitude']), math.radians(q['latitude'])
    dl = math.radians(q['longitude'] - p['longitude'])
    h = math.sin((p2-p1)/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 12742 * math.asin(math.sqrt(h))
out = []
for c in itertools.combinations(R, 4):
    if min(km(p, q) for p, q in itertools.combinations(c, 2)) < 5: continue
    W = sum(r['w'] for r in c)
    ratios = {g: sum(r['w']*r[g] for r in c)/W/COUNTY[g] for g in COUNTY}
    flags = [g for g, v in ratios.items() if v < 0.8]
    out.append((len(flags), -sum(r['need_score'] for r in c), c, ratios, flags, W))
out.sort(key=lambda x: (x[0], x[1]))
print("combos tested:", len(out))
for n, negneed, c, ratios, flags, W in out[:5]:
    print([r['geo_id'][-6:] for r in c], "need=%.2f" % -negneed, "uninsured~%d" % W,
          {g: round(v, 2) for g, v in ratios.items()}, "FLAGS:", flags or "none")
