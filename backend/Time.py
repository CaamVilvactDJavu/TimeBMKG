from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
# Update this with the path to your chromedriver


@app.route('/times', methods=['GET'])
def times():
    # Fetch BMKG times using Selenium
    with webdriver.Chrome(options=chrome_options) as driver:
        driver.get("http://jam.bmkg.go.id/Jam.BMKG")

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        time_container = soup.find('span', {'id': 'timecontainer'})

        indonesian_date = time_container.find(
            'div', {'class': 'FontHari'}).text
        indonesian_time = time_container.find(
            'div', {'class': 'FontDigit'}).text
        other_times = time_container.find_all('div', {'class': 'FontDigitU'})
        english_date = time_container.find('div', {'class': 'FontHariU'}).text
        utc_time = other_times[-1].text

    # Fetch prayer times using the Aladhan API
    base_url = "http://api.aladhan.com/v1/timingsByCity"
    params = {
        'city': 'Padang Panjang',
        'country': 'Indonesia',
        'state': 'Sumatera Barat',
        'method': 2  # Commonly used calculation method for Indonesia.
    }

    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        prayer_timings = response.json().get('data', {}).get('timings', {})
    else:
        return jsonify({'error': 'Could not fetch data'}), 500

    return jsonify({
        'indonesian_date': indonesian_date.strip(),
        'indonesian_time': indonesian_time.strip(),
        'wita_time': other_times[0].text.strip(),
        'wit_time': other_times[1].text.strip(),
        'english_date': english_date.strip(),
        'utc_time': utc_time.strip(),
        'prayer_times': prayer_timings
    })


if __name__ == "__main__":
    app.run(port=3001, debug=True)
