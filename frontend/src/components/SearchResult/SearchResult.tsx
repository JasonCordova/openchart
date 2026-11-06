import type { Place } from '../samplePlaces'
import './SearchResult.css'

type SearchResultProps = {
  id: string
  place: Place
  active: boolean
  disabled: boolean
  onActivate: () => void
  onSelect: (place: Place) => void
}

export default function SearchResult({ id, place, active, disabled, onActivate, onSelect }: SearchResultProps) {
  const separator = place.name.lastIndexOf(', ')
  const city = separator === -1 ? place.name : place.name.slice(0, separator)
  const state = separator === -1 ? 'United States' : place.name.slice(separator + 2)

  return (
    <li
      id={id}
      className="search-result"
      role="option"
      aria-selected={active}
      aria-disabled={disabled}
      onPointerMove={onActivate}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => { if (!disabled) onSelect(place) }}
    >
      <span className="search-result__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </span>
      <span className="search-result__text">
        <span className="search-result__name">{city}</span>
        <span className="search-result__detail">{state} · Sample location</span>
      </span>
      <svg className="search-result__arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    </li>
  )
}
