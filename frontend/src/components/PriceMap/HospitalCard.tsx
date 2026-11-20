import { useEffect, useId, useRef, useState } from 'react'
import type { Hospital as Place } from '../../api/hospitals'
import hospitalPhoto from './assets/sample-hospital.jpg'
import './HospitalCard.css'

type HospitalCardProps = {
  place: Place
  onClose: () => void
}

export default function HospitalCard({ place, onClose }: HospitalCardProps) {
  const headingId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <article className="hospital-card" role="dialog" aria-labelledby={headingId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}>
      <div className="hospital-card__photo" data-unavailable={photoFailed}>
        {!photoFailed && (
          <img src={hospitalPhoto} alt="Illustrative exterior of a fictional community hospital"
            width="1536" height="1024" onError={() => setPhotoFailed(true)} />
        )}
        {photoFailed && <span className="hospital-card__photo-fallback">Hospital image placeholder</span>}
        <span className="hospital-card__photo-label">Placeholder image</span>
        <button ref={closeRef} className="hospital-card__close" type="button" aria-label="Close hospital information" onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="hospital-card__body">
        <h2 id={headingId} className="hospital-card__town">{place.name}</h2>
        <p className="hospital-card__address">{place.address}</p>
        <p className="hospital-card__address">{[place.city, place.state, place.zipcode].filter(Boolean).join(' ')}</p>
        {place.websiteUrl ? (
          <a className="hospital-card__website" href={place.websiteUrl} target="_blank" rel="noopener noreferrer"
            aria-label={`Visit ${place.name} website (opens in a new tab)`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" />
              <path d="M3 12h18M5 6h14M5 18h14" />
            </svg>
            Visit website <span aria-hidden="true">↗</span>
          </a>
        ) : <p className="hospital-card__website-unavailable">Website unavailable</p>}
      </div>
    </article>
  )
}
