// Yavaa — design system primitives, tokens, icons

// Palettes — Latin-warm, but each variant has a different mood.
// Each palette is a closed system: bg / surface / ink / muted / line / primary / primary-ink / verified.
const PALETTES = {
  terracotta: {
    name: 'Terracotta',
    bg: '#F6EFE3',
    surface: '#FFFBF3',
    ink: '#1F1A14',
    muted: '#6B6258',
    line: '#E5DBC8',
    primary: '#C0492A',
    primaryInk: '#FFF5EC',
    verified: '#2F6B3A',
    swatch: '#C0492A',
  },
  jade: {
    name: 'Jade',
    bg: '#F1EEE6',
    surface: '#FFFEFA',
    ink: '#15201A',
    muted: '#5A6760',
    line: '#DCDED2',
    primary: '#0E5C3F',
    primaryInk: '#EFFBE9',
    verified: '#B14B1F',
    swatch: '#0E5C3F',
  },
  midnight: {
    name: 'Midnight',
    bg: '#10131A',
    surface: '#1A1F2A',
    ink: '#F4F1EA',
    muted: '#9099A8',
    line: '#2A2F3C',
    primary: '#F1A03C',
    primaryInk: '#1B1408',
    verified: '#5BC489',
    swatch: '#F1A03C',
  },
};

// All copy strings — toggleable ES / EN. Spanish is canonical; English mirrors.
const COPY = {
  es: {
    appName: 'Yavaa',
    tagline: 'Trabajadores de confianza, cerca de ti',
    searchPlaceholder: 'Buscar plomero, electricista...',
    helloMorning: 'Buenos días,',
    youName: 'Camila',
    nearYou: 'Cerca de ti',
    seeAll: 'Ver todo',
    categories: 'Categorías',
    topRated: 'Mejor calificados',
    available: 'Disponible',
    busy: 'Ocupado',
    verified: 'Verificado',
    background: 'Antecedentes',
    insured: 'Asegurado',
    reviews: 'reseñas',
    review: 'reseña',
    jobs: 'trabajos',
    book: 'Reservar',
    bookNow: 'Reservar ahora',
    message: 'Mensaje',
    profile: 'Perfil',
    aboutMe: 'Sobre mí',
    services: 'Servicios',
    photos: 'Fotos del trabajo',
    pricing: 'desde',
    perHour: '/hora',
    perJob: '/visita',
    bookTitle: 'Reservar visita',
    when: '¿Cuándo?',
    today: 'Hoy',
    tomorrow: 'Mañana',
    pickDate: 'Otro día',
    timeLabel: 'Hora estimada',
    addressLabel: 'Dirección',
    addressValue: 'Calle Reforma 1024, Col. Centro',
    description: 'Cuéntanos qué necesitas',
    descriptionHint: 'Ej. Fuga en el lavabo del baño principal...',
    estTotal: 'Total estimado',
    payAfter: 'Pagas al terminar',
    confirm: 'Confirmar reserva',
    confirmedTitle: '¡Listo, Camila!',
    confirmedSub: 'Mateo va en camino',
    eta: 'Llega en',
    minutes: 'min',
    track: 'Seguir en tiempo real',
    yourBooking: 'Tu reserva',
    home: 'Inicio',
    search: 'Buscar',
    bookings: 'Reservas',
    chats: 'Mensajes',
    you: 'Tú',
    workers: 'profesionales',
    filterAll: 'Todos',
    filterAvailable: 'Disponible hoy',
    filterTop: 'Top',
    filterNear: 'Más cerca',
    sortRelevance: 'Más relevantes',
    cancel: 'Cancelar',
    backendOnboarding: 'Tip: pide credencial al llegar',
    trustHeader: 'Por qué confiar',
    backgroundCheck: 'Verificación de identidad',
    backgroundCheckSub: 'Documento e historial revisados',
    insuredSub: 'Cubierto hasta $50,000 MXN',
    reviewsCheckedSub: '243 reseñas verificadas',
    callBtn: 'Llamar',
    chatBtn: 'Chat',
    addressLabelShort: 'Dirección',
    paymentLabel: 'Método de pago',
    paymentValue: 'Visa •• 4821',
    serviceLabel: 'Servicio',
  },
  en: {
    appName: 'Yavaa',
    tagline: 'Trusted local workers, near you',
    searchPlaceholder: 'Search plumber, electrician...',
    helloMorning: 'Good morning,',
    youName: 'Camila',
    nearYou: 'Near you',
    seeAll: 'See all',
    categories: 'Categories',
    topRated: 'Top rated',
    available: 'Available',
    busy: 'Busy',
    verified: 'Verified',
    background: 'Background',
    insured: 'Insured',
    reviews: 'reviews',
    review: 'review',
    jobs: 'jobs',
    book: 'Book',
    bookNow: 'Book now',
    message: 'Message',
    profile: 'Profile',
    aboutMe: 'About me',
    services: 'Services',
    photos: 'Work photos',
    pricing: 'from',
    perHour: '/hour',
    perJob: '/visit',
    bookTitle: 'Book a visit',
    when: 'When?',
    today: 'Today',
    tomorrow: 'Tomorrow',
    pickDate: 'Pick a date',
    timeLabel: 'Estimated time',
    addressLabel: 'Address',
    addressValue: '1024 Reforma St, Centro',
    description: 'Tell us what you need',
    descriptionHint: 'e.g. Leak under main bathroom sink...',
    estTotal: 'Estimated total',
    payAfter: 'Pay after the job',
    confirm: 'Confirm booking',
    confirmedTitle: "You're set, Camila!",
    confirmedSub: 'Mateo is on the way',
    eta: 'Arrives in',
    minutes: 'min',
    track: 'Track in real time',
    yourBooking: 'Your booking',
    home: 'Home',
    search: 'Search',
    bookings: 'Bookings',
    chats: 'Messages',
    you: 'You',
    workers: 'pros',
    filterAll: 'All',
    filterAvailable: 'Available today',
    filterTop: 'Top',
    filterNear: 'Nearest',
    sortRelevance: 'Most relevant',
    cancel: 'Cancel',
    backendOnboarding: 'Tip: ask for ID on arrival',
    trustHeader: 'Why you can trust',
    backgroundCheck: 'Identity verified',
    backgroundCheckSub: 'Government ID and history checked',
    insuredSub: 'Covered up to $50,000 MXN',
    reviewsCheckedSub: '243 verified reviews',
    callBtn: 'Call',
    chatBtn: 'Chat',
    addressLabelShort: 'Address',
    paymentLabel: 'Payment method',
    paymentValue: 'Visa •• 4821',
    serviceLabel: 'Service',
  },
};

