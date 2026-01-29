export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Coming soon</p>
      </div>
    </div>
  )
}

