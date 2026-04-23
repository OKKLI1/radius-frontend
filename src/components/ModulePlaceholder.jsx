import { C } from '../theme'

export default function ModulePlaceholder({ title, subtitle, bullets }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{subtitle}</p>
      </div>

      <div style={styles.wrap}>
        <div style={styles.banner}>
          <div style={styles.badge}>Fase UI</div>
          <h2 style={styles.bannerTitle}>Modulo listo para integrar backend</h2>
          <p style={styles.bannerText}>
            Esta pantalla ya esta conectada al router y menu. En la siguiente fase solo
            debemos enlazar endpoints FastAPI y CRUD real.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Siguiente implementacion</div>
          <ul style={styles.list}>
            {bullets.map((item) => (
              <li key={item} style={styles.item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1.2fr) minmax(260px, 1fr)',
    gap: 16,
  },
  banner: {
    background: C.gradientCard,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '22px 24px',
  },
  badge: {
    width: 'fit-content',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: C.accent,
    border: `1px solid ${C.accent}55`,
    background: C.accentDim,
    borderRadius: 999,
    padding: '4px 10px',
    marginBottom: 10,
  },
  bannerTitle: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
  },
  bannerText: {
    margin: '10px 0 0',
    color: C.textSoft,
    fontSize: 13,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '20px 22px',
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 600,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 13,
    color: C.text,
  },
  item: {
    lineHeight: 1.3,
  },
}
