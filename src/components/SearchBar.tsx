import React from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => (
  <Input
    type="search"
    className="w-full"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder || "Search..."}
    aria-label="Search"
  />
);

export default SearchBar;
