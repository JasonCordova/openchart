import { useEffect, useId, useRef, useState } from 'react'
import type { Place } from '../samplePlaces'
import hospitalPhoto from './assets/sample-hospital.jpg'
import './HospitalCard.css'

const formatPrice = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

type HospitalCardProps = {
  place: Place
  onClose: () => void
}

export default function HospitalCard({ place, onClose }: HospitalCardProps) {
  const headingId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const separator = place.name.lastIndexOf(', ')
  const town = separator === -1 ? place.name : place.name.slice(0, separator)

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
        {photoFailed && <span className="hospital-card__photo-fallback">Sample hospital</span>}
        <button ref={closeRef} className="hospital-card__close" type="button" aria-label="Close hospital information" onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="hospital-card__body">
        <h2 id={headingId} className="hospital-card__town">{town}</h2>
        <p className="hospital-card__address">{place.address}</p>
        <p className="hospital-card__price">{formatPrice.format(place.price)} <span>estimate</span></p>
      </div>
    </article>
  )
}
