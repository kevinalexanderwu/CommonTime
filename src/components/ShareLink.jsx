import { useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import { inputClass } from '../lib/styles.js';

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the older copy method.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

export default function ShareLink({ url }) {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    const copied = await copyText(url);
    setMessage(copied ? 'Copied.' : 'Could not copy. Select the link manually.');
    if (!copied) inputRef.current?.select();
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div className="w-full rounded border border-gray-200 bg-white p-2.5 md:w-96">
      <label htmlFor="poll-share-url" className="block text-xs font-semibold text-gray-700">
        Share this poll
      </label>
      <div className="mt-1 flex gap-1.5">
        <input
          ref={inputRef}
          id="poll-share-url"
          type="text"
          readOnly
          value={url}
          className={`${inputClass} min-w-0 flex-1 text-xs`}
          onFocus={(event) => event.target.select()}
        />
        <Button size="sm" onClick={handleCopy}>
          Copy
        </Button>
      </div>
      <p className="mt-1 min-h-4 text-xs text-gray-500" role="status">
        {message}
      </p>
    </div>
  );
}
