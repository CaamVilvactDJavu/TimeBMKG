import React, { useState, useEffect, useRef } from 'react';
import "./Time.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter, faFacebook, faInternetExplorer } from '@fortawesome/free-brands-svg-icons';

function Time() {
    const [data, setData] = useState({});
    const [lastPrayer, setLastPrayer] = useState(null);
    const audioRef = useRef(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageList = [
        '../../../images/background/hagia.jpg',
        '../../../images/background/pexels.jpg',
        '../../../images/background/konevi.jpg',
        // ... add more images here
    ];

    // 2. Update state
    const [isImageVisible, setIsImageVisible] = useState(true);

    useEffect(() => {
        const imageInterval = setInterval(() => {
            setIsImageVisible(false);
            setTimeout(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageList.length);
                setIsImageVisible(true);
            }, 1000); // Matches the 1s transition in CSS
        }, 6000); // 5000ms + 1000ms of transition time

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
                <div className="mb-2 text-center text-4xl font-bold p-1 border-b-4 border-gray-900">Jam Adzan BMKG Stasiun Geofisika Padang Panjang<br /> Pusat Gempa Bumi Regional</div>
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
                <div className="my-4 flex-grow flex backdrop-blur-md shadow-2xl border-l-4 border-gray-800">
                    <p className="ruwudu-font text-xl p-4">وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ<br />“Dan mohonlah pertolongan (kepada Allah) melalui sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk.”</p>
                </div>
                <div className="flex justify-between mb-4 text-base">
                    <div className="flex space-x-4 w-full">
                        <div className="space-y-1 text-left flex-1 p-2 rounded-xl shadow-2xl">
                            <span className="font-bold text-md">Earthquake Info:</span>
                            <div className="text-md">Date  : {data.earthquake?.Tanggal}</div>
                            <div className="text-md">Time  : {data.earthquake?.Jam}</div>
                            <div className="text-md">Magnitude  : {data.earthquake?.Magnitude}</div>
                            <div className="text-md">Depth  : {data.earthquake?.Kedalaman}</div>
                            <div className="text-md">Location  : {data.earthquake?.Wilayah}</div>
                            <div className="text-md">Potency  : {data.earthquake?.Potensi}</div>
                            <div className="text-md">Felt in  : {data.earthquake?.Dirasakan}</div>
                        </div>
                        <div className="space-y-1 flex-1 ml-2 shadow-2xl text-base rounded-xl p-2">
                            <span className='font-bold'>Weather Forecast:</span>
                            <div>Temperature: {data.weather_forecast?.temperature_C}°C / {data.weather_forecast?.temperature_F}°F</div>
                            <div className="text-md">Humidity: {data.weather_forecast?.humidity}%</div>
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