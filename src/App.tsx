import './App.css'
import { useState, useEffect, useRef, type CSSProperties } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHome, faCog, faXmark, faSearch,
  faBookOpen, faEnvelope, faStar, faUser,
  faGear, faRotateBack, faSchool
} from '@fortawesome/free-solid-svg-icons'
import nightBackground from './assets/images/night.png'
import dayBackground from './assets/images/day.png'
import useModal from "./shared/hooks/useModal.ts";
import Modal from "./shared/components/Modal.tsx";

function App() {
  const [radialOpen, setRadialOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'Light')

  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const radialMenuRef = useRef<HTMLDivElement>(null)
  const settingsSidebarRef = useRef<HTMLDivElement>(null)
  const settingsToggleRef = useRef<HTMLButtonElement>(null)

  function applyTheme(themeName: string) {
    const themes: Record<string, Record<string, string>> = {
      Light: {
        '--background-image': `url(${dayBackground})`,
        '--primary': '#0093f3',
        '--secondary': '#fce9bf',
        '--accent': '#c2d1e6',
        '--background': '#0F172A',
        '--surface': '#1E293B',
        '--text': '#F8FAFC',
      },
      Dark: {
        '--background-image': `url(${nightBackground})`,
        '--primary': '#1c3e6b',
        '--secondary': '#c2d1e6',
        '--accent': '#ddf4fc',
        '--background': '#0F172A',
        '--surface': '#1E293B',
        '--text': '#F8FAFC',
      },
    }

    const selected = themes[themeName] || themes['Dark']
    const root = document.documentElement
    Object.entries(selected).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node

      if (
          radialOpen &&
          !settingsBtnRef.current?.contains(target) &&
          !radialMenuRef.current?.contains(target)
      ) {
        setRadialOpen(false)
      }

      if (
          sidebarOpen &&
          !settingsSidebarRef.current?.contains(target) &&
          !settingsToggleRef.current?.contains(target)
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [radialOpen, sidebarOpen])

  function handleRadialToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setRadialOpen(prev => !prev)
  }

  function handleOverlayClick() {
    setRadialOpen(false)
  }

  function handleSidebarToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setSidebarOpen(prev => !prev)
  }

  const radialItems = [
    { angle: '-90deg', icon: faHome },
    { angle: '-60deg', icon: faSearch },
    { angle: '-30deg', icon: faBookOpen },
    { angle: '0deg',   icon: faEnvelope },
    { angle: '30deg',  icon: faStar },
    { angle: '60deg',  icon: faUser },
    { angle: '90deg',  icon: faGear },
  ]

  const leftNavItems  = [
    { icon: faHome,     title: 'Home' },
    { icon: faBookOpen, title: 'Learn' },
  ]

  const rightNavItems = [
    { icon: faRotateBack, title: 'Back' },
    { icon: faSchool,     title: 'School' },
  ]

  const { isOpen, open, close } = useModal();

  return (
      <>
        <button className="home-btn" onClick={open}>
          <FontAwesomeIcon icon={faHome} />
        </button>

        <button
            ref={settingsToggleRef}
            className="settings-toggle"
            onClick={handleSidebarToggle}
        >
          <FontAwesomeIcon icon={faCog} />
        </button>

        <div
            ref={settingsSidebarRef}
            className={`settings-sidebar${sidebarOpen ? ' active' : ''}`}
            onClick={e => e.stopPropagation()}
        >
          <div className="settings-header">
            <h2 className="settings-title">Settings</h2>
          </div>
          <div className="settings-field">
            <label className="settings-label">Theme</label>
            <select
                className="custom-select"
                value={theme}
                onChange={e => setTheme(e.target.value)}
            >
              <option value="TomorrowNight">Tomorrow Night</option>
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="main-wrapper">
          <div className="title-section">
            <h1 className="title">Leitnix</h1>
          </div>
          <div className="content-stack">
            <div className="cards-layout">
              <div className="cards-row">
                <div className="card-column">
                  <div className="card glass learn-card">
                    <div className="card-inner">
                      <svg width="120" height="120" viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="arcGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="var(--secondary)" />
                          </linearGradient>
                        </defs>
                        <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
                        <circle
                            cx="110" cy="110" r="90"
                            fill="none"
                            stroke="url(#arcGradient1)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="565.49"
                            strokeDashoffset="141.37"
                            transform="rotate(-90 110 110)"
                        />
                        <text x="110" y="110" textAnchor="middle" dominantBaseline="middle" fontSize="52" fontWeight="700" fill="white">
                          12/25
                        </text>
                      </svg>
                    </div>
                  </div>
                  <div className="card glass card-caption">
                    <p className="card-caption-text">Today Words</p>
                  </div>
                </div>

                <div className="card-column">
                  <div className="card glass learn-card">
                    <div className="card-inner">
                      <svg width="120" height="120" viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="arcGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="var(--secondary)" />
                          </linearGradient>
                        </defs>
                        <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
                        <circle
                            cx="110" cy="110" r="90"
                            fill="none"
                            stroke="url(#arcGradient2)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="565.49"
                            strokeDashoffset="141.37"
                            transform="rotate(-90 110 110)"
                        />
                        <text x="110" y="110" textAnchor="middle" dominantBaseline="middle" fontSize="52" fontWeight="700" fill="white">
                          15/45
                        </text>
                      </svg>
                    </div>
                  </div>
                  <div className="card glass card-caption">
                    <p className="card-caption-text">Today Review</p>
                  </div>
                </div>
              </div>

              <div className="card glass progress-card">
                <div className="progress-inner">
                  <div className="card-title">Learning Progress</div>
                  <div>
                    <div className="progress-header">
                      <span className="progress-label">Learned</span>
                      <span className="progress-number">45<small>/100</small></span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-fill" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="bottom-nav glass">
          <div
              ref={radialMenuRef}
              className={`radial-menu${radialOpen ? ' open' : ''}`}
          >
            {radialItems.map(({ angle, icon }) => (
                <div
                    key={angle}
                    className="radial-item"
                    style={{ '--angle': angle } as CSSProperties}
                >
                  <FontAwesomeIcon icon={icon} />
                </div>
            ))}
          </div>

          <div className="nav-items">
            {leftNavItems.map(({ icon, title }) => (
                <button
                    key={title}
                    className={`menu-item nav-btn glass${radialOpen ? ' hide' : ''}`}
                    type="button"
                    title={title}
                >
                  <FontAwesomeIcon icon={icon} className="nav-icon" />
                </button>
            ))}

            <button
                ref={settingsBtnRef}
                id="settingsBtn"
                className="nav-btn glass"
                type="button"
                title="Settings"
                onClick={handleRadialToggle}
            >
              <FontAwesomeIcon icon={radialOpen ? faXmark : faCog} className="nav-icon" />
            </button>

            {rightNavItems.map(({ icon, title }) => (
                <button
                    key={title}
                    className={`menu-item nav-btn glass${radialOpen ? ' hide' : ''}`}
                    type="button"
                    title={title}
                >
                  <FontAwesomeIcon icon={icon} className="nav-icon" />
                </button>
            ))}
          </div>
        </nav>

        <div
            id="pageOverlay"
            className={`page-overlay${radialOpen ? ' open' : ''}`}
            aria-hidden="true"
            onClick={handleOverlayClick}
        />

        <Modal isOpen={isOpen} onClose={close} title="Theme">
          <h1>hello</h1>
          <select style={{display:"block"}}>
            <option>hello</option>
            <option>hello1</option>
            <option>hello2</option>
            <option>hello3</option>
          </select>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"text"}/>
          <input type={"password"}/>
          <input className={"glass-checkbox"} type={"checkbox"}/>
          <input type={"file"}/>
        </Modal>
      </>
  )
}

export default App