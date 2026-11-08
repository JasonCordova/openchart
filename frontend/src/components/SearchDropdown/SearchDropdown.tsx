import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import SearchResult from '../SearchResult/SearchResult'
import type { Place } from '../samplePlaces'
import { stateNames } from '../placeFilters'
import './SearchDropdown.css'

type SearchDropdownProps = {
  id: string
  open: boolean
  results: Place[]
  activeIndex: number
  disabled: boolean
  onActivate: (index: number) => void
  onSelect: (place: Place) => void
  states: string[]
  selectedState: string
  onStateChange: (state: string) => void
}

export default function SearchDropdown({ id, open, results, activeIndex, disabled, onActivate, onSelect, states, selectedState, onStateChange }: SearchDropdownProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const stateListRef = useRef<HTMLUListElement>(null)
  const stateTriggerRef = useRef<HTMLButtonElement>(null)
  const typeaheadRef = useRef({ text: '', time: 0 })
  const [stateMenuOpen, setStateMenuOpen] = useState(false)
  const [stateActiveIndex, setStateActiveIndex] = useState(0)
  const stateListId = `${id}-states`
  const stateOptions = [{ value: '', label: 'All' }, ...states.map((state) => ({ value: state, label: stateNames[state] ?? state }))]

  useEffect(() => {
    if (open && !stateMenuOpen && activeIndex >= 0) {
      listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }
    if (!open) setStateMenuOpen(false)
  }, [open, activeIndex, stateMenuOpen])

  useEffect(() => {
    if (stateMenuOpen) stateListRef.current?.children[stateActiveIndex]?.scrollIntoView({ block: 'nearest' })
  }, [stateMenuOpen, stateActiveIndex])

  function openStateMenu() {
    setStateActiveIndex(Math.max(0, stateOptions.findIndex((option) => option.value === selectedState)))
    setStateMenuOpen(true)
  }

  function selectState(state: string) {
    if (disabled) return
    onStateChange(state === selectedState ? '' : state)
    stateTriggerRef.current?.focus()
  }

  function handleStateKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setStateMenuOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!stateMenuOpen) openStateMenu()
      else setStateActiveIndex((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + stateOptions.length) % stateOptions.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setStateMenuOpen(true)
      setStateActiveIndex(event.key === 'Home' ? 0 : stateOptions.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (stateMenuOpen) selectState(stateOptions[stateActiveIndex].value)
      else openStateMenu()
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const now = Date.now()
      const previous = typeaheadRef.current
      const text = (now - previous.time < 700 ? previous.text : '') + event.key.toLowerCase()
      typeaheadRef.current = { text, time: now }
      const index = stateOptions.findIndex((option) => option.label.toLowerCase().startsWith(text))
      if (index >= 0) {
        setStateMenuOpen(true)
        setStateActiveIndex(index)
      }
    }
  }

  return (
    <div className="search-dropdown" data-open={open} inert={!open} aria-hidden={!open}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setStateMenuOpen(false) }}>
      <div className="search-dropdown__content">
        <div className="search-dropdown__filters">
          <div className="search-dropdown__heading">
            <span>Refine your search</span>
          </div>
          <div className="search-dropdown__chips" role="group" aria-label="Search filters">
            <button ref={stateTriggerRef} className="search-dropdown__state" type="button" role="combobox"
              disabled={disabled} aria-label="State" aria-haspopup="listbox" aria-expanded={stateMenuOpen}
              aria-controls={stateListId} aria-activedescendant={stateMenuOpen ? `${stateListId}-${stateActiveIndex}` : undefined}
              onClick={() => { if (stateMenuOpen) setStateMenuOpen(false); else openStateMenu() }}
              onKeyDown={handleStateKeys}>
              <span className="search-dropdown__state-label">State:</span>
              <span className="search-dropdown__state-value">{selectedState ? stateNames[selectedState] ?? selectedState : 'All'}</span>
              <svg className="search-dropdown__state-chevron" aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 6 3 3 3-3" />
              </svg>
            </button>
            {['Price', 'Procedure'].map((filter) => (
              <button key={filter} className="search-dropdown__upcoming" type="button" disabled title={`${filter} filter coming soon`}>
                {filter}
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 6 3 3 3-3" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        {stateMenuOpen ? (
          <div className="search-dropdown__state-menu">
            <div className="search-dropdown__state-menu-heading">
              <button className="search-dropdown__state-back" type="button" aria-label="Back to locations"
                onClick={() => { setStateMenuOpen(false); stateTriggerRef.current?.focus() }}>
                <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 4-4 4 4 4M3 8h10" />
                </svg>
                Back
              </button>
              <span>Choose a state</span>
            </div>
            <ul ref={stateListRef} className="search-dropdown__state-list" id={stateListId} role="listbox" aria-label="State">
              {stateOptions.map((option, index) => (
                <li key={option.value} id={`${stateListId}-${index}`} role="option"
                  aria-selected={option.value === selectedState} data-active={index === stateActiveIndex}
                  onPointerMove={() => setStateActiveIndex(index)} onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectState(option.value)}>
                  <span>{option.label}</span>
                  {option.value === selectedState && (
                    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m4 8 3 3 5-6" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
