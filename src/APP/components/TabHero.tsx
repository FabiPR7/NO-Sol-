import type { ReactNode } from 'react'
import './TabHero.css'

type TabHeroProps = {
  eyebrow?: string
  title: ReactNode
  lead?: string
  tags?: string[]
  variant?: 'warm' | 'cool' | 'neutral'
}

function TabHero({
  eyebrow,
  title,
  lead,
  tags,
  variant = 'warm',
}: TabHeroProps) {
  return (
    <header className={`tab-hero tab-hero--${variant}`}>
      {eyebrow && <span className="tab-hero__eyebrow">{eyebrow}</span>}
      <h1 className="tab-hero__title">{title}</h1>
      {lead && <p className="tab-hero__lead">{lead}</p>}
      {tags && tags.length > 0 && (
        <ul className="tab-hero__tags">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
    </header>
  )
}

export default TabHero
