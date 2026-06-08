// Sidebar functionality for opening and closing the settings sidebar

document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeRadialMenu();
});

function initializeSidebar() {
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsSidebar = document.querySelector('.settings-sidebar');

    if (settingsToggle && settingsSidebar) {
        settingsToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            settingsSidebar.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!settingsSidebar.contains(e.target) && !settingsToggle.contains(e.target)) {
                settingsSidebar.classList.remove('active');
            }
        });

        settingsSidebar.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Theme selector functionality
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        const savedTheme = localStorage.getItem('theme') || 'TomorrowNight';
        themeSelect.value = savedTheme;

        themeSelect.addEventListener('change', function() {
            localStorage.setItem('theme', this.value);
            applyTheme(this.value);
        });

        applyTheme(savedTheme);
    }
}

function initializeRadialMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsIcon = document.getElementById('settingsIcon');
    const radialMenu = document.getElementById('radialMenu');
    const menuItems = document.querySelectorAll('.menu-item');
    const pageOverlay = document.getElementById('pageOverlay');

    if (!settingsBtn || !settingsIcon || !radialMenu) return;

    // ensure button sits above nav for pointer events
    try { settingsBtn.style.zIndex = '999'; } catch (e) {}

    console.log('initializeRadialMenu: elements found', {settingsBtn: !!settingsBtn, settingsIcon: !!settingsIcon, radialMenu: !!radialMenu, menuItems: menuItems.length});

    let opened = false;
    settingsBtn.addEventListener('click', (e) => {
        console.log('settingsBtn clicked, opened=', opened);
        e.stopPropagation();
        opened = !opened;

        if (opened) {
            menuItems.forEach(item => item.classList.add('hide'));
            radialMenu.classList.add('open');
            if (pageOverlay) pageOverlay.classList.add('open');
            settingsIcon.classList.remove('fa-cog');
            settingsIcon.classList.add('fa-xmark');
        } else {
            menuItems.forEach(item => item.classList.remove('hide'));
            radialMenu.classList.remove('open');
            if (pageOverlay) pageOverlay.classList.remove('open');
            settingsIcon.classList.remove('fa-xmark');
            settingsIcon.classList.add('fa-cog');
        }
    });

    document.addEventListener('click', function(e) {
        if (opened && !settingsBtn.contains(e.target) && !radialMenu.contains(e.target)) {
            opened = false;
            menuItems.forEach(item => item.classList.remove('hide'));
            radialMenu.classList.remove('open');
            if (pageOverlay) pageOverlay.classList.remove('open');
            settingsIcon.classList.remove('fa-xmark');
            settingsIcon.classList.add('fa-cog');
        }
    });

    if (pageOverlay) {
        pageOverlay.addEventListener('click', function() {
            // close radial
            if (radialMenu.classList.contains('open')) {
                radialMenu.classList.remove('open');
                menuItems.forEach(item => item.classList.remove('hide'));
                settingsIcon.classList.remove('fa-xmark');
                settingsIcon.classList.add('fa-cog');
                pageOverlay.classList.remove('open');
                opened = false;
            }
        });
    }
}

function applyTheme(themeName) {
    const themes = {
        'Light': {
            '--primary': '#0093f3',
            '--secondary': '#fce9bf',
            '--accent': '#c2d1e6',
            '--background': '#0F172A',
            '--surface': '#1E293B',
            '--text': '#F8FAFC',
        },
        'Dark': {
            '--primary': '#1c3e6b',
            '--secondary': '#c2d1e6',
            '--accent': '#ddf4fc',
            '--background': '#0F172A',
            '--surface': '#1E293B',
            '--text': '#F8FAFC',
        }
    };

    const theme = themes[themeName] || themes['Dark'];
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

function navigateToPage(page) {
    window.location.href = page;
}

