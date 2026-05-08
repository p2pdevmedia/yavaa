// Yavaa — screens. Each screen is a function returning JSX.
// All accept { palette, t, lang, nav, ctx } where:
//   palette = active color palette object
//   t = COPY[lang]
//   nav = (screenName, ctx?) => void
//   ctx = arbitrary context payload

// ─────────────────────────── HOME ───────────────────────────
function HomeScreen({ palette, t, lang, nav, density }) {
  const padX = 20;
  return (
    <div style={{ background: palette.bg, minHeight: '100%' }}>
      {/* status bar spacer */}
      <div style={{ height: 60 }} />

      {/* header — location + avatar */}
      <div style={{ padding: `8px ${padX}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: palette.muted }}>
          <Icon name="pin" size={16} stroke={palette.primary} />
          <span style={{ fontSize: 13, color: palette.muted }}>Centro, CDMX</span>
          <Icon name="chevron-down" size={14} stroke={palette.muted} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={iconBtn(palette)}><Icon name="heart" size={18} stroke={palette.ink} /></button>
          <Avatar initials="C" hue={18} size={36} ring />
        </div>
      </div>

      {/* greeting + tagline */}
      <div style={{ padding: `20px ${padX}px 18px` }}>
        <div style={{ color: palette.muted, fontSize: 15, marginBottom: 4 }}>{t.helloMorning}</div>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, system-ui',
          fontSize: 40, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.02,
          color: palette.ink, margin: 0,
        }}>
          {lang === 'es' ? (
            <>¿Qué necesitas<br/>arreglar <em style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.primary }}>hoy</em>?</>
          ) : (
            <>What needs<br/>fixing <em style={{ fontStyle: 'italic', fontFamily: 'Instrument Serif, serif', fontWeight: 400, color: palette.primary }}>today</em>?</>
          )}
        </h1>
      </div>

      {/* search bar */}
      <div style={{ padding: `0 ${padX}px 22px` }}>
        <button onClick={() => nav('search')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 16,
          background: palette.surface, border: `1px solid ${palette.line}`,
          color: palette.muted, fontSize: 15, textAlign: 'left', cursor: 'pointer',
        }}>
          <Icon name="search" size={20} stroke={palette.muted} />
          <span style={{ flex: 1 }}>{t.searchPlaceholder}</span>
          <div style={{ width: 1, height: 18, background: palette.line }} />
          <Icon name="mic" size={18} stroke={palette.primary} />
        </button>
      </div>

      {/* trust strip */}
      <div style={{ padding: `0 ${padX}px 22px` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 14px', borderRadius: 14,
          background: palette.surface, border: `1px dashed ${palette.line}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${palette.verified}18`, color: palette.verified,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="shield" size={20} stroke={palette.verified} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: palette.ink, lineHeight: 1.2 }}>
              {lang === 'es' ? 'Todos verificados con identificación' : 'All workers ID-verified'}
            </div>
            <div style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>
              {lang === 'es' ? 'Antecedentes y reseñas reales' : 'Background-checked, real reviews'}
            </div>
          </div>
        </div>
      </div>

      {/* categories grid */}
      <div style={{ padding: `0 ${padX}px 6px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={sectionTitle(palette)}>{t.categories}</h2>
        <button style={linkBtn(palette)}>{t.seeAll}</button>
      </div>
      <div style={{
        padding: `8px ${padX}px 22px`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
      }}>
        {CATEGORIES_ES.map((c) => (
          <button key={c.id} onClick={() => nav('category', { categoryId: c.id })} style={{
            padding: '14px 8px 10px', border: 'none', cursor: 'pointer',
            background: palette.surface, borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            border_: `1px solid ${palette.line}`,
            outline: `1px solid ${palette.line}`, outlineOffset: -1,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `oklch(0.93 0.04 ${30 + c.tint * 35})`,
              color: `oklch(0.32 0.08 ${30 + c.tint * 35})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={c.icon} size={20} stroke="currentColor" strokeWidth={1.7} />
            </div>
            <div style={{ fontSize: 11.5, color: palette.ink, fontWeight: 500, textAlign: 'center', lineHeight: 1.15 }}>
              {lang === 'es' ? c.es : c.en}
            </div>
          </button>
        ))}
      </div>

      {/* near you (horizontal scroller) */}
      <div style={{ padding: `0 ${padX}px 6px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={sectionTitle(palette)}>{t.nearYou}</h2>
        <button style={linkBtn(palette)}>{t.seeAll}</button>
      </div>
      <div style={{
        display: 'flex', gap: 12, padding: `12px ${padX}px 18px`,
        overflowX: 'auto', scrollSnapType: 'x mandatory',
      }}>
        {WORKERS.slice(0, 4).map((w) => (
          <NearbyCard key={w.id} worker={w} palette={palette} t={t} lang={lang} onClick={() => nav('profile', { workerId: w.id })} />
        ))}
      </div>

      {/* top rated list */}
      <div style={{ padding: `0 ${padX}px 6px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={sectionTitle(palette)}>{t.topRated}</h2>
        <button style={linkBtn(palette)}>{t.seeAll}</button>
      </div>
      <div style={{ padding: `10px ${padX}px 0`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {WORKERS.slice(0, 3).map((w) => (
          <WorkerRow key={w.id} worker={w} palette={palette} t={t} lang={lang} onClick={() => nav('profile', { workerId: w.id })} />
        ))}
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

// ─────────────────────────── CATEGORY / RESULTS ───────────────────────────
function CategoryScreen({ palette, t, lang, nav, ctx }) {
  const cat = CATEGORIES_ES.find(c => c.id === ctx?.categoryId) || CATEGORIES_ES[0];
  const [filter, setFilter] = React.useState('available');
  const filters = [
    { id: 'all', label: t.filterAll },
    { id: 'available', label: t.filterAvailable },
    { id: 'top', label: t.filterTop },
    { id: 'near', label: t.filterNear },
  ];
  const padX = 20;

  return (
    <div style={{ background: palette.bg, minHeight: '100%' }}>
      <div style={{ height: 60 }} />

      {/* header row */}
      <div style={{
        padding: `8px ${padX}px 4px`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => nav('home')} style={iconBtn(palette)}>
          <Icon name="chevron-left" size={20} stroke={palette.ink} />
        </button>
        <div style={{ flex: 1 }} />
        <button style={iconBtn(palette)}><Icon name="sliders" size={18} stroke={palette.ink} /></button>
      </div>

      {/* title */}
      <div style={{ padding: `12px ${padX}px 6px` }}>
        <div style={{ fontSize: 13, color: palette.muted, marginBottom: 4 }}>{t.categories}</div>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, system-ui',
          fontSize: 36, fontWeight: 600, letterSpacing: -1.2, lineHeight: 1.05,
          color: palette.ink, margin: 0,
        }}>{lang === 'es' ? cat.es : cat.en}</h1>
        <div style={{ marginTop: 8, color: palette.muted, fontSize: 14 }}>
          {WORKERS.length} {t.workers} · {lang === 'es' ? 'a menos de 5 km' : 'within 5 km'}
        </div>
      </div>

      {/* filter chips */}
      <div style={{
        display: 'flex', gap: 8, padding: `14px ${padX}px 12px`,
        overflowX: 'auto',
      }}>
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: filter === f.id ? palette.ink : palette.surface,
            color: filter === f.id ? palette.bg : palette.ink,
            fontSize: 13, fontWeight: 500,
            outline: filter === f.id ? 'none' : `1px solid ${palette.line}`,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{f.label}</button>
        ))}
      </div>

      {/* worker list */}
      <div style={{ padding: `4px ${padX}px 0`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {WORKERS.map((w) => (
          <WorkerCard key={w.id} worker={w} palette={palette} t={t} lang={lang} onClick={() => nav('profile', { workerId: w.id })} />
        ))}
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

// ─────────────────────────── PROFILE ───────────────────────────
function ProfileScreen({ palette, t, lang, nav, ctx }) {
  const w = WORKERS.find(x => x.id === ctx?.workerId) || WORKERS[0];
  const padX = 20;

  return (
    <div style={{ background: palette.bg, minHeight: '100%' }}>
      {/* hero photo */}
      <div style={{ position: 'relative', height: 320 }}>
        <PhotoSlot label={`Photo · ${w.name}`} hue={w.avatarHue} fill radius={0} palette={palette} />
        <div style={{ position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, ${palette.bg} 100%)` }} />
        {/* top bar */}
        <div style={{
          position: 'absolute', top: 60, left: padX, right: padX,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => nav('home')} style={iconBtn(palette, true)}>
            <Icon name="chevron-left" size={20} stroke={palette.ink} />
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={iconBtn(palette, true)}><Icon name="heart" size={18} stroke={palette.ink} /></button>
            <button style={iconBtn(palette, true)}><Icon name="message" size={18} stroke={palette.ink} /></button>
          </div>
        </div>
      </div>

      {/* identity */}
      <div style={{ padding: `0 ${padX}px`, marginTop: -36, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <Avatar initials={w.initials} hue={w.avatarHue} size={88} ring />
          <div style={{ flex: 1, paddingBottom: 6 }}>
            <Pill palette={palette} tone={w.available ? 'verified' : 'ghost'}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: w.available ? palette.verified : palette.muted,
              }} />
              {w.available ? t.available : t.busy}
            </Pill>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{
              fontFamily: 'Bricolage Grotesque, system-ui',
              fontSize: 30, fontWeight: 600, letterSpacing: -1, lineHeight: 1.1,
              color: palette.ink, margin: 0,
            }}>{w.name}</h1>
            {w.verified && <VerifiedDot palette={palette} size={20} />}
          </div>
          <div style={{ marginTop: 4, color: palette.muted, fontSize: 16 }}>
            {lang === 'es' ? w.trade.es : w.trade.en} · {w.distanceKm} km
          </div>
        </div>

        {/* metrics row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          marginTop: 20, padding: '14px 4px', gap: 0,
          background: palette.surface, borderRadius: 18, border: `1px solid ${palette.line}`,
        }}>
          <Metric value={w.rating.toFixed(2)} label={`${w.reviews} ${t.reviews}`} palette={palette} icon="star" />
          <Metric value={`${w.jobs.toLocaleString('es-MX')}`} label={t.jobs} palette={palette} divider />
          <Metric value={`${w.eta}`} label={`min ${lang === 'es' ? 'llega' : 'eta'}`} palette={palette} divider />
        </div>

        {/* trust block */}
        <h2 style={{ ...sectionTitle(palette), marginTop: 28 }}>{t.trustHeader}</h2>
        <div style={{
          marginTop: 10, background: palette.surface, borderRadius: 18,
          border: `1px solid ${palette.line}`, overflow: 'hidden',
        }}>
          <TrustRow palette={palette} icon="shield" title={t.backgroundCheck} sub={t.backgroundCheckSub} active={w.bgChecked} />
          <TrustRow palette={palette} icon="check" title={t.insured} sub={t.insuredSub} active={w.insured} />
          <TrustRow palette={palette} icon="star" title={`${w.reviews} ${t.reviews}`} sub={t.reviewsCheckedSub} active last />
        </div>

        {/* about */}
        {w.bio?.[lang] && (
          <>
            <h2 style={{ ...sectionTitle(palette), marginTop: 28 }}>{t.aboutMe}</h2>
            <p style={{
              marginTop: 8, fontSize: 15, color: palette.ink, lineHeight: 1.55,
              fontFamily: 'Manrope, system-ui',
            }}>{w.bio[lang]}</p>
          </>
        )}

        {/* services */}
        {w.services?.length > 0 && (
          <>
            <h2 style={{ ...sectionTitle(palette), marginTop: 28 }}>{t.services}</h2>
            <div style={{
              marginTop: 10, background: palette.surface, borderRadius: 18,
              border: `1px solid ${palette.line}`, overflow: 'hidden',
            }}>
              {w.services.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: i === w.services.length - 1 ? 'none' : `1px solid ${palette.line}`,
                }}>
                  <div style={{ fontSize: 15, color: palette.ink }}>{lang === 'es' ? s.es : s.en}</div>
                  <div style={{ fontSize: 14, color: palette.muted, fontVariantNumeric: 'tabular-nums' }}>
                    ${s.price} MXN
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* photos */}
        <h2 style={{ ...sectionTitle(palette), marginTop: 28 }}>{t.photos}</h2>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <PhotoSlot label="WORK 01" hue={w.avatarHue} palette={palette} radius={14} />
          <PhotoSlot label="WORK 02" hue={(w.avatarHue + 40) % 360} palette={palette} radius={14} />
          <PhotoSlot label="WORK 03" hue={(w.avatarHue + 80) % 360} palette={palette} radius={14} />
        </div>

        <div style={{ height: 140 }} />
      </div>

      {/* sticky CTA */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 22, zIndex: 5,
        display: 'flex', gap: 10, padding: 8,
        background: `${palette.surface}E6`, backdropFilter: 'blur(20px)',
        borderRadius: 24, border: `1px solid ${palette.line}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
      }}>
        <button style={{
          padding: '14px 18px', borderRadius: 18, border: `1px solid ${palette.line}`,
          background: 'transparent', color: palette.ink, fontWeight: 500, fontSize: 15,
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <Icon name="phone" size={18} stroke={palette.ink} />
          {t.callBtn}
        </button>
        <button style={{
          padding: '14px 18px', borderRadius: 18, border: `1px solid ${palette.line}`,
          background: 'transparent', color: palette.ink, fontWeight: 500, fontSize: 15,
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <Icon name="chat" size={18} stroke={palette.ink} />
          {t.chatBtn}
        </button>
        <button onClick={() => nav('book', { workerId: w.id })} style={{
          flex: 1, padding: '14px 18px', borderRadius: 18, border: 'none',
          background: palette.primary, color: palette.primaryInk,
          fontWeight: 600, fontSize: 15, cursor: 'pointer',
          fontFamily: 'Bricolage Grotesque, system-ui', letterSpacing: -0.2,
        }}>
          {t.bookNow} · ${w.priceFrom}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── BOOK ───────────────────────────
function BookScreen({ palette, t, lang, nav, ctx }) {
  const w = WORKERS.find(x => x.id === ctx?.workerId) || WORKERS[0];
  const [day, setDay] = React.useState('today');
  const [slot, setSlot] = React.useState('14:00');
  const [desc, setDesc] = React.useState(lang === 'es'
    ? 'Hay una fuga debajo del lavabo del baño principal. Empezó ayer.'
    : 'There is a leak under the main bathroom sink. Started yesterday.'
  );
  const padX = 20;
  const slots = ['10:00', '11:30', '14:00', '16:00', '18:30'];

  return (
    <div style={{ background: palette.bg, minHeight: '100%' }}>
      <div style={{ height: 60 }} />

      <div style={{ padding: `8px ${padX}px 0`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => nav('profile', { workerId: w.id })} style={iconBtn(palette)}>
          <Icon name="chevron-left" size={20} stroke={palette.ink} />
        </button>
        <div style={{ fontSize: 13, color: palette.muted }}>{w.name}</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: `20px ${padX}px 8px` }}>
        <h1 style={{
          fontFamily: 'Bricolage Grotesque, system-ui',
          fontSize: 34, fontWeight: 600, letterSpacing: -1.2, lineHeight: 1.05,
          color: palette.ink, margin: 0,
        }}>{t.bookTitle}</h1>
      </div>

      {/* worker mini-card */}
      <div style={{ padding: `14px ${padX}px 0` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px', background: palette.surface, borderRadius: 16,
          border: `1px solid ${palette.line}`,
        }}>
          <Avatar initials={w.initials} hue={w.avatarHue} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontWeight: 600, color: palette.ink, fontSize: 15 }}>{w.name}</div>
              {w.verified && <VerifiedDot palette={palette} size={14} />}
            </div>
            <div style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
              {lang === 'es' ? w.trade.es : w.trade.en} · ★ {w.rating}
            </div>
          </div>
          <div style={{ fontSize: 14, color: palette.muted, fontVariantNumeric: 'tabular-nums' }}>
            ${w.priceFrom} {t.pricing === 'desde' || t.pricing === 'from' ? '' : ''}
          </div>
        </div>
      </div>

      {/* when */}
      <h2 style={{ ...sectionTitle(palette), padding: `28px ${padX}px 0`, margin: 0 }}>{t.when}</h2>
      <div style={{ display: 'flex', gap: 8, padding: `12px ${padX}px 0` }}>
        {[
          { id: 'today', label: t.today, sub: lang === 'es' ? 'jue 8 may' : 'Thu May 8' },
          { id: 'tomorrow', label: t.tomorrow, sub: lang === 'es' ? 'vie 9 may' : 'Fri May 9' },
          { id: 'pick', label: t.pickDate, sub: lang === 'es' ? 'elegir' : 'choose' },
        ].map((d) => (
          <button key={d.id} onClick={() => setDay(d.id)} style={{
            flex: 1, padding: '14px 8px', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: day === d.id ? palette.ink : palette.surface,
            color: day === d.id ? palette.bg : palette.ink,
            outline: day === d.id ? 'none' : `1px solid ${palette.line}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            minWidth: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{d.label}</span>
            <span style={{ fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap' }}>{d.sub}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: `12px ${padX}px 0` }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {slots.map((s) => (
            <button key={s} onClick={() => setSlot(s)} style={{
              padding: '10px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: slot === s ? palette.primary : palette.surface,
              color: slot === s ? palette.primaryInk : palette.ink,
              outline: slot === s ? 'none' : `1px solid ${palette.line}`,
              fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* address */}
      <h2 style={{ ...sectionTitle(palette), padding: `28px ${padX}px 0`, margin: 0 }}>{t.addressLabelShort}</h2>
      <div style={{ padding: `10px ${padX}px 0` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: palette.surface, borderRadius: 16,
          border: `1px solid ${palette.line}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${palette.primary}18`, color: palette.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="pin" size={18} stroke={palette.primary} />
          </div>
          <div style={{ flex: 1, fontSize: 14, color: palette.ink }}>{t.addressValue}</div>
          <Icon name="chevron" size={16} stroke={palette.muted} />
        </div>
      </div>

      {/* description */}
      <h2 style={{ ...sectionTitle(palette), padding: `28px ${padX}px 0`, margin: 0 }}>{t.description}</h2>
      <div style={{ padding: `10px ${padX}px 0` }}>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t.descriptionHint}
          style={{
            width: '100%', resize: 'none', minHeight: 96,
            padding: '14px 16px', borderRadius: 16,
            background: palette.surface, border: `1px solid ${palette.line}`,
            color: palette.ink, fontSize: 14, lineHeight: 1.45,
            fontFamily: 'Manrope, system-ui', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* total */}
      <div style={{ padding: `28px ${padX}px 0` }}>
        <div style={{
          padding: '16px', background: palette.surface, borderRadius: 18,
          border: `1px solid ${palette.line}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: palette.muted, fontSize: 14 }}>{lang === 'es' ? 'Visita' : 'Visit'}</span>
            <span style={{ color: palette.ink, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>$280 MXN</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: palette.muted, fontSize: 14 }}>{lang === 'es' ? 'Materiales (estimado)' : 'Materials (est.)'}</span>
            <span style={{ color: palette.ink, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>$120 MXN</span>
          </div>
          <div style={{ height: 1, background: palette.line, margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: palette.ink, fontSize: 15, fontWeight: 600 }}>{t.estTotal}</span>
            <span style={{
              color: palette.ink, fontFamily: 'Bricolage Grotesque, system-ui',
              fontSize: 22, fontWeight: 600, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums',
            }}>$400 MXN</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: palette.muted }}>{t.payAfter}</div>
        </div>
      </div>

      <div style={{ height: 140 }} />

      {/* sticky confirm */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 22, zIndex: 5,
        padding: 8, background: `${palette.surface}E6`, backdropFilter: 'blur(20px)',
        borderRadius: 24, border: `1px solid ${palette.line}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
      }}>
        <button onClick={() => nav('confirmed', { workerId: w.id })} style={{
          width: '100%', padding: '16px 18px', borderRadius: 18, border: 'none',
          background: palette.primary, color: palette.primaryInk,
          fontWeight: 600, fontSize: 16, cursor: 'pointer',
          fontFamily: 'Bricolage Grotesque, system-ui', letterSpacing: -0.2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {t.confirm}
          <Icon name="chevron" size={18} stroke="currentColor" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── CONFIRMED ───────────────────────────
function ConfirmedScreen({ palette, t, lang, nav, ctx }) {
  const w = WORKERS.find(x => x.id === ctx?.workerId) || WORKERS[0];
  const padX = 20;

  return (
    <div style={{ background: palette.bg, minHeight: '100%' }}>
      <div style={{ height: 60 }} />

      <div style={{ padding: `8px ${padX}px 0`, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => nav('home')} style={iconBtn(palette)}>
          <span style={{ fontSize: 18, color: palette.muted, fontWeight: 300, lineHeight: 1, marginTop: -2 }}>×</span>
        </button>
      </div>

      <div style={{ padding: `40px ${padX}px 28px`, textAlign: 'center' }}>
        {/* big checkmark */}
        <div style={{
          width: 84, height: 84, margin: '0 auto 24px',
          borderRadius: '50%', background: palette.verified, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 12px ${palette.verified}1A`,
        }}>
          <Icon name="check" size={40} stroke="#fff" strokeWidth={2.5} />
        </div>
        <h1 style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: 38, fontWeight: 400, letterSpacing: -0.8, lineHeight: 1.05,
          color: palette.ink, margin: 0,
        }}>{t.confirmedTitle}</h1>
        <div style={{ marginTop: 8, color: palette.muted, fontSize: 16 }}>{t.confirmedSub}</div>
      </div>

      {/* eta block */}
      <div style={{ padding: `4px ${padX}px 0` }}>
        <div style={{
          padding: '20px', borderRadius: 22, background: palette.surface,
          border: `1px solid ${palette.line}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar initials={w.initials} hue={w.avatarHue} size={56} ring />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontWeight: 600, color: palette.ink, fontSize: 16 }}>{w.name}</div>
                <VerifiedDot palette={palette} size={14} />
              </div>
              <div style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
                {lang === 'es' ? w.trade.es : w.trade.en}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={miniIcon(palette)}><Icon name="phone" size={18} stroke={palette.ink} /></button>
              <button style={miniIcon(palette)}><Icon name="chat" size={18} stroke={palette.ink} /></button>
            </div>
          </div>

          <div style={{ height: 1, background: palette.line, margin: '16px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: palette.muted }}>{t.eta}</div>
              <div style={{
                fontFamily: 'Bricolage Grotesque, system-ui',
                fontSize: 36, fontWeight: 600, letterSpacing: -1.2,
                color: palette.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>{w.eta} <span style={{ fontSize: 18, color: palette.muted, fontWeight: 400 }}>{t.minutes}</span></div>
            </div>
            <div style={{
              padding: '10px 16px', borderRadius: 14,
              background: `${palette.verified}18`, color: palette.verified,
              fontSize: 12, fontWeight: 600,
            }}>
              {lang === 'es' ? 'EN CAMINO' : 'ON THE WAY'}
            </div>
          </div>
        </div>
      </div>

      {/* mini map placeholder */}
      <div style={{ padding: `14px ${padX}px 0` }}>
        <div style={{
          height: 160, borderRadius: 22, position: 'relative', overflow: 'hidden',
          background: `repeating-linear-gradient(0deg, ${palette.line} 0 1px, transparent 1px 24px),
                       repeating-linear-gradient(90deg, ${palette.line} 0 1px, transparent 1px 24px),
                       ${palette.surface}`,
          border: `1px solid ${palette.line}`,
        }}>
          {/* route line */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <path d="M30 130 Q 130 80, 200 90 T 340 50" stroke={palette.primary} strokeWidth="3" fill="none" strokeDasharray="2 8" strokeLinecap="round" />
          </svg>
          {/* worker dot */}
          <div style={{ position: 'absolute', left: 24, top: 124,
            width: 14, height: 14, borderRadius: '50%', background: palette.primary,
            boxShadow: `0 0 0 4px ${palette.primary}33` }} />
          {/* destination */}
          <div style={{ position: 'absolute', right: 24, top: 38, color: palette.ink }}>
            <Icon name="pin" size={22} stroke={palette.ink} fill={palette.bg} />
          </div>
        </div>
      </div>

      {/* booking summary */}
      <div style={{ padding: `14px ${padX}px 0` }}>
        <div style={{
          background: palette.surface, borderRadius: 18, border: `1px solid ${palette.line}`,
          overflow: 'hidden',
        }}>
          <SummaryRow label={t.serviceLabel} value={lang === 'es' ? 'Reparación de fuga' : 'Leak repair'} palette={palette} />
          <SummaryRow label={lang === 'es' ? 'Cuándo' : 'When'} value={lang === 'es' ? 'Hoy · 14:00' : 'Today · 2:00 PM'} palette={palette} />
          <SummaryRow label={t.addressLabelShort} value={t.addressValue} palette={palette} />
          <SummaryRow label={t.paymentLabel} value={t.paymentValue} palette={palette} last />
        </div>
      </div>

      <div style={{ padding: `20px ${padX}px 0` }}>
        <button onClick={() => nav('home')} style={{
          width: '100%', padding: '14px 18px', borderRadius: 18,
          background: 'transparent', color: palette.muted, fontSize: 14,
          border: `1px solid ${palette.line}`, cursor: 'pointer',
        }}>
          {lang === 'es' ? 'Volver al inicio' : 'Back to home'}
        </button>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}

// ─────────────────────────── SHARED PIECES ───────────────────────────
function NearbyCard({ worker: w, palette, t, lang, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 168, flexShrink: 0, scrollSnapAlign: 'start',
      background: palette.surface, borderRadius: 18,
      border: `1px solid ${palette.line}`, overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ position: 'relative' }}>
        <PhotoSlot label={`PHOTO · ${w.initials}`} hue={w.avatarHue} ratio="4 / 3" radius={0} palette={palette} />
        {w.available && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 8px', borderRadius: 999,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
            fontSize: 11, fontWeight: 600, color: palette.verified,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.verified }} />
            {t.available}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: palette.ink, letterSpacing: -0.2 }}>{w.name.split(' ')[0]}</div>
          {w.verified && <VerifiedDot palette={palette} size={12} />}
        </div>
        <div style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>
          {lang === 'es' ? w.trade.es : w.trade.en}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: palette.ink, fontSize: 12, fontWeight: 600 }}>
            <Icon name="star" size={12} stroke={palette.primary} />
            {w.rating}
          </div>
          <div style={{ fontSize: 11, color: palette.muted }}>{w.distanceKm} km</div>
        </div>
      </div>
    </div>
  );
}

function WorkerRow({ worker: w, palette, t, lang, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px', background: palette.surface, borderRadius: 16,
      border: `1px solid ${palette.line}`, cursor: 'pointer',
    }}>
      <Avatar initials={w.initials} hue={w.avatarHue} size={52} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontWeight: 600, color: palette.ink, fontSize: 15 }}>{w.name}</div>
          {w.verified && <VerifiedDot palette={palette} size={13} />}
        </div>
        <div style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
          {lang === 'es' ? w.trade.es : w.trade.en} · {w.distanceKm} km
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: palette.ink, fontWeight: 600, fontSize: 14 }}>
          <Icon name="star" size={13} stroke={palette.primary} />
          {w.rating}
        </div>
        <div style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>
          {w.reviews} {t.reviews}
        </div>
      </div>
    </div>
  );
}

function WorkerCard({ worker: w, palette, t, lang, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 14, padding: '14px',
      background: palette.surface, borderRadius: 20,
      border: `1px solid ${palette.line}`, cursor: 'pointer',
    }}>
      <div style={{ width: 76, flexShrink: 0 }}>
        <PhotoSlot label={w.initials} hue={w.avatarHue} ratio="1 / 1" radius={14} palette={palette} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, color: palette.ink, fontSize: 16, letterSpacing: -0.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            minWidth: 0, flex: '0 1 auto',
          }}>{w.name}</div>
          {w.verified && <VerifiedDot palette={palette} size={14} />}
        </div>
        <div style={{ fontSize: 13, color: palette.muted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {lang === 'es' ? w.trade.es : w.trade.en} · {w.distanceKm} km · {w.eta} min
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <Pill palette={palette} tone="verified" style={{ padding: '4px 10px', fontSize: 11 }}>
            <Icon name="star" size={11} stroke={palette.verified} />
            {w.rating} · {w.reviews}
          </Pill>
          {w.bgChecked && (
            <Pill palette={palette} tone="ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
              <Icon name="shield" size={11} stroke={palette.muted} />
              {t.background}
            </Pill>
          )}
          {w.available && (
            <Pill palette={palette} tone="ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: palette.verified }} />
              {t.available}
            </Pill>
          )}
        </div>
      </div>
      <div style={{ alignSelf: 'flex-end', textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600,
          fontSize: 18, color: palette.ink, letterSpacing: -0.4,
          fontVariantNumeric: 'tabular-nums',
        }}>${w.priceFrom}</div>
        <div style={{ fontSize: 11, color: palette.muted }}>
          {w.priceUnit === 'hour' ? t.perHour : w.priceUnit === 'job' ? '/job' : t.perJob}
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label, palette, icon, divider }) {
  return (
    <div style={{
      flex: 1, padding: '4px 12px', textAlign: 'center',
      borderLeft: divider ? `1px solid ${palette.line}` : 'none',
    }}>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600,
        fontSize: 22, color: palette.ink, letterSpacing: -0.6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {icon === 'star' && <Icon name="star" size={16} stroke={palette.primary} />}
        {value}
      </div>
      <div style={{ fontSize: 11, color: palette.muted, marginTop: 4, letterSpacing: 0.1 }}>{label}</div>
    </div>
  );
}

function TrustRow({ palette, icon, title, sub, active, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${palette.line}`,
      opacity: active ? 1 : 0.4,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: active ? `${palette.verified}18` : `${palette.muted}14`,
        color: active ? palette.verified : palette.muted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} stroke="currentColor" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: palette.ink, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>{sub}</div>
      </div>
      {active && <VerifiedDot palette={palette} size={16} />}
    </div>
  );
}

function SummaryRow({ label, value, palette, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${palette.line}`,
      gap: 12,
    }}>
      <span style={{ fontSize: 13, color: palette.muted }}>{label}</span>
      <span style={{ fontSize: 13, color: palette.ink, fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// shared style helpers
function iconBtn(palette, glass = false) {
  return {
    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: glass ? 'rgba(255,255,255,0.85)' : palette.surface,
    backdropFilter: glass ? 'blur(20px) saturate(180%)' : undefined,
    boxShadow: glass ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
    border_: `1px solid ${palette.line}`,
    outline: glass ? 'none' : `1px solid ${palette.line}`, outlineOffset: -1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };
}
function miniIcon(palette) {
  return {
    width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: palette.bg,
    outline: `1px solid ${palette.line}`, outlineOffset: -1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}
function sectionTitle(palette) {
  return {
    fontFamily: 'Bricolage Grotesque, system-ui',
    fontSize: 18, fontWeight: 600, letterSpacing: -0.4,
    color: palette.ink, margin: 0,
  };
}
function linkBtn(palette) {
  return {
    padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
    color: palette.muted, fontSize: 13, fontWeight: 500,
  };
}

Object.assign(window, { HomeScreen, CategoryScreen, ProfileScreen, BookScreen, ConfirmedScreen });
