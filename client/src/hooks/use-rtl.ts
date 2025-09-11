import { useState, useEffect, createContext, useContext } from "react";

interface RtlContextType {
  isRtl: boolean;
  toggleRtl: () => void;
}

const RtlContext = createContext<RtlContextType | undefined>(undefined);

export function RtlProvider({ children }: { children: React.ReactNode }) {
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    const savedRtl = localStorage.getItem("rtl-mode");
    if (savedRtl === "true") {
      setIsRtl(true);
    }
  }, []);

  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isRtl) {
      htmlElement.classList.add("rtl");
      htmlElement.dir = "rtl";
      htmlElement.style.fontFamily = "Cairo, sans-serif";
    } else {
      htmlElement.classList.remove("rtl");
      htmlElement.dir = "ltr";
      htmlElement.style.fontFamily = "Roboto, sans-serif";
    }

    localStorage.setItem("rtl-mode", String(isRtl));
  }, [isRtl]);

  const toggleRtl = () => {
    setIsRtl(prev => !prev);
  };

  const value = {
    isRtl,
    toggleRtl,
  };

  return <RtlContext.Provider value={value}>{children}</RtlContext.Provider>;
}

export function useRtl() {
  const context = useContext(RtlContext);
  if (context === undefined) {
    throw new Error("useRtl must be used within an RtlProvider");
  }
  return context;
}
