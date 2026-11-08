import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import SearchDropdown from '../SearchDropdown/SearchDropdown'
import type { Place } from '../samplePlaces'
import { filterPlacesByState, getPlaceState, stateNames } from '../placeFilters'
import './MapSearch.css'

type MapSearchProps = {
  places: Place[]
  disabled: boolean
  onSelect: (place: Place) => void
  selectedState: string
  onStateChange: (state: string) => void
}

export default function MapSearch({ places, disabled, onSelect, selectedState, onStateChange }: MapSearchProps) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const [query, setQuery] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const normalizedQuery = query.trim().toLowerCase()
  const states = [...new Set(places.map(getPlaceState))].filter((state) => state && state !== 'DC')
    .sort((a, b) => (stateNames[a] ?? a).localeCompare(stateNames[b] ?? b))
  const results = filterPlacesByState(places, selectedState)
    .filter((place) => place.name.toLowerCase().includes(normalizedQuery))
  const showClear = inputFocused && query.trim().length > 0

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  function selectPlace(place: Place) {
    if (disabled) return
    inputRef.current?.focus()
    setQuery(place.name)
    setOpen(false)
    setActiveIndex(-1)
    onSelect(place)
  }

  function clearSearch() {
    inputRef.current?.focus()
    setQuery('')
    setActiveIndex(-1)
    setOpen(true)
  }

  function changeState(state: string) {
    setQuery('')
    setActiveIndex(-1)
    setOpen(true)
    onStateChange(state)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    if ((!query.trim() && (!open || activeIndex < 0)) || results.length === 0) {
      setOpen(true)
      inputRef.current?.focus()
      return
    }
    selectPlace(results[open && activeIndex >= 0 ? activeIndex : 0])
  }

  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (results.length === 0) return
      setActiveIndex((current) => {
        if (!open || current < 0) return event.key === 'ArrowDown' ? 0 : results.length - 1
        return (current + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
      })
    }
  }

  return (
    <div
      className="map-search" ref={rootRef}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    >
      <form
        className="map-search__field" onSubmit={submitSearch} role="search"
        onBlur={(event) => {
          if (event.relatedTarget !== inputRef.current && event.relatedTarget !== clearButtonRef.current) {
            setInputFocused(false)
          }
        }}
      >
        <input
          ref={inputRef} type="search" role="combobox" aria-label="Search sample cities"
          aria-autocomplete="list" aria-expanded={open} aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          autoComplete="off" placeholder={selectedState ? `Search cities in ${selectedState}…` : 'Search sample cities…'} value={query}
          onFocus={() => { setInputFocused(true); setOpen(true) }}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true) }}
          onKeyDown={handleKeys}
        />
        <button
          ref={clearButtonRef} className="map-search__clear" type="button"
          data-visible={showClear} disabled={!showClear} aria-hidden={!showClear}
          aria-label="Clear search" title="Clear search"
          onFocus={() => setInputFocused(true)}
          onMouseDown={(event) => event.preventDefault()} onClick={clearSearch}
        >
          <span aria-hidden="true">×</span>
        </button>
        <button type="submit" disabled={disabled} aria-label="Search cities" title="Search cities">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
        </button>
      </form>
      <SearchDropdown
        id={listboxId} open={open} results={results} activeIndex={activeIndex}
        disabled={disabled} onActivate={setActiveIndex} onSelect={selectPlace}
        states={states} selectedState={selectedState} onStateChange={changeState}
      />
    </div>
  )
}
