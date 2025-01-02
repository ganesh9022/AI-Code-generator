import { useState } from "react";
import axios, { AxiosRequestConfig } from "axios";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  fetchData: (params?: AxiosRequestConfig["params"]) => Promise<void>;
}

const generateUrl = (url: string): string => {
  return `${import.meta.env.VITE_SERVER_URL}/${url}`;
};

const useLazyApi = <T>(url: string): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fetchData = async (params?: AxiosRequestConfig["params"]) => {
    setLoading(true);
    setError(null);
    try {
      const URL = generateUrl(url);
      const response = await axios.post<T>(URL, params);
      setData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, fetchData };
};

export default useLazyApi;
