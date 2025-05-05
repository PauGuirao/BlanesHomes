# This script scrapes property IDs and prices from Idealista for Blanes, Girona, and saves them to a CSV file.

import requests
from bs4 import BeautifulSoup as bs
import random
import time
import pandas as pd
import numpy as np
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import undetected_chromedriver as uc
import time
import re
import datetime
import os
año_actual = datetime.datetime.now().year

def main(city="lloret-de-mar-girona"):
    x = 2
    ids = []
    current_datetime = datetime.datetime.now().strftime("%Y%m%d")
    
    # Create directory if it doesn't exist
    save_dir = '../data/idFiles'
    os.makedirs(save_dir, exist_ok=True)
    
    filename = os.path.join(save_dir, f'ids_{city}_{current_datetime}.csv')
    
    while True:
        start_time = time.time()
        proxy = '49.51.49.70:13001'
        options = uc.ChromeOptions()
        options.add_argument(f" - proxy-server={proxy}")
        browser = uc.Chrome(
            options=options,
            use_subprocess=False,)
        url = f'https://www.idealista.com/venta-viviendas/{city}/pagina-{x}.htm'
        browser.get(url);
        time.sleep(random.randint(8, 10))

        try:
            accept_cookies = browser.find_element("xpath", '//*[@id="didomi-notice-agree-button"]')
            accept_cookies.click()
        except:
            pass
        html = browser.page_source
        soup = bs(html, 'html.parser')

        # get the current pagination
        selected_page = soup.find('li', class_='selected')
        current_page = int(selected_page.find('span').text.strip())
        print(f'Current page: {current_page}')
        if x == current_page:
            articles = soup.find('main', {'class': 'listing-items'}).find_all('article')
        else:
            break

        page_ids = []  # Store IDs from this page
        
        for article in articles:
            id_pisos = article.get('data-element-id')
            precio_elem = article.select_one(".item-price") 
            if id_pisos != None and precio_elem!= None:
                precio_texto = precio_elem.get_text(strip=True)
                precio = re.sub(r'[^\d]', '', precio_texto) 
                page_ids.append({
                    "id": id_pisos,
                    "precio": int(precio) if precio else None
                })
                print(id_pisos)
            time.sleep(random.randint(1, 2))
        
        # Add page IDs to the total list
        ids.extend(page_ids)
        
        # Save the CSV after each page
        if ids:
            df = pd.DataFrame(ids)
            df.to_csv(filename, index=False)
            print(f"💾 Guardados {len(ids)} pisos en {filename} (página {x})")
    
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f'Time taken to scrape page {x}: {elapsed_time:.2f} seconds')
        
        browser.close()
        browser.quit()
        
        x += 1  # Move page increment here

    # Final summary
    if ids:
        print(f"\n✅ Proceso completado. Total: {len(ids)} pisos guardados en {filename}")
    else:
        print("⚠️ No se encontraron pisos.")

if __name__ == "__main__":
    main()