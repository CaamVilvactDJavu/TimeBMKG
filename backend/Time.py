from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
# Update this with the path to your chromedriver


@app.route('/times', methods=['GET'])
def times():
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

        return jsonify({
            'indonesian_date': indonesian_date.strip(),
            'indonesian_time': indonesian_time.strip(),
            'wita_time': other_times[0].text.split('\xa0')[0].strip(),
            'wit_time': other_times[0].text.split('\xa0')[2].strip(),
            'english_date': english_date.strip(),
            'utc_time': utc_time.strip(),
        })


if __name__ == "__main__":
    app.run(port=3001, debug=True)