// Categories — emoji-free; each gets a tiny line glyph + a tonal background hue.
const CATEGORIES_ES = [
  { id: 'plomeria',     es: 'Plomería',     en: 'Plumbing',    icon: 'pipe',    tint: 1 },
  { id: 'electricidad', es: 'Electricidad', en: 'Electrical',  icon: 'bolt',    tint: 2 },
  { id: 'limpieza',     es: 'Limpieza',     en: 'Cleaning',    icon: 'broom',   tint: 3 },
  { id: 'jardineria',   es: 'Jardinería',   en: 'Gardening',   icon: 'leaf',    tint: 4 },
  { id: 'pintura',      es: 'Pintura',      en: 'Painting',    icon: 'roller',  tint: 5 },
  { id: 'carpinteria',  es: 'Carpintería',  en: 'Carpentry',   icon: 'saw',     tint: 6 },
  { id: 'mudanzas',     es: 'Mudanzas',     en: 'Moving',      icon: 'box',     tint: 1 },
  { id: 'climatizacion',es: 'Aire / clima', en: 'AC / heat',   icon: 'fan',     tint: 2 },
];

// Workers — full directory used across screens.
const WORKERS = [
  {
    id: 'mateo',
    name: 'Mateo Reyes',
    trade: { es: 'Plomero', en: 'Plumber' },
    initials: 'MR',
    avatarHue: 18,   // warm
    rating: 4.96,
    reviews: 243,
    jobs: 1180,
    distanceKm: 1.2,
    eta: 18,
    available: true,
    verified: true,
    insured: true,
    bgChecked: true,
    priceFrom: 280,
    priceUnit: 'visit',
    languages: ['ES', 'EN'],
    bio: {
      es: 'Plomero certificado con 12 años de experiencia. Especialidad en fugas y calentadores. Llego en menos de 30 minutos en horario laboral.',
      en: 'Certified plumber, 12 years on the job. Specialist in leaks and heaters. I show up in under 30 min during work hours.',
    },
    services: [
      { es: 'Fuga de tubería',    en: 'Pipe leak',         price: 280 },
      { es: 'Reparación WC',      en: 'Toilet repair',     price: 320 },
      { es: 'Calentador de agua', en: 'Water heater',      price: 540 },
      { es: 'Destape de drenaje', en: 'Drain unclog',      price: 380 },
    ],
  },
  {
    id: 'lucia',
    name: 'Lucía Hernández',
    trade: { es: 'Electricista', en: 'Electrician' },
    initials: 'LH',
    avatarHue: 280,
    rating: 4.92,
    reviews: 187,
    jobs: 904,
    distanceKm: 2.4,
    eta: 32,
    available: true,
    verified: true,
    insured: true,
    bgChecked: true,
    priceFrom: 320,
    priceUnit: 'visit',
    languages: ['ES'],
    bio: {
      es: 'Electricista con cédula. Hago instalaciones residenciales, paneles y diagnóstico de cortos.',
      en: 'Licensed electrician. Residential installs, panel work, short-circuit diagnosis.',
    },
    services: [],
  },
  {
    id: 'andres',
    name: 'Andrés Salazar',
    trade: { es: 'Pintor', en: 'Painter' },
    initials: 'AS',
    avatarHue: 200,
    rating: 4.88,
    reviews: 156,
    jobs: 612,
    distanceKm: 3.1,
    eta: 45,
    available: false,
    verified: true,
    insured: false,
    bgChecked: true,
    priceFrom: 1200,
    priceUnit: 'job',
    languages: ['ES'],
    bio: { es: '', en: '' },
    services: [],
  },
  {
    id: 'sofia',
    name: 'Sofía Cárdenas',
    trade: { es: 'Limpieza', en: 'Cleaning' },
    initials: 'SC',
    avatarHue: 140,
    rating: 4.94,
    reviews: 312,
    jobs: 1421,
    distanceKm: 0.8,
    eta: 14,
    available: true,
    verified: true,
    insured: true,
    bgChecked: true,
    priceFrom: 220,
    priceUnit: 'hour',
    languages: ['ES', 'EN'],
    bio: { es: '', en: '' },
    services: [],
  },
  {
    id: 'rafa',
    name: 'Rafael Ortiz',
    trade: { es: 'Carpintero', en: 'Carpenter' },
    initials: 'RO',
    avatarHue: 30,
    rating: 4.85,
    reviews: 98,
    jobs: 410,
    distanceKm: 4.2,
    eta: 52,
    available: true,
    verified: true,
    insured: true,
    bgChecked: false,
    priceFrom: 450,
    priceUnit: 'visit',
    languages: ['ES'],
    bio: { es: '', en: '' },
    services: [],
  },
  {
    id: 'paula',
    name: 'Paula Domínguez',
    trade: { es: 'Jardinería', en: 'Gardening' },
    initials: 'PD',
    avatarHue: 100,
    rating: 4.9,
    reviews: 64,
    jobs: 240,
    distanceKm: 2.0,
    eta: 26,
    available: true,
    verified: true,
    insured: false,
    bgChecked: true,
    priceFrom: 350,
    priceUnit: 'visit',
    languages: ['ES'],
    bio: { es: '', en: '' },
    services: [],
  },
];

