import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'school_editable';
const PASSWORD = 'admin123';

interface PermissionCtx {
  editable: boolean;
  unlock: (pw: string) => boolean;
  lock: () => void;
}

const PermissionContext = createContext<PermissionCtx>({
  editable: false,
  unlock: () => false,
  lock: () => {},
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [editable, setEditable] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(editable));
  }, [editable]);

  const unlock = useCallback((pw: string) => {
    if (pw === PASSWORD) { setEditable(true); return true; }
    return false;
  }, []);

  const lock = useCallback(() => setEditable(false), []);

  return (
    <PermissionContext.Provider value={{ editable, unlock, lock }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
