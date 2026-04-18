# PROBELMS WITH CONNCETION TO CKAN API, TIME OUTS OCCUR FREQUENTLY

import requests
import time

group_list_url = "https://www.daten-bw.de/ckan/api/3/action/group_list"

def safe_get(url, retries=3, delay=2):
    for attempt in range(retries):
        try:
            return requests.get(url, timeout=10)
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                print(f"Request failed for {url}: {e}")
                return None

response = safe_get(group_list_url)
if not response or response.status_code != 200:
    print("Could not fetch group list from daten-bw.de")
    exit(1)

group_ids = response.json().get("result", [])

print("Categories:\n")

for group_id in group_ids:
    group_show_url = f"https://www.daten-bw.de/ckan/api/3/action/group_show?id={group_id}"
    group_resp = safe_get(group_show_url)
    if not group_resp or group_resp.status_code != 200:
        print(f"Could not fetch group data for {group_id}")
        continue
    group_data = group_resp.json().get("result", {})
    title_en = group_data.get("title_translated", {}).get("en", group_data.get("display_name", group_id))

    search_url = f"https://www.daten-bw.de/ckan/api/3/action/package_search?q=groups:{group_id}"
    search_resp = safe_get(search_url)
    if not search_resp or search_resp.status_code != 200:
        print(f"Could not fetch dataset count for {group_id}")
        continue
    result = search_resp.json().get("result", {})
    count = result.get("count", 0)
    if count > 0:
        print(f"{title_en} ({count})")
