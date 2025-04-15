'use client';

import React from 'react';

interface RadioButtonProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export default function RadioButton({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  className = '',
  labelClassName = '',
}: RadioButtonProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex items-center">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="opacity-0 absolute h-5 w-5 cursor-pointer"
        />
        <div className={`
          border-2 rounded-full h-5 w-5 flex flex-shrink-0 justify-center items-center
          mr-2 transition-all duration-200 ease-in-out
          ${checked 
            ? 'border-primary bg-dark-300' 
            : 'border-gray-500 bg-dark-400'
          }
        `}>
          <div className={`
            rounded-full h-2.5 w-2.5 transition-all duration-200 ease-in-out
            ${checked ? 'bg-primary scale-100' : 'bg-gray-500 scale-0'}
          `}></div>
        </div>
      </div>
      <label 
        htmlFor={id} 
        className={`text-gray-300 cursor-pointer select-none ${labelClassName}`}
      >
        {label}
      </label>
    </div>
  );
}

export function RadioGroup({ 
  label, 
  children, 
  className = '' 
}: { 
  label?: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <div className="block text-gray-300 mb-2">{label}</div>}
      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  );
} 