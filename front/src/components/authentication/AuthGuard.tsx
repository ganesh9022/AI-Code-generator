import { RedirectToSignIn } from "@clerk/clerk-react"
import { Outlet, useLocation } from "react-router-dom"
import { useAuthState } from "../../hooks/useAuthState"
import { WelcomePage } from "./WelcomePage"
import { CircularLoader } from "../Loader/CircularLoader"

export const AuthGuard = () => {
  const { isSignedIn, showLoader, isError } = useAuthState()
  const location = useLocation()
  const redirectUrl = encodeURI(location.pathname + location.search)

  if (isError) {
    return <WelcomePage />
  }

  if (showLoader) {
    return <CircularLoader />
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={redirectUrl} />
  }

  return <Outlet />
}