// ─── Tiny line icons (24px viewbox) ────────────────────────────
function Icon({ name, size = 22, stroke = 'currentColor', strokeWidth = 1.6, fill = 'none' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'pin':
      return <svg {...props}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'star':
      return <svg {...props} fill={stroke}><path d="m12 3.5 2.7 5.5 6.1.9-4.4 4.3 1 6L12 17.4 6.6 20.2l1-6L3.2 9.9l6.1-.9z"/></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6L12 3z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'check':
      return <svg {...props}><path d="m5 12 4 4 10-10"/></svg>;
    case 'chevron':
      return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-down':
      return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-left':
      return <svg {...props}><path d="m15 6-6 6 6 6"/></svg>;
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'home':
      return <svg {...props}><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg>;
    case 'calendar':
      return <svg {...props}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>;
    case 'chat':
      return <svg {...props}><path d="M4 5h16v11H8l-4 4z"/></svg>;
    case 'user':
      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'phone':
      return <svg {...props}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>;
    case 'message':
      return <svg {...props}><path d="M4 6h16v10H10l-4 4V6z"/></svg>;
    case 'sliders':
      return <svg {...props}><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'card':
      return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>;
    case 'heart':
      return <svg {...props}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    case 'mic':
      return <svg {...props}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    // category glyphs
    case 'pipe':
      return <svg {...props}><path d="M4 8h6v8H4zM14 6h6v12h-6zM10 12h4"/></svg>;
    case 'bolt':
      return <svg {...props} fill={stroke} stroke="none"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>;
    case 'broom':
      return <svg {...props}><path d="M14 4 9 13M5 21l4-8h6l4 8M9 13h6"/></svg>;
    case 'leaf':
      return <svg {...props}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8"/></svg>;
    case 'roller':
      return <svg {...props}><rect x="3" y="5" width="14" height="6" rx="1"/><path d="M17 8h3v3h-7v3M10 14h-2v6h4v-6h-2"/></svg>;
    case 'saw':
      return <svg {...props}><path d="M3 14h12l5-5-2-2-3 3-2-2-3 3-2-2-3 3-2-2zM3 14v4h12v-4"/></svg>;
    case 'box':
      return <svg {...props}><path d="M3 7 12 3l9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>;
    case 'fan':
      return <svg {...props}><circle cx="12" cy="12" r="2"/><path d="M12 2c-3 0-5 2-5 5 0 2 1 3 3 4M12 2c3 0 5 2 5 5 0 2-1 3-3 4M22 12c0-3-2-5-5-5-2 0-3 1-4 3M22 12c0 3-2 5-5 5-2 0-3-1-4-3M2 12c0-3 2-5 5-5 2 0 3 1 4 3M2 12c0 3 2 5 5 5 2 0 3-1 4-3"/></svg>;
    default:
      return null;
  }
}

