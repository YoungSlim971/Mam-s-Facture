import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so we can safely show the UI
  // This is to prevent hydration mismatch errors with next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null on the server to avoid mismatch
    return <Button variant="outline" size="icon" disabled><Sun className="h-[1.2rem] w-[1.2rem]" /></Button>;
  }

  const toggleTheme = () => {
    // Use resolvedTheme to decide the next theme if current theme is 'system'
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Determine which icon to show based on resolvedTheme (actual theme applied)
  // or theme (user preference, could be 'system')
  const displayTheme = resolvedTheme || theme;

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Changer le thème">
      {displayTheme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
};

export default ThemeToggle;
