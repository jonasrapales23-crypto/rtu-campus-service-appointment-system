export default function SearchInput({ value, onChange, placeholder }) {
  return <label className="srau-search"><span aria-hidden="true">⌕</span><input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button type="button" onClick={() => onChange("")} aria-label="Clear search">×</button>}</label>;
}
