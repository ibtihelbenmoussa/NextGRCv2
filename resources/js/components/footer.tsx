export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">
            © {year} NextGRC. All rights reserved.
        </footer>
    );
}
