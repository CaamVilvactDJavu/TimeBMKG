import React, { useState, useEffect, useRef } from 'react';
import "./Time.css";

function Time() {
    const [data, setData] = useState({});
    const [lastPrayer, setLastPrayer] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
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
            } catch (err) {
                console.error("Failed to fetch data:", err);
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
        <div className='w-full h-screen flex items-center justify-center'>
            <audio ref={audioRef} src="../../../assets/Adzan.mp3" preload="auto"></audio>
            <div className="flex-none w-1/3 min-h-screen bg-gray-200" style={{ backgroundImage: 'url(../../../images/background/hagia.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="bg-gray-600 bg-opacity-60 h-full"></div>
            </div>
            <div className="flex-1 flex flex-col justify-between p-8">
                <div className="text-right p-6 rounded-lg shadow-2xl flex flex-col md:flex-row justify-between items-start bg-gray-100">
                    <div className="space-y-2">
                        <div className="text-4xl font-bold mb-2">{data.indonesian_time}</div>
                        <div className="text-xl my-2">{data.wita_time}</div>
                        <div className="text-xl">{data.hijri_date}</div>
                        <div className="text-xl">{data.indonesian_date}</div>
                        <div className="text-xl border-t-2 py-2 border-gray-900">{data.english_date}</div>
                        <div className="text-xl">{data.wit_time}</div>
                        <div className="mt-3 text-3xl rounded-lg p-2 bg-green-700 text-white ">
                            <span>Next Prayer: </span>
                            <span className='font-bold'>{data.next_prayer}</span>
                            <div className='text-4xl font-bold'>-{data.countdown}</div>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 space-y-2">
                        <span className="font-bold text-xl">Weather Forecast:</span>
                        <div className="text-xl">Temperature: {data.weather_forecast?.temperature_C}°C / {data.weather_forecast?.temperature_F}°F</div>
                        <div className="text-xl">Humidity: {data.weather_forecast?.humidity}%</div>
                        <div className="mt-6 space-y-2 text-left border-2 p-4 rounded-lg border-gray-900">
                            <span className="font-bold text-xl">Earthquake Info:</span>
                            <div className="text-xl">Date  : {data.earthquake?.Tanggal}</div>
                            <div className="text-xl">Time  : {data.earthquake?.Jam}</div>
                            <div className="text-xl">Magnitude  : {data.earthquake?.Magnitude}</div>
                            <div className="text-xl">Depth  : {data.earthquake?.Kedalaman}</div>
                            <div className="text-xl">Location  : {data.earthquake?.Wilayah}</div>
                            <div className="text-xl">Potency  : {data.earthquake?.Potensi}</div>
                            <div className="text-xl">Felt in  : {data.earthquake?.Dirasakan}</div>
                        </div>
                    </div>
                </div>
                <div className="my-6 flex-grow flex items-center backdrop-blur-md rounded-lg shadow-2xl">
                    <p className="ruwudu-font text-2xl mx-auto py-4 px-8 border-l-4 border-gray-800">
                        وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ<br />
                        “Dan mohonlah pertolongan (kepada Allah) melalui sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk.”
                    </p>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold rounded-lg shadow-2xl p-4 viga">
                    {[['Fajr', '../../images/icons/fajr.png'], ['Dhuhr', '../../images/icons/dhuhr.png'], ['Asr', '../../images/icons/asr.png'], ['Maghrib', '../../images/icons/maghrib.png'], ['Isha', '../../images/icons/isha.png']].map(([prayer, icon]) => (
                        <div key={prayer} className={`flex flex-col items-center ${prayer === nextPrayer ? 'bg-green-700 text-white rounded-lg px-8' : ''} p-2`}>
                            <img src={icon} alt={`${prayer} Icon`} className="w-8 h-8 mb-2" />
                            <div>{prayer}</div>
                            <div>{data.prayer_times && data.prayer_times[prayer]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Time;
