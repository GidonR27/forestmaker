import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

export const viewport: Viewport = {
  themeColor: "#224229",
};

export const metadata: Metadata = {
  title: 'Page Not Found | Forest Maker',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center">
      <h1 className="text-5xl font-bold text-gray-800 md:text-6xl">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-700 md:text-2xl">Page Not Found</h2>
      <p className="mt-4 text-base text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 mt-8 text-white transition-colors duration-300 rounded-lg bg-green-700 hover:bg-green-800"
      >
        Return Home
      </Link>
    </div>
  );
} 