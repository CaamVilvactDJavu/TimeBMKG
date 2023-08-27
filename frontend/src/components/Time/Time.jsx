import React, { useState, useEffect, useRef } from 'react';
import "./Time.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter, faFacebook, faInternetExplorer } from '@fortawesome/free-brands-svg-icons';
import { faTemperatureLow, faTint } from '@fortawesome/free-solid-svg-icons';
import { faCalendarAlt, faClock, faMapMarked, faRulerVertical, faWaveSquare, faExclamationTriangle, faCity } from '@fortawesome/free-solid-svg-icons';

function Time() {
    const [data, setData] = useState({});
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
            <div className={`flex-none w-1/3 min-h-screen bg-gray-200 fade-image ${isImageVisible ? 'visible' : ''}`} style={{ backgroundImage: `url(${imageList[currentImageIndex]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            </div>
            <div className="flex-1 flex flex-col justify-between p-4">
                <div className="title mb-2 text-center text-5xl border-b-4 border-gray-800">
                    Jam Adzan BMKG
                    <div className="text-3xl">Stasiun Geofisika Padang Panjang</div>
                    <div className="text-2xl">Pusat Gempa Bumi Regional</div>
                </div>
                <div className="mb-2">
                    <div className="text-center text-3xl font-bold">{data.indonesian_time}</div>
                    <div className="text-center text-3xl font-bold">{data.wita_time}</div>
                    <div className="text-center text-3xl font-bold">{data.wit_time}</div>
                    <div className="flex justify-between text-2xl font-bold">
                        <div>{data.indonesian_date}</div>
                        <div>{data.hijri_date}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xl font-bold mb-4 p-4 viga-font shadow-2xl rounded-xl">
                    {[['Fajr', '../../images/icons/fajr.png'], ['Dhuhr', '../../images/icons/dhuhr.png'], ['Asr', '../../images/icons/asr.png'], ['Maghrib', '../../images/icons/maghrib.png'], ['Isha', '../../images/icons/isha.png']].map(([prayer, icon]) => (
                        <div key={prayer} className={`flex flex-col items-center ${prayer === nextPrayer ? 'bg-green-700 text-white rounded-xl px-8' : ''} p-2`}>
                            <img src={icon} alt={`${prayer} Icon`} className="w-8 h-8 mb-2" />
                            <div>{prayer}</div>
                            <div>{data.prayer_times && data.prayer_times[prayer]}</div>
                        </div>
                    ))}
                    <div className="text-center border-l-4 border-gray-900 px-4">
                        <span>Next Prayer: </span>
                        <span className='font-bold'>{data.next_prayer}</span>
                        <div className='text-md font-bold'>-{data.countdown}</div>
                    </div>
                </div>
                <div className="my-4 flex-grow flex backdrop-blur-md shadow-2xl border-l-8 border-gray-800 rounded-xl">
                    <p className="ruwudu-font text-xl p-4">وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ<br />“Dan mohonlah pertolongan (kepada Allah) melalui sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk.”</p>
                </div>
                <div className="flex justify-between mb-4 text-base">
                    <div className="flex space-x-4 w-full">
                        <div className="space-y-4 flex-1 ml-2 p-4 card bg-white shadow-md rounded-xl">
                            <h2 className="text-2xl font-semibold mb-3">Earthquake Info</h2>
                            <div className="space-y-1">
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500 mr-3 h-5 w-5" />
                                    Date: {data.earthquake?.Tanggal}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faClock} className="text-green-500 mr-3 h-5 w-5" />
                                    Time: {data.earthquake?.Jam}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faWaveSquare} className="text-red-500 mr-3 h-5 w-5" />
                                    Magnitude: {data.earthquake?.Magnitude}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faRulerVertical} className="text-purple-500 mr-3 h-5 w-5" />
                                    Depth: {data.earthquake?.Kedalaman}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faMapMarked} className="text-orange-500 mr-3 h-5 w-5" />
                                    Location: {data.earthquake?.Wilayah}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-3 h-5 w-5" />
                                    Potency: {data.earthquake?.Potensi}
                                </div>
                                <div className="flex items-center text-md text-gray-700 mb-2">
                                    <FontAwesomeIcon icon={faCity} className="text-teal-500 mr-3 h-5 w-5" />
                                    Felt in: {data.earthquake?.Dirasakan}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 flex-1 ml-2 p-4 card bg-white shadow-md rounded-xl">
                            <h2 className="text-2xl font-semibold mb-3">Weather Forecast</h2>
                            <div className="flex items-center justify-between mb-4 text-lg text-gray-700">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faTemperatureLow} className="text-red-400 mr-3 h-5 w-5" />
                                    Temperature
                                </div>
                                <div>
                                    {data.weather_forecast?.temperature_C}°C / {data.weather_forecast?.temperature_F}°F
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-lg text-gray-700">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faTint} className="text-blue-400 mr-3 h-5 w-5" />
                                    Humidity
                                </div>
                                <div>
                                    {data.weather_forecast?.humidity}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ticker bg-slate-800 rounded-xl p-2 text-white">
                    <div className="ticker-content">
                        <FontAwesomeIcon icon={faInternetExplorer} /> Website: <a href="https://bmkg.go.id" target="_blank" rel="noopener noreferrer">bmkg.go.id</a> | <FontAwesomeIcon icon={faInstagram} /> Instagram: <a href="https://instagram.com/bmkgpadangpanjang" target="_blank" rel="noopener noreferrer">@bmkgpadangpanjang</a> | <FontAwesomeIcon icon={faTwitter} /> Twitter: <a href="https://twitter.com/bmkgpadangpjg" target="_blank" rel="noopener noreferrer">@bmkgpadangpjg</a> | <FontAwesomeIcon icon={faFacebook} /> Facebook: <a href="https://facebook.com/bmkgpadangpanjang" target="_blank" rel="noopener noreferrer">bmkgpadangpanjang</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Time;
