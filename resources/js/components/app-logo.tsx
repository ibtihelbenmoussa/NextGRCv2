import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="w-10" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <div className="flex flex-col">
                    <span className="text-md font-semibold">NextGRC</span>
                    <span className="text-xs text-muted-foreground">v2.0</span>
                </div>
            </div>
        </>
    );
}
