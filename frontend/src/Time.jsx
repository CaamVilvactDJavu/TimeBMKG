import React, { useState, useEffect, useRef } from 'react';
import "./Time.css"

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

                const shouldPlayAdzan = (prayerTime) => {
                    return currentWIBTime === prayerTime && lastPrayer !== prayerTime;
                }

                if (fetchedData.prayer_times) {
                    const { Fajr, Dhuhr, Asr, Maghrib, Isha } = fetchedData.prayer_times;

                    if (shouldPlayAdzan(Fajr) || shouldPlayAdzan(Dhuhr) || shouldPlayAdzan(Asr) || shouldPlayAdzan(Maghrib) || shouldPlayAdzan(Isha)) {
                        audioRef.current.play();

                        // Here, we set the lastPrayer to the current prayer time to prevent repetitive Adzan for the same prayer
                        setLastPrayer(currentWIBTime);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };

        fetchData();

        const interval = setInterval(fetchData, 1000); // Check every second.

        return () => clearInterval(interval);
    }, [lastPrayer]);

    return (
        <div className='full-width'>
            <audio ref={audioRef} src="./Adzan.mp3" preload="auto"></audio>
            <div className="hero min-h-screen bg-center bg-cover" style={{ backgroundImage: 'url(/hagia.jpg)' }}>
                <div className="hero-overlay bg-opacity-50 bg-black"></div>
                <div className="hero-content flex flex-col justify-between text-center text-neutral-content h-full p-8">
                    <div className="date-time-information mt-10 digital-font text-4xl">
                        <div>{data.indonesian_date}</div>
                        <div>{data.hijri_date}</div>
                        <div>{data.indonesian_time}</div>
                        <div className='mb-4'>{data.wita_time}</div>
                        <div className='border-t-2 pt-4'>{data.english_date}</div>
                        <div>{data.wit_time}</div>
                    </div>
                    <div className="flex justify-between backdrop-blur-md border-2 rounded-xl">
                        <p className="ruwudu-font text-2xl p-7">وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ
                            <br />
                            “Dan mohonlah pertolongan (kepada Allah) melalui sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk.”</p>
                    </div>
                    <div className='text-lg font-bold'>
                        <div className="mt-4">
                            <span className="mr-2 text-3xl">Next Prayer<br /></span>
                            <span className='text-2xl'>{data.next_prayer}</span>
                        </div>
                        <div className='text-3xl'>
                            <span>-{data.countdown}</span>
                        </div>
                    </div>
                    <div className="prayer-times flex justify-between items-center mb-5 text-2xl font-bold w-full viga-font">
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/fajr.png"
                                alt="Fajr Icon"
                                className="w-6 h-6 mb-2 scale-150 filter transform"
                            />
                            <div className="text-center">
                                Fajr<br />{data.prayer_times && data.prayer_times.Fajr}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/dhuhr.png"
                                alt="Dhuhr Icon"
                                className="w-6 h-6 mb-2 scale-150 filter transform"
                            />
                            <div className="text-center">
                                Dhuhr<br />{data.prayer_times && data.prayer_times.Dhuhr}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/asr.png"
                                alt="Asr Icon"
                                className="w-6 h-6 mb-2 scale-150 filter transform"
                            />
                            <div className="text-center">
                                Asr<br />{data.prayer_times && data.prayer_times.Asr}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/maghrib.png"
                                alt="Maghrib Icon"
                                className="w-6 h-6 mb-2 scale-150 filter transform"
                            />
                            <div className="text-center">
                                Asr<br />{data.prayer_times && data.prayer_times.Maghrib}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/isha.png"
                                alt="Isha Icon"
                                className="w-6 h-6 mb-2 scale-150 filter transform"
                            />
                            <div className="text-center">
                                Isha<br />{data.prayer_times && data.prayer_times.Isha}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Time; 