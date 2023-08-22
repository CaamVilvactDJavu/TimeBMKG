import React, { useState, useEffect } from 'react';

function Time() {
    const [data, setData] = useState({});

    useEffect(() => {
        const fetchData = () => {
            fetch('http://localhost:3001/times')
                .then(response => response.json())
                .then(data => setData(data))
                .catch(err => console.error("Failed to fetch data:", err));
        };

        fetchData();
        const interval = setInterval(fetchData, 1000); // Fetch data every second

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    return (
        <div>
            <h2>Date & Time Information</h2>
            <div>Indonesian Date: {data.indonesian_date}</div>
            <div>Indonesian Time: {data.indonesian_time}</div>
            <div>WITA Time: {data.wita_time}</div>
            <div>WIT Time: {data.wit_time}</div>
            <div>English Date: {data.english_date}</div>
            <div>UTC Time: {data.utc_time}</div>
        </div>
    );
}

export default Time;
