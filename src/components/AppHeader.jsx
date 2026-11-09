import { Link } from 'react-router-dom';
import { buttonClass } from './Button.jsx';

export default function AppHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">CommonTime</span>
          <span className="hidden text-xs text-gray-500 sm:inline">Group scheduling</span>
        </Link>
        <Link to="/create" className={buttonClass('primary', 'sm')}>
          Create Poll
        </Link>
      </div>
    </header>
  );
}
