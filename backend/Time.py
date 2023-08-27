from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")


def hijri_month_name(month_number):
    hijri_months = [
        "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-Thani", "Jumada al-awwal",
        "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul-Qi'dah", "Dhul-Hijjah"
    ]
    return hijri_months[int(month_number) - 1]


def get_next_prayer_countdown(current_time, prayer_timings):
    current_time_obj = datetime.strptime(current_time, "%H:%M:%S WIB")
    min_diff = None
    next_prayer = None

    for prayer, time in prayer_timings.items():
        prayer_time_obj = datetime.strptime(time.split()[0], "%H:%M")
        if current_time_obj < prayer_time_obj:
            time_diff = prayer_time_obj - current_time_obj
            if not min_diff or time_diff < min_diff:
                min_diff = time_diff
                next_prayer = prayer

    return next_prayer, min_diff


@app.route('/times', methods=['GET'])
def times():
    with webdriver.Chrome(options=chrome_options) as driver:

        earthquake_response = requests.get(
            "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml")
        earthquake_soup = BeautifulSoup(earthquake_response.content, 'xml')
        gempa_data = earthquake_soup.find('gempa')

        earthquake_info = {
            'Tanggal': gempa_data.find('Tanggal').text,
            'Jam': gempa_data.find('Jam').text,
            'DateTime': gempa_data.find('DateTime').text,
            'Coordinates': gempa_data.find('coordinates').text,
            'Lintang': gempa_data.find('Lintang').text,
            'Bujur': gempa_data.find('Bujur').text,
            'Magnitude': gempa_data.find('Magnitude').text,
            'Kedalaman': gempa_data.find('Kedalaman').text,
            'Wilayah': gempa_data.find('Wilayah').text,
            'Potensi': gempa_data.find('Potensi').text,
            'Dirasakan': gempa_data.find('Dirasakan').text,
            'Shakemap': gempa_data.find('Shakemap').text
        }

        forecast_response = requests.get(
            "https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-SumateraBarat.xml")

        forecast_soup = BeautifulSoup(forecast_response.content, 'xml')

        padangpanjang_data = forecast_soup.find(
            'area', {'description': 'Padangpanjang'})

        driver.get("http://jam.bmkg.go.id/Jam.BMKG")
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        time_container = soup.find('span', {'id': 'timecontainer'})

        indonesian_date = time_container.find(
            'div', {'class': 'FontHari'}).text
        indonesian_time = time_container.find(
            'div', {'class': 'FontDigit'}).text
        other_times = time_container.find_all('div', {'class': 'FontDigitU'})
        utc_time = other_times[-1].text

    base_url = "http://api.aladhan.com/v1/timingsByCity"
    params = {
        'city': 'Padang Panjang',
        'country': 'Indonesia',
        'state': 'Sumatera Barat',
        'method': 2
    }

    response = requests.get(base_url, params=params)
    prayer_timings = response.json()['data']['timings']

    next_prayer, countdown = get_next_prayer_countdown(
        indonesian_time.strip(), prayer_timings)

    hijri_raw = response.json()['data']['date']['hijri']['date']
    day, month, year = hijri_raw.split('-')
    hijri_date = f"{int(day)} {hijri_month_name(month)}, {year}"

    weather = {}

    if padangpanjang_data:
        temperature_data = padangpanjang_data.find('parameter', {'id': 'tmax'})
        humidity_data = padangpanjang_data.find('parameter', {'id': 'humax'})

        if temperature_data:
            temperature_value_C = temperature_data.find('value', {'unit': 'C'})
            temperature_value_F = temperature_data.find('value', {'unit': 'F'})

            if temperature_value_C:
                weather['temperature_C'] = temperature_value_C.text

            if temperature_value_F:
                weather['temperature_F'] = temperature_value_F.text

        if humidity_data:
            humidity_value = humidity_data.find('value', {'unit': '%'})
            if humidity_value:
                weather['humidity'] = humidity_value.text

    return jsonify({
        'indonesian_date': indonesian_date.strip(),
        'hijri_date': hijri_date,
        'indonesian_time': indonesian_time.strip(),
        'wita_time': other_times[0].text.strip(),
        'wit_time': other_times[1].text.strip(),
        'utc_time': utc_time.strip(),
        'prayer_times': prayer_timings,
        'next_prayer': next_prayer,
        'countdown': str(countdown),
        'weather_forecast': weather,
        'earthquake': earthquake_info
    })


if __name__ == "__main__":
    app.run(port=3001, debug=True)
