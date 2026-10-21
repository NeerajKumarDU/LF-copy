"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className={`w-full border border-slate-300 rounded pl-3 pr-9 text-sm focus:outline-none focus:border-crimson-700 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
