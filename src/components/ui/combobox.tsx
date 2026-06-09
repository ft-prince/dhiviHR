import { useEffect, useRef, useState } from "react";

export function Combobox({ 
  options, 
  placeholder = "Search...",
  value = "",
  onSelect,
  onClear,
}: { 
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onSelect: (value: string) => void;
  onClear?: () => void;
}) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearch(val);
    setOpen(true);
    if (val === "") onClear?.();
  }

  return (
    <div className="relative">
      <input
        value={search}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-background shadow-md">
          {filtered.map(o => (
            <li
              key={o.value}
              onMouseDown={() => {
                setSearch(o.label);
                setOpen(false);
                onSelect(o.value);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}