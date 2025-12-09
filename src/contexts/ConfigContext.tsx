import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { AuthService } from "../services/authService";

interface IConfigContextValue {
  googleClientId: string | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<IConfigContextValue | undefined>(undefined);

interface IConfigProviderProps {
  children: ComponentChildren;
}

export function ConfigProvider({ children }: IConfigProviderProps) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check widget-level config
        const widgetConfig = (window as any).__WIDGET_CONFIG__;
        if (widgetConfig?.sellerConfig?.google_client_id) {
          setGoogleClientId(widgetConfig.sellerConfig.google_client_id);
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from API
        const config = await AuthService.getConfig();
        setGoogleClientId(config.google_client_id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load configuration"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const value: IConfigContextValue = {
    googleClientId,
    isLoading,
    error,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): IConfigContextValue {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
