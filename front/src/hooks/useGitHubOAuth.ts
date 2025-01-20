import { useCallback } from "react";

const useGitHubOAuth = () => {
  const CLIENT_ID = import.meta.env.VITE_OAUTH_APP_CLIENT_ID;
  const SCOPES = "repo user";

  const handleLogin = useCallback(() => {
    if (!CLIENT_ID) {
      console.error('GitHub Client ID is not configured. Please check your .env file');
      return;
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPES,
      response_type: 'code'
    });

    const githubAuthURL = `https://github.com/login/oauth/authorize?${params.toString()}`;
    window.location.href = githubAuthURL;
  }, [CLIENT_ID, SCOPES]);

  return { handleLogin };
};

export default useGitHubOAuth;
