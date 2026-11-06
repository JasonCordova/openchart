import { useEffect, useRef } from 'react'
import SearchResult from '../SearchResult/SearchResult'
import type { Place } from '../samplePlaces'
import './SearchDropdown.css'

type SearchDropdownProps = {
  id: string
  open: boolean
  results: Place[]
  activeIndex: number
  disabled: boolean
  onActivate: (index: number) => void
  onSelect: (place: Place) => void
}

export default function SearchDropdown({ id, open, results, activeIndex, disabled, onActivate, onSelect }: SearchDropdownProps) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, activeIndex])

  return (
    <div className="search-dropdown" data-open={open} inert={!open} aria-hidden={!open}>
      <div className="search-dropdown__content">
        <div className="search-dropdown__filters">
          <div className="search-dropdown__heading">
            <span>Refine your search</span>
            <span className="search-dropdown__soon">Filters coming soon</span>
          </div>
          <div className="search-dropdown__chips" role="group" aria-label="Upcoming filters">
            {['Location', 'Price', 'Procedure'].map((filter) => (
              <button key={filter} type="button" disabled title={`${filter} filter coming soon`}>
                {filter}
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 6 3 3 3-3" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="search-dropdown__results-heading">
          <span>Locations</span>
          <span>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
        </div>
        <ul ref={listRef} className="search-dropdown__list" id={id} role="listbox" aria-label="Sample cities">
          {results.map((place, index) => (
            <SearchResult
              key={place.name} id={`${id}-${index}`} place={place}
              active={index === activeIndex} disabled={disabled}
              onActivate={() => onActivate(index)} onSelect={onSelect}
            />
          ))}
        </ul>
        {results.length === 0 && (
          <p className="search-dropdown__empty" role="status">No matching cities. Try another city or state.</p>
        )}
      </div>
    </div>
  )
}
