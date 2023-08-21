from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from flask_cors import CORS
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

app = Flask(__name__)
CORS(app)


@app.route('/sensors', methods=['GET', 'POST'])
def sensors():
    search_term = "padang panjang"
    url = "http://202.90.198.40/sismon-wrs/web/slmon2/"

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    all_table_data = []

    with webdriver.Chrome(options=chrome_options) as driver:
        driver.get(url)

        search_input = driver.find_element(
            By.XPATH, "//*[@id='test_filter']/label/input")
        search_input.send_keys(search_term)

        try:
            WebDriverWait(driver, 300).until_not(
                EC.text_to_be_present_in_element(
                    (By.XPATH, "//table[@id='test']//td[contains(text(), 'No data available in table')]"), "No data available in table")
            )
        except Exception as e:
            return jsonify({"error": "No data found for the search term"}), 404

        WebDriverWait(driver, 60).until_not(
            EC.text_to_be_present_in_element(
                (By.XPATH, "//table[@id='test']//td[contains(text(), 'Loading...')]"), "Loading...")
        )

        while True:
            page_content = driver.page_source
            soup = BeautifulSoup(page_content, 'html.parser')

            table = soup.find("table", {"id": "test"})
            if not table:
                return jsonify({"error": "Table not found"}), 404

            headers = [header.text for header in table.find(
                "thead").find_all("th")]

            tbody = table.find("tbody")
            if not tbody:
                return jsonify({"error": "Table body not found"}), 404

            rows = tbody.find_all("tr")

            for row in rows:
                columns = row.find_all("td")
                row_data = {}
                for header, column in zip(headers, columns):
                    row_data[header] = column.text.strip()
                all_table_data.append(row_data)

            # Check if the next button is available and clickable
            try:
                next_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable(
                        (By.XPATH, "//*[@id='test_next']"))
                )

                print("Next button class:", next_button.get_attribute("class"))

                if "disabled" in next_button.get_attribute("class"):
                    break  # If the button is disabled, we're on the last page

                next_button.location_once_scrolled_into_view

                try:
                    next_button.click()
                except Exception as e:
                    driver.execute_script("arguments[0].click();", next_button)

                print("Clicked next button")

                # Wait for the table to load after clicking Next
                WebDriverWait(driver, 60).until_not(
                    EC.text_to_be_present_in_element(
                        (By.XPATH, "//table[@id='test']//td[contains(text(), 'Loading...')]"), "Loading...")
                )

            except Exception as e:
                print(f"Error navigating to the next page: {e}")
                break  # If there's an error finding/clicking the next button, exit the loop

    return jsonify(all_table_data)


if __name__ == "__main__":
    app.run(port=3000, debug=True)
