import React, { createContext, useContext, useEffect } from "react";

interface ThemeContextType {
  theme: "dark";
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark" });

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Mantido por compatibilidade com a API anterior, mas o tema e sempre dark */
  defaultTheme?: string;
}

/**
 * Provedor de tema da aplicacao.
 * O tema e fixo em "dark" para manter a identidade visual da plataforma.
 * A logica de switchable foi removida pois nunca era utilizada.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
