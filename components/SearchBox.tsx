"use client";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBox({
  value,
  onChange,
}: SearchBoxProps) {
  return (
    <div className="mb-8">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ค้นหากองทุน..."
          className="
            w-full
            h-12
            pl-12
            pr-4
            rounded-xl
            border
            border-slate-200
            bg-white
            text-slate-700
            placeholder:text-slate-400
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            transition
          "
        />
      </div>
    </div>
  );
}