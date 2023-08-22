import React, { useState, useEffect } from 'react';
import "./Time.css"

function Time() {
    const [data, setData] = useState({});

    useEffect(() => {
        const fetchData = () => {
            fetch('http://localhost:3001/times')
                .then(response => response.json())
                .then(data => {
                    setData(data);
                })
                .catch(err => {
                    console.error("Failed to fetch data:", err);
                });
        };

        fetchData();  // Fetch data immediately upon component mount

        const interval = setInterval(fetchData, 100); // Fetch data every 100 milliseconds

        // Cleanup the interval on component unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="hero min-h-screen" style={{ backgroundImage: 'url(/hagia.jpg)' }}>
                <div className="hero-overlay bg-opacity-60"></div>
                <div className="hero-content flex flex-col justify-between text-center text-neutral-content h-full">
                    <div className="date-time-information mt-10 digital-font text-4xl">
                        <div>{data.indonesian_date}</div>
                        <div>{data.indonesian_time}</div>
                        <div>{data.wita_time}</div>
                        <div>{data.english_date}</div>
                        <div>{data.wit_time}</div>
                    </div>

                    <div className="max-w-md mx-auto my-auto">
                        <p className="mb-5 ruwudu-font text-2xl">وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ
                            <br />
                            “Dan mohonlah pertolongan (kepada Allah) melalui sabar dan shalat. Dan (shalat) itu sungguh berat, kecuali bagi orang-orang yang khusyuk.”</p>
                    </div>

                    <div className="prayer-times flex justify-between items-center mb-5 text-2xl font-bold w-full mx-100">
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
