import { useState } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useAuth } from "@clerk/clerk-react";

export enum BackendEndpoints {
  TrainModel = "train-model",
  CodeSnippet = "code-snippet",
  AskQuery = "ask-query",
  SaveUser = "saveUser",
  DeletePage = "delete-page",
  SaveMessage = "save-message",
  ChatHistory = "chat-history",
  GetGithubToken = "get-github-token",
  ExtractRepoFunctions = "extract-repo-functions",
  AllChatHistories = "all-chat-histories",
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  fetchData: (options?: FetchOptions) => Promise<void>;
}

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export interface FetchOptions extends AxiosRequestConfig {
  params?: AxiosRequestConfig["params"];
  method?: HttpMethod;
}

const generateUrl = (endpoint: BackendEndpoints): string => {
  return `${import.meta.env.VITE_SERVER_URL}/${endpoint}`;
};

const useLazyApi = <T>(endpoint: BackendEndpoints): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { getToken } = useAuth();

  const fetchData = async (options?: FetchOptions) => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    const { method = "POST", params, headers = {}, ...rest } = options || {};

    try {
      const URL = generateUrl(endpoint);
      const config: AxiosRequestConfig = {
        url: URL,
        method: method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
        },
        params: params,
        ...rest,
      };

      const response: AxiosResponse<T> = await axios(config);
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
