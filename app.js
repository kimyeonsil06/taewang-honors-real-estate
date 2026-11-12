const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.primary-nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
    document.body.classList.toggle('nav-open', !open);
    navToggle.querySelector('.sr-only').textContent = open ? '메뉴 열기' : '메뉴 닫기';
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

const officeMain = document.querySelector('.office-main img');
const officeThumbs = document.querySelectorAll('.office-thumb');
officeThumbs.forEach((thumb) => {
  thumb.addEventListener('click', () => {
    if (!officeMain) return;
    officeMain.src = thumb.dataset.image;
    officeMain.alt = thumb.dataset.alt;
    officeThumbs.forEach((item) => item.classList.remove('active'));
    thumb.classList.add('active');
  });
});

const form = document.querySelector('#consultation-form');
const formStatus = document.querySelector('#form-status');

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

if (form && formStatus) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const summary = [
      '[태왕아너스부동산 상담 요청]',
      `성함: ${values.get('name')}`,
      `연락처: ${values.get('phone')}`,
      `거래 유형: ${values.get('transaction')}`,
      `관심 매물: ${values.get('property')}`,
      `희망 조건: ${values.get('message') || '별도 상담'}`
    ].join('\n');

    try {
      await copyText(summary);
      formStatus.textContent = '상담 내용이 복사되었습니다. 문자나 스마트플레이스 문의에 붙여 넣어 주세요.';
    } catch {
      formStatus.textContent = '복사하지 못했습니다. 입력 내용을 직접 선택해 복사해 주세요.';
    }
  });
}
