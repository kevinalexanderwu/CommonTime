import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { buttonClass } from '../components/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The page you tried to open does not exist or the link is incorrect.
        </p>
        <Link to="/" className={`${buttonClass('primary', 'md')} mt-4`}>
          Go to home page
        </Link>
      </main>
    </div>
  );
}
