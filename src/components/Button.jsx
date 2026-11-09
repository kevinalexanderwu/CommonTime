const baseClass =
  'inline-flex items-center justify-center gap-1.5 rounded border font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';

const variants = {
  primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
  quiet: 'border-transparent bg-transparent text-blue-700 hover:bg-blue-50',
};

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

export function buttonClass(variant = 'secondary', size = 'md', className = '') {
  return `${baseClass} ${variants[variant] || variants.secondary} ${
    sizes[size] || sizes.md
  } ${className}`.trim();
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  );
}
