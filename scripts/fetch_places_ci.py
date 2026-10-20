import json, csv, urllib.request, urllib.parse
q = {"$where": "countyfips='13121' AND measureid in('ACCESS2','CHECKUP')", "$limit": "5000"}
url = "https://data.cdc.gov/resource/cwsq-ngmh.json?" + urllib.parse.urlencode(q)
rows = json.load(urllib.request.urlopen(url, timeout=60))
print("rows:", len(rows)); print("fields:", sorted(rows[0].keys()) if rows else None)
keep = ["locationname", "measureid", "data_value", "low_confidence_limit", "high_confidence_limit", "year"]
with open("/home/" + __import__("getpass").getuser() + "/scratch/places_ci.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["geo_id","measure","value","low","high","year"])
    for r in rows: w.writerow([r.get(k) for k in keep])
print("wrote places_ci.csv")
