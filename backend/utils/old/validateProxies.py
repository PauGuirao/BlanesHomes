import requests

def validate_proxies(proxy_file, timeout=5):
    working_proxies = []

    with open(proxy_file, "r") as f:
        proxies = [line.strip() for line in f if line.strip()]

    print(f"Total proxies to test: {len(proxies)}")

    for i, proxy in enumerate(proxies, 1):
        proxy_dict = {
            "http": f"http://{proxy}",
            "https": f"http://{proxy}"
        }

        try:
            response = requests.get("https://www.idealista.com/inmueble/104942296/", proxies=proxy_dict, timeout=timeout)
            if response.status_code == 200:
                print(f"[{i}/{len(proxies)}] ✅ Working: {proxy}")
                working_proxies.append(proxy)
            else:
                print(f"[{i}/{len(proxies)}] ❌ Failed: {proxy} (Status {response.status_code})")
        except Exception as e:
            print(f"[{i}/{len(proxies)}] ❌ Failed: {proxy} ({e})")

    # Guardar los buenos
    with open("valid_proxies.txt", "w") as f:
        for wp in working_proxies:
            f.write(wp + "\n")

    print(f"\n✅ {len(working_proxies)} proxies válidos guardados en 'valid_proxies.txt'")

# Ejecutar
validate_proxies("proxy_list.txt")
