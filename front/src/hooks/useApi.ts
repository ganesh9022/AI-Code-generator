import { useState, useEffect } from "react";
import axios, { AxiosRequestConfig } from "axios";
import { useDebounce } from "use-debounce";
import { useAuth } from "@clerk/clerk-react";

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
  params?: AxiosRequestConfig["params"],
  useDebounceFlag?: boolean
): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [debouncedParams] = useDebounce(params, useDebounceFlag ? 1000 : 0);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const URL = generateUrl(url);
        const token = await getToken();
        const response = debouncedParams && (await axios.post<T>(URL, debouncedParams, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }));
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

    if (url) {
      fetchData();
    }
  }, [url, debouncedParams, getToken]);

  return { data, error, loading };
};

export default useApi;