// Small, recurring UI bits
function Avatar({ initials, hue = 18, size = 48, ring = false }) {
  const bg = `oklch(0.78 0.08 ${hue})`;
  const ink = `oklch(0.28 0.08 ${hue})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: size * 0.36,
      letterSpacing: -0.4,
      boxShadow: ring ? '0 0 0 3px rgba(255,255,255,0.95), 0 0 0 4px rgba(0,0,0,0.06)' : 'none',
      position: 'relative',
    }}>
      {initials}
    </div>
  );
}

function VerifiedDot({ palette, size = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: palette.verified, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 4 4 10-10"/>
      </svg>
    </div>
  );
}

function Pill({ children, palette, tone = 'soft', style = {} }) {
  const tones = {
    soft:    { bg: palette.surface, color: palette.ink, border: `1px solid ${palette.line}` },
    primary: { bg: palette.primary, color: palette.primaryInk, border: '1px solid transparent' },
    verified:{ bg: 'transparent',   color: palette.verified, border: `1px solid ${palette.verified}40` },
    ghost:   { bg: 'transparent',   color: palette.muted, border: `1px solid ${palette.line}` },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      fontSize: 13, fontWeight: 500, letterSpacing: -0.1,
      ...tones[tone], ...style,
    }}>{children}</span>
  );
}

// Photo placeholder — diagonal stripes + monospace label. NEVER draw realistic SVG art.
function PhotoSlot({ label, hue = 30, ratio = '1 / 1', radius = 18, palette, fill = false }) {
  // When fill=true (or ratio='auto'), photo expands to fill its parent box.
  const sizing = fill || ratio === 'auto'
    ? { width: '100%', height: '100%' }
    : { width: '100%', aspectRatio: ratio };
  return (
    <div style={{
      ...sizing, borderRadius: radius,
      background: `repeating-linear-gradient(45deg, oklch(0.86 0.04 ${hue}) 0 8px, oklch(0.82 0.04 ${hue}) 8px 16px)`,
      position: 'relative', overflow: 'hidden',
      border: radius === 0 ? 'none' : `1px solid ${palette.line}`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 10, letterSpacing: 0.5,
        color: `oklch(0.32 0.04 ${hue})`, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  );
}

// Export everything to window so other babel scripts see it
Object.assign(window, { PALETTES, COPY, CATEGORIES_ES, WORKERS, Icon, Avatar, VerifiedDot, Pill, PhotoSlot });
