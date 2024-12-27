import { useState, useEffect } from "react";
import axios, { AxiosRequestConfig } from "axios";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
const generateUrl = (url: string): string => {
  return `${import.meta.env.VITE_SERVER_URL}/${url}`;
};
const useApi = <T>(
  url: string,
  params?: AxiosRequestConfig["params"]
): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const URL = generateUrl(url);
        const response = await axios.get<T>(URL, { params });
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

    fetchData();
  }, [url, params]);

  return { data, error, loading };
};

export default useApi;
