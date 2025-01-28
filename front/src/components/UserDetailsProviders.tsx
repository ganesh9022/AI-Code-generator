import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";
  
  interface UserData{
    userId: string,
    userName: string,
    email: string,
  }

  interface DetailsProps {
    userData: UserData;
    setUserData: (userData: UserData) => void;
  }
  
  const DetailsContext = createContext<DetailsProps>({
    userData :{
      userId: "",
      userName: "",
      email: "",    
    },
    setUserData: () => {},
  });
  
  export const DetailsProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [userData, setUserData] = useState({
      userId: "",
      userName: "",
      email: "",
    });
  
    return (
      <DetailsContext.Provider
        value={{
          userData,
          setUserData,
        }}
      >
        {children}
      </DetailsContext.Provider>
    );
  };
 /* eslint-disable-next-line */
  export const useDetails = (): DetailsProps => useContext(DetailsContext);
