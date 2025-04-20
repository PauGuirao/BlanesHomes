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

def main():
    x = 1
    ids = []
    current_datetime = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create directory if it doesn't exist
    save_dir = '../data/idFiles'
    os.makedirs(save_dir, exist_ok=True)
    
    filename = os.path.join(save_dir, f'ids_{current_datetime}.txt')
    
    while True:
        start_time = time.time()
        proxy = '49.51.49.70:13001'
        options = uc.ChromeOptions()
        options.add_argument(f" - proxy-server={proxy}")
        browser = uc.Chrome(
            options=options,
            use_subprocess=False,)
        url = f'https://www.idealista.com/venta-viviendas/blanes-girona/pagina-{x}.htm'
        browser.get(url);
        time.sleep(random.randint(10, 12))

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

        x += 1

        for article in articles:
            id_pisos = article.get('data-element-id')
            if id_pisos != None:
                ids.append(id_pisos)
                print(id_pisos)
            time.sleep(random.randint(1, 3))
        ids = [pisos for pisos in ids if pisos != None]
        
        with open(filename, 'w') as f:
            for piso in ids:
                f.write(piso + '\n')
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f'Time taken to scrape page {x}: {elapsed_time:.2f} seconds')
        
        browser.close()
        #close window
        browser.quit()

if __name__ == "__main__":
    main()