export default function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
      <span className="font-medium text-gray-700">Availability:</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-gray-300 bg-white" />
        None
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-blue-200 bg-blue-50" />
        Low
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-blue-300 bg-blue-100" />
        Medium
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-blue-300 bg-blue-200" />
        High
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-green-300 bg-green-200" />
        All
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-3 w-3 border border-green-700 bg-green-100" />
        Highest overlap
      </span>
    </div>
  );
}
