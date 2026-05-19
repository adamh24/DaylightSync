export default function Card({ title, children, fullWidth = false }) {
  return (
    <div className={`card${fullWidth ? ' card--full' : ''}`}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </div>
  )
}
