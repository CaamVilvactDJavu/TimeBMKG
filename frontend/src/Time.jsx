import React, { useState, useEffect, useRef } from 'react';
import "./Time.css"

function Time() {
    const [data, setData] = useState({});
    const [lastPrayer, setLastPrayer] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const fetchData = () => {
            fetch('http://localhost:3001/times')
                .then(response => response.json())
                .then(data => {
                    setData(data);
                    const [hours, minutes, seconds] = data.countdown.split(":").map(Number);

                    if (hours === 0 && minutes === 0 && seconds > 0 && lastPrayer !== data.next_prayer) {
                        audioRef.current.play();
                        setLastPrayer(data.next_prayer);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch data:", err);
                });
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
                        <div>Fajr<br />{data.prayer_times && data.prayer_times.Fajr}</div>
                        <div>Dhuhr<br />{data.prayer_times && data.prayer_times.Dhuhr}</div>
                        <div>Asr<br />{data.prayer_times && data.prayer_times.Asr}</div>
                        <div>Maghrib<br />{data.prayer_times && data.prayer_times.Maghrib}</div>
                        <div>Isha<br />{data.prayer_times && data.prayer_times.Isha}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Time; 