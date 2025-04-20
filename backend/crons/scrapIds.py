import requests
from bs4 import BeautifulSoup as bs
import random
import time
import pandas as pd
import numpy as np
from selenium import webdriver
from selenium.webdriver.common.by import By
import undetected_chromedriver as uc
import datetime
import os
import zipfile

año_actual = datetime.datetime.now().year

# 🧠 Tu usuario y pass de Oxylabs
OXYLABS_USER = "pgc02_BlDXu"
OXYLABS_PASS = "XVz33uC.12345"
OXYLABS_HOST = "dc.oxylabs.io"
OXYLABS_PORT = 8001

def create_proxy_extension(user, password, host, port):
    """Crea un plugin ZIP para la autenticación de proxy."""
    manifest_json = """
    {
        "version": "1.0.0",
        "manifest_version": 2,
        "name": "Chrome Proxy",
        "permissions": ["proxy", "tabs", "unlimitedStorage", "storage", "<all_urls>", "webRequest", "webRequestBlocking"],
        "background": {
            "scripts": ["background.js"]
        },
        "minimum_chrome_version": "22.0.0"
    }
    """
    background_js = f"""
    var config = {{
            mode: "fixed_servers",
            rules: {{
              singleProxy: {{
                scheme: "http",
                host: "{host}",
                port: parseInt({port})
              }},
              bypassList: ["localhost"]
            }}
          }};
    
    chrome.proxy.settings.set({{value: config, scope: "regular"}}, function() {{}});
    
    chrome.webRequest.onAuthRequired.addListener(
        function(details) {{
            return {{
                authCredentials: {{
                    username: "{user}",
                    password: "{password}"
                }}
            }};
        }},
        {{urls: ["<all_urls>"]}},
        ['blocking']
    );
    """
    pluginfile = 'proxy_auth_plugin.zip'
    with zipfile.ZipFile(pluginfile, 'w') as zp:
        zp.writestr("manifest.json", manifest_json)
        zp.writestr("background.js", background_js)
    return pluginfile

def main():
    x = 1
    ids = []
    current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    save_dir = '../data/idFiles'
    os.makedirs(save_dir, exist_ok=True)
    filename = os.path.join(save_dir, f'ids_{current_datetime}.txt')

    while True:
        start_time = time.time()

        proxy_extension = create_proxy_extension(OXYLABS_USER, OXYLABS_PASS, OXYLABS_HOST, OXYLABS_PORT)
        options = uc.ChromeOptions()
        # quiero ver el navegador

        #options.add_argument("--headless=new")  # Opcional si usas xvfb
        options.add_extension(proxy_extension)
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

        browser = uc.Chrome(options=options, use_subprocess=False)

        url = f'https://www.idealista.com/venta-viviendas/blanes-girona/pagina-{x}.htm'
        browser.get(url)
        time.sleep(random.randint(10, 12))

        try:
            accept_cookies = browser.find_element("xpath", '//*[@id="didomi-notice-agree-button"]')
            accept_cookies.click()
        except:
            pass

        html = browser.page_source
        soup = bs(html, 'html.parser')

        selected_page = soup.find('li', class_='selected')
        if selected_page:
            current_page = int(selected_page.find('span').text.strip())
            print(f'Current page: {current_page}')
        else:
            print("❌ No se detectó la página actual. ¿Bloqueado?")
            break

        if x == current_page:
            articles = soup.find('main', {'class': 'listing-items'}).find_all('article')
        else:
            break

        x += 1

        for article in articles:
            id_pisos = article.get('data-element-id')
            if id_pisos:
                ids.append(id_pisos)
                print(id_pisos)
            time.sleep(random.randint(1, 3))

        ids = [pisos for pisos in ids if pisos]
        with open(filename, 'w') as f:
            for piso in ids:
                f.write(piso + '\n')

        elapsed_time = time.time() - start_time
        print(f'Time taken to scrape page {x}: {elapsed_time:.2f} seconds')

        browser.quit()

if __name__ == "__main__":
    main()
