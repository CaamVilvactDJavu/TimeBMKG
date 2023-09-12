from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS
import requests
from datetime import datetime
from functools import lru_cache

app = Flask(__name__)
CORS(app)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")


@lru_cache(maxsize=32)
def get_page_content():
    with webdriver.Chrome(options=chrome_options) as driver:
        driver.get("https://mhews.bmkg.go.id/sumatera-barat-forecast")
        return driver.page_source


def get_earthquake_info():
    with webdriver.Chrome(options=chrome_options) as driver:
        driver.get("https://inatews.bmkg.go.id/wrs/index.html")
        soup = BeautifulSoup(driver.page_source, 'html.parser')

    earthquake_coordinates = soup.find("p", {"id": "point"})
    if earthquake_coordinates:
        coordinates_text = earthquake_coordinates.text.strip()
        lon_str, lat_str = coordinates_text.split(", ")

        try:
            lat = float(lat_str.split(" ")[0])
            lon = float(lon_str.split(" ")[0])
        except ValueError:
            print(
                f"Error: Could not extract coordinates from {coordinates_text}")
            return {}

        if 0.74 <= lat <= 90 and 0 <= lon <= 100.80 and 'BT' in lon_str and 'LU' in lat_str:
            earthquake_magnitude = soup.find("h1", {"id": "mag"})
            if earthquake_magnitude:
                earthquake_magnitude = earthquake_magnitude.text.strip()
            earthquake_time = soup.find("p", {"id": "timelapse"})
            if earthquake_time:
                earthquake_time = earthquake_time.text.split(": ")[1].strip()
            footer_card = soup.find("div", {"class": "card-body px-1"})
            if not footer_card:
                print("Error: Footer card not found!")
                return {}
            earthquake_date = footer_card.find("p", {"id": "tanggal"})
            if earthquake_date:
                earthquake_date = earthquake_date.text.split()[-2]
            earthquake_depth = footer_card.find("div", {"id": "depth"})
            if earthquake_depth:
                earthquake_depth = earthquake_depth.text
            earthquake_description = soup.find("p", {"id": "deskripsi"})
            if earthquake_description:
                earthquake_description = earthquake_description.text.strip()
        else:
            return {"message": "No earthquake information within the specified range."}

        return {
            'time': earthquake_time,
            'magnitude': earthquake_magnitude,
            'date': earthquake_date,
            'depth': earthquake_depth,
            'coordinates': coordinates_text,
            'description': earthquake_description
        }

    return {}


def get_weather_forecast():
    soup = BeautifulSoup(get_page_content(), 'html.parser')
    forecasts = []
    for item in soup.select(".owl-item .d-flex"):
        forecast_data = {
            "day": item.find("span", {"class": "card-hari"}).text,
            "time": item.find("span", {"class": "card-waktu"}).text,
            "image": item.find("span", {"class": "card-img"}).img["src"],
            "condition": item.find("span", {"class": "card-kondisi"}).text,
            "temperature": item.find("span", {"class": "card-suhu"}).text,
            "humidity": item.find("span", {"class": "card-rh"}).text
        }
        forecasts.append(forecast_data)
    return forecasts


def get_weather_warning():
    soup = BeautifulSoup(get_page_content(), 'html.parser')
    modal_content = soup.find('div', {'class': 'modal-content'})
    return modal_content.find('div', {'class': 'modal-body'}).text.strip()


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
    try:
        with webdriver.Chrome(options=chrome_options) as driver:
            driver.get("http://jam.bmkg.go.id/Jam.BMKG")
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            time_container = soup.find('span', {'id': 'timecontainer'})
            indonesian_date = time_container.find(
                'div', {'class': 'FontHari'}).text
            indonesian_time = time_container.find(
                'div', {'class': 'FontDigit'}).text
            other_times = time_container.find_all(
                'div', {'class': 'FontDigitU'})
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
        weather_warning = get_weather_warning()
        weather_forecast = get_weather_forecast()
        earthquake_info = get_earthquake_info()
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
            'weather_warning': weather_warning,
            'weather_forecast': weather_forecast,
            'earthquake_info': earthquake_info,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=3001, debug=True)
