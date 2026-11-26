(() => {
  const DATA = window.PORTFOLIO_DATA;
  const dict = DATA.translations;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const placeholder = value => typeof value === 'string' && /^\[.*\]$/.test(value.trim());
  const safeUrl = value => /^https?:\/\/\S+$/i.test(value || '') && !/REPLACE_ME|example\.com/i.test(value);
  let language = 'uz';
  try {
    const saved = localStorage.getItem('portfolio-language');
    const browser = (navigator.language || 'uz').slice(0, 2).toLowerCase();
    language = saved && dict[saved] ? saved : (dict[browser] ? browser : 'uz');
  } catch (_) {}
  const themeButton = $('#theme-toggle');
  const themeName = () => document.documentElement.dataset.theme || 'dark';
  function setTheme(theme, save = true) {
    document.documentElement.dataset.theme = theme;
    if (save) try { localStorage.setItem('portfolio-theme', theme); } catch (_) {}
    themeButton.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    $('.theme-icon', themeButton).textContent = theme === 'dark' ? '☼' : '☾';
  }
  setTheme(themeName(), false);
  themeButton.addEventListener('click', () => setTheme(themeName() === 'dark' ? 'light' : 'dark'));

  function t(key) { return dict[language][key] ?? dict.uz[key] ?? key; }
  function isValidEmail(value) { return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !placeholder(value); }
  function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t('title');
    $('meta[name="description"]').content = t('description');
    $('meta[property="og:title"]').content = t('title');
    $('meta[property="og:description"]').content = t('description');
    $('meta[name="twitter:title"]').content = t('title');
    $('meta[name="twitter:description"]').content = t('description');
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
    $$('[data-content="name"]').forEach(el => el.textContent = DATA.profile.name);
    $$('[data-content="nameShort"]').forEach(el => el.textContent = DATA.profile.shortName);
    $('[data-content="name"]')?.classList.toggle('sample-content', placeholder(DATA.profile.name));
    $('#location').textContent = DATA.profile.location[language];
    $('#avatar').src = DATA.profile.avatar;
    renderRoles(); renderSkills(); renderProjects(); renderTimeline(); renderCertificates(); renderStats(); renderSocials();
    const emailLink = $('#contact-email');
    emailLink.textContent = isValidEmail(DATA.profile.email) ? `${DATA.profile.email} ↗` : DATA.profile.email;
    if (isValidEmail(DATA.profile.email)) emailLink.href = `mailto:${DATA.profile.email}`;
    else emailLink.removeAttribute('href');
    emailLink.classList.toggle('sample-content', !isValidEmail(DATA.profile.email));
    const cvLink = $('[data-cv-link]');
    if (DATA.profile.cv && !placeholder(DATA.profile.cv)) { cvLink.href = DATA.profile.cv; cvLink.hidden = false; }
    else cvLink.hidden = true;
    const jsonld = JSON.parse($('#person-jsonld').textContent);
    jsonld.name = DATA.profile.name; jsonld.jobTitle = DATA.profile.roles[language][0];
    $('#person-jsonld').textContent = JSON.stringify(jsonld);
  }

  let roleTimer;
  function renderRoles() {
    clearInterval(roleTimer);
    const target = $('#role-rotator'); const roles = DATA.profile.roles[language]; let index = 0;
    target.textContent = roles[0];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    roleTimer = setInterval(() => {
      target.classList.add('role-out');
      setTimeout(() => { index = (index + 1) % roles.length; target.textContent = roles[index]; target.classList.remove('role-out'); }, 220);
    }, 2800);
  }
  function renderSkills() {
    const root = $('#skill-groups'); root.replaceChildren();
    DATA.skills.forEach(group => {
      const section = document.createElement('section'); section.className = 'skill-group reveal';
      const h = document.createElement('h3'); h.textContent = t(group.key);
      const list = document.createElement('div'); list.className = 'skill-list';
      group.items.forEach(name => { const badge = document.createElement('span'); badge.className = 'skill-badge'; badge.textContent = name; list.append(badge); });
      section.append(h, list); root.append(section);
    }); observeReveals();
  }
  const categories = [['all','filterAll'],['web','filterWeb'],['mobile','filterMobile'],['design','filterDesign']];
  let activeFilter = 'all';
  function renderProjects() {
    const filters = $('#project-filters'); filters.replaceChildren();
    categories.forEach(([key, label]) => { const button = document.createElement('button'); button.className = 'filter-btn'; button.type = 'button'; button.textContent = t(label); button.dataset.filter = key; button.setAttribute('aria-pressed', String(key === activeFilter)); button.addEventListener('click', () => { activeFilter = key; renderProjects(); }); filters.append(button); });
    const root = $('#project-grid'); root.replaceChildren();
    DATA.projects.forEach((project, index) => {
      const card = document.createElement('article'); card.className = 'project-card reveal'; card.dataset.category = project.category;
      card.hidden = activeFilter !== 'all' && project.category !== activeFilter;
      const visual = document.createElement('div'); visual.className = 'project-image'; visual.setAttribute('aria-hidden','true');
      const number = document.createElement('span'); number.className = 'project-number'; number.textContent = `PROJECT / 0${index + 1}`;
      const gem = document.createElement('span'); gem.className = 'project-gem'; visual.append(number, gem);
      const info = document.createElement('div'); info.className = 'project-info';
      const titleRow = document.createElement('div'); titleRow.className = 'project-title-row';
      const title = document.createElement('h3'); title.textContent = project.title[language];
      if (project.sample) { const mark = document.createElement('span'); mark.className = 'sample-mark'; mark.textContent = 'SAMPLE'; titleRow.append(title, mark); } else titleRow.append(title);
      const summary = document.createElement('p'); summary.className = 'project-summary'; summary.textContent = project.desc[language];
      const tags = document.createElement('div'); tags.className = 'tag-row'; project.tech.forEach(item => { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = item; tags.append(tag); });
      const actions = document.createElement('div'); actions.className = 'project-actions';
      [[project.live,'live'],[project.code,'code']].forEach(([url,label]) => { if (!safeUrl(url)) return; const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = t(label); actions.append(a); });
      const details = document.createElement('button'); details.className = 'details-button'; details.textContent = t('details'); details.addEventListener('click', () => showProject(project)); actions.append(details);
      info.append(titleRow, summary, tags, actions); card.append(visual, info); root.append(card);
    });
    if (!DATA.projects.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = t('noProjects'); root.append(empty); }
    observeReveals(); bindTilt();
  }
  function showProject(project) {
    const root = $('#dialog-content'); root.replaceChildren();
    const visual = document.createElement('div'); visual.className = 'dialog-visual';
    const title = document.createElement('h2'); title.textContent = project.title[language];
    const description = document.createElement('p'); description.textContent = project.details[language];
    root.append(visual, title, description);
    const dialog = $('#project-dialog'); if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    $('#dialog-close').focus();
  }
  $('#dialog-close').addEventListener('click', () => $('#project-dialog').close());
  $('#project-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  function renderTimeline() {
    const root = $('#timeline'); root.replaceChildren();
    DATA.timeline.forEach(item => {
      const row = document.createElement('article'); row.className = 'timeline-item reveal';
      const date = document.createElement('span'); date.className = 'timeline-date'; date.textContent = item.date[language];
      const content = document.createElement('div'); const title = document.createElement('h3'); title.textContent = item.title[language];
      const org = document.createElement('p'); org.className = 'timeline-org'; org.textContent = item.org[language];
      const desc = document.createElement('p'); desc.className = 'timeline-description'; desc.textContent = item.description[language];
      content.append(title, org, desc); row.append(date, content); root.append(row);
    }); observeReveals();
  }
  function renderCertificates() {
    const root = $('#certificates'); root.replaceChildren();
    if (!DATA.certificates.length) return;
    const heading = document.createElement('p'); heading.className = 'eyebrow'; heading.textContent = t('certificateLabel'); root.append(heading);
    DATA.certificates.forEach(item => { const el = document.createElement('span'); el.className = 'certificate'; el.textContent = item[language]; root.append(el); });
  }
  function renderStats() {
    const labels = language === 'ru' ? ['Проекты','Лет опыта','Клиенты'] : language === 'en' ? ['Projects','Years experience','Clients'] : ['Loyiha','Yil tajriba','Mijoz'];
    const vals = [DATA.stats?.projects ?? DATA.profile.stats.projects, DATA.profile.stats.years, DATA.profile.stats.clients];
    const root = $('#stats'); root.replaceChildren(); vals.forEach((num,i) => { const box = document.createElement('div'); box.className = 'stat'; const strong = document.createElement('strong'); strong.dataset.count = num; strong.textContent = '0'; const label = document.createElement('span'); label.textContent = labels[i]; box.append(strong,label); root.append(box); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => { if (!e.isIntersecting) return; const el=e.target,end=Number(el.dataset.count)||0,start=performance.now(),duration=800; const tick=now=>{const p=Math.min(1,(now-start)/duration);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);io.unobserve(el)}),{threshold:.8});
      $$('.stat strong',root).forEach(el=>io.observe(el));
    } else $$('.stat strong',root).forEach(el=>el.textContent=el.dataset.count);
  }
  function renderSocials() {
    ['#hero-socials','#contact-socials'].forEach(selector => { const root=$(selector); root.replaceChildren(); Object.entries(DATA.profile.socials).forEach(([label,url])=>{if(!safeUrl(url))return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;root.append(a)}); });
  }
  function observeReveals() {
    const items=$$('.reveal:not(.observed)');
    if (!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(el=>el.classList.add('in-view'));return}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.12});
    items.forEach((el,index)=>{el.classList.add('observed');el.style.transitionDelay=`${Math.min(index%4*75,225)}ms`;observer.observe(el)});
  }
  function bindTilt() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    $$('.project-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.transform=`perspective(950px) rotateX(${(0.5-y)*4}deg) rotateY(${(x-.5)*5}deg)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
  }

  $$('.languages [data-lang], [data-lang]').forEach(button => button.addEventListener('click', () => { language=button.dataset.lang; try{localStorage.setItem('portfolio-language',language)}catch(_){} applyLanguage(); }));
  applyLanguage();

  const menu=$('#menu-toggle'),nav=$('#nav-links');
  function closeMenu(returnFocus=false){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');if(returnFocus)menu.focus()}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);if(open)nav.querySelector('a').focus()});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))closeMenu(true)});
  document.addEventListener('pointerdown',e=>{if(nav.classList.contains('open')&&!e.target.closest('.nav'))closeMenu()});
  window.addEventListener('resize',()=>{if(innerWidth>767)closeMenu()});

  const emailButton=$('#copy-email');emailButton.addEventListener('click',async()=>{if(!isValidEmail(DATA.profile.email))return;try{await navigator.clipboard.writeText(DATA.profile.email);emailButton.textContent=t('copied');setTimeout(()=>emailButton.textContent=t('copyEmail'),1600)}catch(_){$('#contact-email').focus()}});
  const form=$('#contact-form');form.addEventListener('submit',async e=>{e.preventDefault();const status=$('#form-status');if(!form.reportValidity()){status.textContent=t('formInvalid');return}const endpoint=form.getAttribute('action');if(endpoint.includes('REPLACE_ME')){status.textContent=t('formSetup');return}const submit=form.querySelector('[type="submit"]');submit.disabled=true;try{const response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});if(!response.ok)throw new Error('form submission failed');status.textContent=t('formSuccess');form.reset()}catch(_){status.textContent=t('formError')}finally{submit.disabled=false}});

  const header=$('.site-header'),floatTop=$('#floating-top'),progress=$('#progress');let scrollBusy=false;
  const updateScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;header.classList.toggle('scrolled',scrollY>20);floatTop.classList.toggle('show',scrollY>600);const timeline=$('#timeline'),rect=timeline.getBoundingClientRect(),amount=Math.max(0,Math.min(1,(innerHeight*.76-rect.top)/(rect.height+innerHeight*.35)));timeline.style.setProperty('--timeline-progress',`${amount*100}%`);scrollBusy=false};
  window.addEventListener('scroll',()=>{if(!scrollBusy){scrollBusy=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();floatTop.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
  const sections=$$('main section[id]');if('IntersectionObserver'in window){const spy=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`))}}),{rootMargin:'-35% 0px -55% 0px'});sections.forEach(section=>spy.observe(section))}
  if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const glow=$('#cursor-glow');let x=0,y=0,cx=0,cy=0;window.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;glow.classList.add('visible')},{passive:true});const move=()=>{cx+=(x-cx)*.16;cy+=(y-cy)*.16;glow.style.left=`${cx}px`;glow.style.top=`${cy}px`;requestAnimationFrame(move)};requestAnimationFrame(move)}
  observeReveals();$('#year').textContent=new Date().getFullYear();window.addEventListener('load',()=>setTimeout(()=>$('#preloader').classList.add('done'),220));setTimeout(()=>$('#preloader').classList.add('done'),1800);
})();

