import { createContext, useContext, useState } from 'react';

const GraduationContext = createContext(null);

export function GraduationProvider({ children }) {
  const [certificate, setCertificate] = useState(null); // { dataUrl, isPng }
  const [thesis, setThesis] = useState(null); // { bytes: ArrayBuffer, name }

  return (
    <GraduationContext.Provider value={{ certificate, setCertificate, thesis, setThesis }}>
      {children}
    </GraduationContext.Provider>
  );
}

export function useGraduation() {
  return useContext(GraduationContext);
}
