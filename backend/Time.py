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
    soup = BeautifulSoup(get_page_content(), 'html.parser')
    lindu_container = soup.find('div', class_='lindu')

    # Check if lindu_container exists
    if not lindu_container:
        return {}

    earthquake_time = lindu_container.find(
        'h5', class_='text-center text-white mb-1')
    earthquake_magnitude_img = lindu_container.find(
        'img', src="https://warning.bmkg.go.id/img/magnitude.png")
    earthquake_depth_img = lindu_container.find(
        'img', src="https://warning.bmkg.go.id/img/kedalaman.png")
    earthquake_coordinates_img = lindu_container.find(
        'img', src="https://warning.bmkg.go.id/img/koordinat.png")
    earthquake_location_p = lindu_container.find('p', class_='par')

    # Return the captured data as a dictionary
    return {
        'time': earthquake_time.text if earthquake_time else None,
        'magnitude': earthquake_magnitude_img.next_sibling.next_sibling.text if earthquake_magnitude_img and earthquake_magnitude_img.next_sibling and earthquake_magnitude_img.next_sibling.next_sibling else None,
        'depth': earthquake_depth_img.next_sibling.next_sibling.text if earthquake_depth_img and earthquake_depth_img.next_sibling and earthquake_depth_img.next_sibling.next_sibling else None,
        'coordinates': earthquake_coordinates_img.next_sibling.next_sibling.text if earthquake_coordinates_img and earthquake_coordinates_img.next_sibling and earthquake_coordinates_img.next_sibling.next_sibling else None,
        'location': earthquake_location_p.text.split("Lokasi Gempa")[1].strip() if earthquake_location_p else None
    }


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
    # If the modal doesn't automatically appear on the page, you might need to trigger it.
    # This is just an example, modify as needed:
    # driver.find_element_by_css_selector("CSS_SELECTOR_OF_TRIGGER_BUTTON").click()

    modal_content = soup.find('div', {'class': 'modal-content'})

    # Return the text from the modal's body section
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
            'earthquake_info': earthquake_info
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=3001, debug=True)
