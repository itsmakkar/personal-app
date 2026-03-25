import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Today' },
  { to: '/track', label: 'Track' },
  { to: '/chat', label: 'Chat' },
  { to: '/documents', label: 'Documents' },
  { to: '/settings', label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        paddingBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          height: 64,
        }}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={{
              flex: 1,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              borderTop: '3px solid transparent',
            }}
            className="personal-bottom-nav-link"
          >
            {({ isActive }) => (
              <span
                style={{
                  color: isActive ? '#0ea5e9' : '#64748b',
                  borderTop: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
                  paddingTop: 14,
                  lineHeight: '1',
                }}
              >
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

