import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import { buttonClass } from '../components/Button.jsx';

const steps = [
  {
    title: 'Create a poll',
    text: 'Choose the event, dates, time range, and how long each time slot should be.',
  },
  {
    title: 'Share the link',
    text: 'Send the generated link to the people you want to meet with. No account is needed.',
  },
  {
    title: 'Pick the best time',
    text: 'Everyone marks when they are available. The shared grid shows the strongest overlap.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Group scheduling
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900">
          Find a time that works for everyone.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          Create a simple availability poll, share the link, and let everyone mark the time
          slots that work for them. No account required.
        </p>
        <div className="mt-5">
          <Link to="/create" className={buttonClass('primary', 'md')}>
            Create a scheduling poll
          </Link>
        </div>

        <section className="mt-10" aria-labelledby="how-it-works">
          <h2
            id="how-it-works"
            className="border-b border-gray-200 pb-2 text-sm font-bold text-gray-900"
          >
            How it works
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded border border-gray-200 bg-white p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
                  {index + 1}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-500">
          Polls and responses are stored in a MySQL database.
        </p>
      </main>
    </div>
  );
}
