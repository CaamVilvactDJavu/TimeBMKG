import React, { useState, useEffect, useRef } from 'react';
import "./Time.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter, faFacebook, faInternetExplorer } from '@fortawesome/free-brands-svg-icons';

function Time() {
    const [data, setData] = useState({ weather_warning: "", earthquake_info: {} });
    const [startForecastIndex, setStartForecastIndex] = useState(0);

    useEffect(() => {
        if (!data.weather_forecast) return;

        const forecastInterval = setInterval(() => {
            setStartForecastIndex((prevIndex) => {
                if (prevIndex + 5 >= data.weather_forecast.length) {
                    return 0; // Reset to the start if we've reached the end.
                }
                return prevIndex + 5;
            });
        }, 10000);

        return () => clearInterval(forecastInterval);
    }, [data.weather_forecast]);

    const [lastPrayer, setLastPrayer] = useState(null);
    const audioRef = useRef(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageList = [
        '../../../images/background/hagia.jpg',
        '../../../images/background/pexels.jpg',
        '../../../images/background/konevi.jpg',
    ];
    const [isImageVisible, setIsImageVisible] = useState(true);

    useEffect(() => {
        const imageInterval = setInterval(() => {
            setIsImageVisible(false);
            setTimeout(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageList.length);
                setIsImageVisible(true);
            }, 1000);
        }, 6000);

        return () => clearInterval(imageInterval);
    }, [imageList.length]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('http://localhost:3001/times');
            const fetchedData = await response.json();
            setData(fetchedData);
            const currentWIBTime = fetchedData.indonesian_time;
            const shouldPlayAdzan = prayerTime => currentWIBTime === prayerTime && lastPrayer !== prayerTime;

            if (fetchedData.prayer_times) {
                const { Fajr, Dhuhr, Asr, Maghrib, Isha } = fetchedData.prayer_times;
                if ([Fajr, Dhuhr, Asr, Maghrib, Isha].some(shouldPlayAdzan)) {
                    audioRef.current.play();
                    setLastPrayer(currentWIBTime);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, [lastPrayer]);

    const determineNextPrayer = () => {
        if (!data.prayer_times) return null;
        const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const currentTime = data.indonesian_time;
        for (let i = 0; i < prayerOrder.length; i++) {
            if (currentTime < data.prayer_times[prayerOrder[i]]) {
                return prayerOrder[i];
            }
        }
        return null;
    };

    const nextPrayer = determineNextPrayer();

    return (
        <div className='w-full h-screen flex items-center justify-center viga-font'>
            <audio ref={audioRef} src="../../../assets/Adzan.mp3" preload="auto"></audio>
            <div className={`flex-none w-1/3 min-h-screen bg-gray-200 fade-image ${isImageVisible ? 'visible' : ''}`} style={{ backgroundImage: `url(${imageList[currentImageIndex]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="flex-1 flex flex-col justify-between p-4">
                <div className="title mb-2 text-center text-4xl border-b-2 border-gray-800">
                    Jam Adzan BMKG
                    <div className="text-2xl">Stasiun Geofisika Padang Panjang</div>
                    <div className="text-xl">Pusat Gempa Bumi Regional VI</div>
                </div>
                <div className="mb-2">
                    <div className="text-center text-2xl font-bold">{data.indonesian_time}</div>
                    <div className="text-center text-2xl font-bold">{data.wita_time}</div>
                    <div className="text-center text-2xl font-bold">{data.wit_time}</div>
                    <div className="flex justify-between text-xl font-bold">
                        <div>{data.indonesian_date}</div>
                        <div>{data.hijri_date}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold mb-4 p-4 viga-font shadow-md rounded-md">
                    {[['Fajr', '../../images/icons/fajr.png'], ['Dhuhr', '../../images/icons/dhuhr.png'], ['Asr', '../../images/icons/asr.png'], ['Maghrib', '../../images/icons/maghrib.png'], ['Isha', '../../images/icons/isha.png']].map(([prayer, icon]) => (
                        <div key={prayer} className={`flex flex-col items-center ${prayer === nextPrayer ? 'bg-green-700 text-white rounded-md px-6' : ''} p-2`}>
                            <img src={icon} alt={`${prayer} Icon`} className="w-6 h-6 mb-2" />
                            <div>{prayer}</div>
                            <div>{data.prayer_times && data.prayer_times[prayer]}</div>
                        </div>
                    ))}
                    <div className="text-center border-l-2 border-gray-900 px-3">
                        <span>Next Prayer: </span>
                        <span className='font-bold'>{data.next_prayer}</span>
                        <div className='text-md font-bold'>-{data.countdown}</div>
                    </div>
                </div>
                <div className="my-4 flex-grow flex backdrop-blur-md shadow-md border-l-4 border-gray-800 rounded-md">
                    <p className="ruwudu-font text-lg p-3">وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَٰشِعِينَ<br />"Dan mohonlah pertolongan (kepada Allah) dengan sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk"</p>
                </div>
                <div className="info-sections my-4 flex flex-row space-x-4">
                    <div className="weather-warning p-4 shadow-md rounded-md flex-1">
                        <h3 className="text-lg font-bold mb-2">Peringatan Dini Cuaca Sumatera Barat</h3>
                        <p className=" text-xs text-justify">{data.weather_warning}</p>
                    </div>
                    <div className="earthquake-forecast flex flex-col space-y-4 flex-1">
                        <div className="earthquake-info p-4 shadow-md rounded-md">
                            <h3 className="text-lg font-bold mb-2">Gempabumi Dirasakan</h3>
                            {data.earthquake_info && data.earthquake_info.coordinates ? (
                                <>
                                    <div className="info-card text-sm">
                                        <strong>Waktu:</strong> {data.earthquake_info.time || "N/A"}
                                    </div>
                                    <div className="info-card text-sm">
                                        <strong>Magnitudo:</strong> {data.earthquake_info.magnitude || "N/A"}
                                    </div>
                                    <div className="info-card text-sm">
                                        <strong>Kedalaman:</strong> {data.earthquake_info.depth || "N/A"}
                                    </div>
                                    <div className="info-card text-sm">
                                        <strong>Koordinat:</strong> {data.earthquake_info.coordinates || "N/A"}
                                    </div>
                                    <div className="info-card text-sm">
                                        <strong>Deskripsi:</strong> {data.earthquake_info.description || "N/A"}
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-600">{data.earthquake_info.message || "Informasi gempabumi tidak tersedia dalam rentang koordinat yang ditentukan."}</p>
                            )}
                        </div>
                        <div className="forecast-container " style={{ scrollLeft: startForecastIndex * 146 }}>
                            {data.weather_forecast && data.weather_forecast.slice(startForecastIndex, startForecastIndex + 5).map((forecast, index) => (
                                <div key={index} className="forecast-item text-center border-sky-800 border-2 p-2 rounded-md">
                                    <p className="text-sm text-center">{forecast.day}, {forecast.time}</p>
                                    <div className="flex flex-col items-center">
                                        <img src={forecast.image} alt={forecast.condition} className="w-4/5 p-3" />
                                        <p className="text-xs">{forecast.condition}</p>
                                    </div>
                                    <p className="text-xs">Suhu: {forecast.temperature}</p>
                                    <p className="text-xs">Kelembaban: {forecast.humidity}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="ticker bg-sky-800 p-2 text-white rounded-md">
                    <div className="ticker-content">
                        <FontAwesomeIcon icon={faInternetExplorer} /> <a href="https://bmkg.go.id" target="_blank" rel="noopener noreferrer">https://bmkg.go.id </a>
                        <FontAwesomeIcon icon={faInstagram} /> <a href="https://instagram.com/bmkgpadangpanjang" target="_blank" rel="noopener noreferrer">@bmkgpadangpanjang </a>
                        <FontAwesomeIcon icon={faTwitter} /> <a href="https://twitter.com/bmkgpadangpjg" target="_blank" rel="noopener noreferrer">@bmkgpadangpjg </a>
                        <FontAwesomeIcon icon={faFacebook} /> <a href="https://facebook.com/bmkgpadangpanjang" target="_blank" rel="noopener noreferrer">bmkgpadangpanjang </a> | Sumber :
                        <a href="https://jam.bmkg.go.id/" target="_blank" rel="noopener noreferrer"> https://jam.bmkg.go.id/</a> ,
                        <a href="https://data.bmkg.go.id/" target="_blank" rel="noopener noreferrer"> https://data.bmkg.go.id/</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Time;
