import './App.css'
import type {CSSProperties} from "react";

function App() {


  return (
    <>
      <button className="home-btn">
        <i className="fas fa-home"></i>
      </button>
      
      <button id="settings-toggle" className="settings-toggle">
        <i className="fas fa-cog"></i>
      </button>
      
      <div className="settings-sidebar">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
        </div>
        <div className="settings-field">
          <label className="settings-label">Theme</label>
          <select className="custom-select" id="themeSelect">
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
                    <svg width="120" height="120" viewBox="0 0 220 220"
                         preserveAspectRatio="xMidYMid meet">

                      <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="var(--primary)"/>
                          <stop offset="100%" stop-color="var(--secondary)"/>
                        </linearGradient>
                      </defs>
                      
                      <circle
                          cx="110" cy="110" r="90"
                          fill="none"
                          stroke="rgba(255,255,255,0.15)"
                          stroke-width="12"
                      />
                      
                      <circle
                          cx="110" cy="110" r="90"
                          fill="none"
                          stroke="url(#arcGradient)"
                          stroke-width="12"
                          stroke-linecap="round"
                          stroke-dasharray="565.49"
                          stroke-dashoffset="141.37"
                          transform="rotate(-90 110 110)"
                      />
                      
                      <text
                          x="110" y="110"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          font-size="52"
                          font-weight="700"
                          fill="white"
                      >12/25
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
                    <svg width="120" height="120" viewBox="0 0 220 220"
                         preserveAspectRatio="xMidYMid meet">

                      <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="var(--primary)"/>
                          <stop offset="100%" stop-color="var(--secondary)"/>
                        </linearGradient>
                      </defs>
                      
                      <circle
                          cx="110" cy="110" r="90"
                          fill="none"
                          stroke="rgba(255,255,255,0.15)"
                          stroke-width="12"
                      />
                      
                      <circle
                          cx="110" cy="110" r="90"
                          fill="none"
                          stroke="url(#arcGradient)"
                          stroke-width="12"
                          stroke-linecap="round"
                          stroke-dasharray="565.49"
                          stroke-dashoffset="141.37"
                          transform="rotate(-90 110 110)"
                      />
                      
                      <text
                          x="110" y="110"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          font-size="52"
                          font-weight="700"
                          fill="white"
                      >15/45
                      </text>

                    </svg>

                  </div>
                </div>
                <div className="card glass card-caption">
                  <p className="card-caption-text">Tody Review</p>
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
                    <div className="progress-fill" style={{width: "45%"}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <nav className="bottom-nav glass">
        
        <div id="radialMenu" className="radial-menu">
          <div
              className="radial-item"
              style={{ "--angle": "-90deg" } as CSSProperties}
          >
            <i className="fas fa-home"></i>
          </div>
          <div
              className="radial-item"
              style={{ "--angle": "-60deg" } as CSSProperties}
          >
            <i className="fas fa-search"></i>
          </div>

          <div
              className="radial-item"
              style={{ "--angle": "-30deg" } as CSSProperties}
          >
            <i className="fas fa-book-open"></i>
          </div>

          <div
              className="radial-item"
              style={{ "--angle": "0deg" } as CSSProperties}
          >
            <i className="fas fa-envelope"></i>
          </div>

          <div
              className="radial-item"
              style={{ "--angle": "30deg" } as CSSProperties}
          >
            <i className="fas fa-star"></i>
          </div>

          <div
              className="radial-item"
              style={{ "--angle": "60deg" } as CSSProperties}
          >
            <i className="fas fa-user"></i>
          </div>

          <div
              className="radial-item"
              style={{ "--angle": "90deg" } as CSSProperties}
          >
            <i className="fas fa-gear"></i>
          </div>
        </div>

        <div className="nav-items">
          
          <button
              className="menu-item nav-btn glass"
              type="button"
              title="Home"
          >
            <span className="fas fa-home nav-icon"></span>
          </button>
          
          <button
              className="menu-item nav-btn glass"
              type="button"
              title="Home"
          >
            <span className="fas fa-book-open nav-icon"></span>
          </button>
          
          <button
              id="settingsBtn"
              className="nav-btn glass"
              type="button"
              title="Settings"
          >
            <i id="settingsIcon" className="fas fa-cog nav-icon"></i>
          </button>
          
          <button
              className="menu-item nav-btn glass"
              type="button"
              title="Home"
          >
            <span className="fas fa-rotate-back nav-icon"></span>
          </button>
          
          <button
              className="menu-item nav-btn glass"
              type="button"
              title="Home"
          >
            <span className="fas fa-school nav-icon"></span>
          </button>
        </div>
      </nav>
      
      <div id="pageOverlay" className="page-overlay" aria-hidden="true"></div>

      <script type="module" src="../sidebar.js"></script>
    </>
  )
}

export default App
