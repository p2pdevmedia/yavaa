// Yavaa — app shell. Wires screens, navigation, tweaks, tab bar.

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "terracotta",
  "lang": "es",
  "showTabBar": true
}/*EDITMODE-END*/;

function TabBar({ palette, t, current, onSelect }) {
  const tabs = [
    { id: 'home',     icon: 'home',     label: t.home },
    { id: 'category', icon: 'search',   label: t.search },
    { id: 'book',     icon: 'calendar', label: t.bookings },
    { id: 'chats',    icon: 'chat',     label: t.chats },
    { id: 'profile',  icon: 'user',     label: t.you },
  ];
  // map current screen → active tab id
  const activeMap = {
    home: 'home', category: 'category', profile: 'home', book: 'book', confirmed: 'book', search: 'category',
  };
  const active = activeMap[current] || 'home';
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 22, zIndex: 50,
      padding: '6px 8px',
      background: `${palette.surface}E6`, backdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 28, border: `1px solid ${palette.line}`,
      boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onSelect(tab.id)} style={{
            flex: 1, padding: '10px 4px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? palette.primary : palette.muted,
          }}>
            <Icon name={tab.icon} size={22} stroke="currentColor" strokeWidth={isActive ? 2 : 1.6} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: 0.1 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function YavaaApp({ palette, lang }) {
  const [screen, setScreen] = useState('home');
  const [ctx, setCtx] = useState({});
  const t = COPY[lang];

  const nav = (s, c = {}) => {
    setScreen(s);
    setCtx(c);
    // scroll the iOS device content to top
    requestAnimationFrame(() => {
      const scroller = document.querySelector('[data-yavaa-scroll]');
      if (scroller) scroller.scrollTop = 0;
    });
  };

  const screenProps = { palette, t, lang, nav, ctx };

  let body;
  switch (screen) {
    case 'home':      body = <HomeScreen      {...screenProps} />; break;
    case 'category':  body = <CategoryScreen  {...screenProps} />; break;
    case 'profile':   body = <ProfileScreen   {...screenProps} />; break;
    case 'book':      body = <BookScreen      {...screenProps} />; break;
    case 'confirmed': body = <ConfirmedScreen {...screenProps} />; break;
    default:          body = <HomeScreen      {...screenProps} />;
  }

  // Show tab bar on home & category; hide on profile/book/confirmed (they have their own sticky CTA)
  const showTab = screen === 'home' || screen === 'category';

  // dynamic island color
  const darkIsland = screen === 'profile';

  return (
    <div style={{
      width: 402, height: 874, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: palette.bg,
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
      }} />
      {/* status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar dark={false} />
      </div>
      {/* scrolling content */}
      <div data-yavaa-scroll style={{ height: '100%', overflow: 'auto', position: 'relative' }}>
        {body}
      </div>
      {/* tab bar */}
      {showTab && (
        <TabBar palette={palette} t={t} current={screen} onSelect={(tabId) => {
          if (tabId === 'home') nav('home');
          else if (tabId === 'category') nav('category', { categoryId: 'plomeria' });
          else if (tabId === 'book') nav('confirmed', { workerId: 'mateo' });
          else nav('home');
        }} />
      )}
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 3, background: palette.ink, opacity: 0.85, zIndex: 60,
      }} />
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[t.palette] || PALETTES.terracotta;
  const lang = t.lang || 'es';

  // page background — soft warm gradient field that complements active palette
  const pageBg = t.palette === 'midnight'
    ? 'radial-gradient(ellipse at 30% 20%, #1A1F2A 0%, #0A0C12 60%)'
    : t.palette === 'jade'
      ? 'radial-gradient(ellipse at 30% 20%, #E8E2D2 0%, #C9C7B6 70%)'
      : 'radial-gradient(ellipse at 30% 20%, #ECE0CB 0%, #D4C3A6 70%)';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', background: pageBg,
      fontFamily: 'Manrope, system-ui, sans-serif',
    }}>
      {/* watermark wordmark */}
      <div style={{
        position: 'fixed', top: 28, left: 28, zIndex: 1,
        fontFamily: 'Instrument Serif, serif',
        fontSize: 22, fontStyle: 'italic',
        color: t.palette === 'midnight' ? '#F4F1EAcc' : '#1F1A14cc',
        letterSpacing: -0.3,
      }}>
        yavaa<span style={{
          fontFamily: 'Manrope', fontSize: 11, fontStyle: 'normal',
          marginLeft: 8, padding: '2px 8px', borderRadius: 999,
          border: `1px solid ${t.palette === 'midnight' ? '#F4F1EA40' : '#1F1A1430'}`,
          letterSpacing: 0.5,
        }}>PROTOTYPE</span>
      </div>

      <YavaaApp palette={palette} lang={lang} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Palette"
          value={t.palette}
          options={[
            { value: 'terracotta', label: 'Terracotta' },
            { value: 'jade',       label: 'Jade' },
            { value: 'midnight',   label: 'Midnight' },
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakSection label="Copy" />
        <TweakRadio
          label="Language"
          value={t.lang}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
          ]}
          onChange={(v) => setTweak('lang', v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
