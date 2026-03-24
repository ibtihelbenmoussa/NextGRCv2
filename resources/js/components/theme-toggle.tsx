import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { type ComponentProps, useDeferredValue, useEffect } from 'react';

const THEMES = [
    {
        type: 'light',
        icon: Sun,
        label: 'light theme',
    },
    {
        type: 'dark',
        icon: Moon,
        label: 'dark theme',
    },
] as const;

type Theme = (typeof THEMES)[number]['type'];

interface ThemeToggleProps
    extends Omit<ComponentProps<'div'>, 'onChange' | 'value' | 'defaultValue'> {
    value?: Theme;
    onChange?: (theme: Theme) => void;
    defaultValue?: Theme;
}

function ThemeToggle({
    value,
    onChange,
    defaultValue,
    className,
    ...props
}: ThemeToggleProps) {
    const { appearance, updateAppearance } = useAppearance();
    const currentTheme = value ?? appearance ?? defaultValue ?? 'light';
    const deferredTheme = useDeferredValue(currentTheme);
    useEffect(() => {
        document.body.dataset.agThemeMode =
            currentTheme === 'light' ? 'light-blue' : 'dark-blue';
    }, [currentTheme]);

    return (
        <div
            className={cn(
                'relative isolate inline-flex h-8 items-center rounded-full border border-dotted px-1',
                className,
            )}
            {...props}
        >
            {THEMES.map(({ type, icon: Icon, label }) => {
                const isActive = deferredTheme === type;

                return (
                    <button
                        aria-label={`Switch to ${label}`}
                        className="group relative size-6 cursor-pointer rounded-full transition duration-200 ease-out"
                        key={type}
                        onClick={() => {
                            const next =
                                (value ?? appearance ?? 'light') === 'light'
                                    ? 'dark'
                                    : 'light';
                            if (onChange) onChange(next);
                            else updateAppearance(next);
                            // Update AG Grid theme mode immediately for visual responsiveness
                            document.body.dataset.agThemeMode =
                                next === 'light' ? 'light-blue' : 'dark-blue';
                        }}
                        title={`Switch to ${label}`}
                        type="button"
                    >
                        {isActive && (
                            <div className="absolute inset-0 -z-1 rounded-full bg-muted" />
                        )}
                        <Icon
                            className={cn(
                                'relative m-auto size-4',
                                'transition duration-200 ease-out',
                                isActive && { 'text-foreground': true },
                                !isActive && {
                                    'text-secondary-foreground group-hover:text-foreground group-focus-visible:text-foreground': true,
                                },
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export { ThemeToggle };
