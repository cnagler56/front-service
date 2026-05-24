// useMarketData.js
"use client"
import { useState, useEffect } from "react";

const API_URL =
  "https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=GCUSD&apikey=fnut4864Nma3UJk4kN6VkefmIVXQtX50";

const useMarketData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort(); // cleanup on unmount
  }, []);

  return { data, loading, error };
};

export default useMarketData;