from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
# Update this with the path to your chromedriver


def get_next_prayer_countdown(current_time, prayer_timings):
    # Parse current time
    current_time_obj = datetime.strptime(current_time, "%H:%M:%S WIB")

    # Find the next prayer and its time difference
    min_diff = None
    next_prayer = None

    for prayer, time in prayer_timings.items():
        # Parse prayer time
        prayer_time_obj = datetime.strptime(time.split()[0], "%H:%M")

        # If the prayer time is in the future
        if current_time_obj < prayer_time_obj:
            time_diff = prayer_time_obj - current_time_obj
            if not min_diff or time_diff < min_diff:
                min_diff = time_diff
                next_prayer = prayer

    return next_prayer, min_diff


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

    next_prayer, countdown = get_next_prayer_countdown(
        indonesian_time.strip(), prayer_timings)

    return jsonify({
        'indonesian_date': indonesian_date.strip(),
        'indonesian_time': indonesian_time.strip(),
        'wita_time': other_times[0].text.strip(),
        'wit_time': other_times[1].text.strip(),
        'english_date': english_date.strip(),
        'utc_time': utc_time.strip(),
        'prayer_times': prayer_timings,
        'next_prayer': next_prayer,
        'countdown': str(countdown)
    })


if __name__ == "__main__":
    app.run(port=3001, debug=True)
