import { useUser as useClerkUser } from "@clerk/clerk-react";

type AuthState =
  | {
      showLoader: true;
      isSignedIn: undefined;
      isError: boolean;
    }
  | {
      showLoader: false;
      isSignedIn: false;
      isError: boolean;
    }
  | {
      showLoader: false;
      isSignedIn: true;
      isError: false;
    };

export const useAuthState = (): AuthState => {
  const { isLoaded, isSignedIn, user } = useClerkUser();
  const showLoader = !isLoaded;
  if (showLoader)
    return {
      showLoader: true,
      isSignedIn: undefined,
      isError: false,
    };
  if (!isSignedIn || !user) {
    return {
      showLoader: false,
      isSignedIn: false,
      isError: true,
    };
  }
  return {
    showLoader,
    isSignedIn: true,
    isError: false,
  };
};
