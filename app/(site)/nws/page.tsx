export default function NWSPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 117px)' }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c4a1e, #3d6b2a)',
        borderBottom: '2px solid #8fbc45',
        padding: '.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '.6rem',
      }}>
        <span>🌩️</span>
        <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.1rem', color: '#f0f7e6', margin: 0 }}>
          National Weather Service
        </h2>
        <a
          href="https://www.weather.gov"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.8rem', textDecoration: 'underline' }}
        >
          Open weather.gov ↗
        </a>
      </div>
      <iframe
        src="https://www.weather.gov"
        style={{ flex: 1, width: '100%', border: 'none' }}
        title="National Weather Service"
      />
    </div>
  );
}
