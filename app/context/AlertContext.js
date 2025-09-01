import { createContext, useCallback, useContext, useState } from "react";
import {} from "react-native";

// create the alertContext
export const AlertContext = createContext();

// AlertProvider components to wrap the app
export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    action: null
  });

  //   Function to show an Alert
  const showAlert = useCallback((message, type = 'info', duration = 3000, action = null) => {
    setAlert({ visible: true, message, type, duration, action });
  }, []);

  // Function to hide the alert
  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};