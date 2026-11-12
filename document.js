const params = new URLSearchParams(location.search);
const docKey = params.get('doc') || 'faq';
const documents = {
  faq: { path: 'data/faq.md', title: '고객 자주 묻는 질문 100개', searchable: true },
  'service-policy': { path: 'data/service-policy.md', title: '서비스·계약·정산 정책', searchable: false },
  'company-profile': { path: 'data/company-profile.md', title: '회사 소개서', searchable: false }
};
const selected = documents[docKey] || documents.faq;
const content = document.querySelector('#markdown-content');
const search = document.querySelector('#document-search');
document.title = `${selected.title} | 태왕아너스부동산`;

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderInline(value) {
  let safe = escapeHtml(value);
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  return safe;
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function renderFaq(markdown) {
  const clean = stripFrontmatter(markdown);
  const intro = clean.split(/^##\s/m)[0];
  const title = (intro.match(/^#\s+(.+)$/m) || [,'고객 자주 묻는 질문 100개'])[1];
  const introParagraph = intro.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#'))[0] || '';
  const entries = [...clean.matchAll(/^###\s+(\d+)\.\s+(.+)\r?\n\r?\n([\s\S]*?)(?=^###\s+\d+\.|^##\s+|\z)/gm)];
  const cards = entries.map((match) => {
    const number = match[1];
    const question = match[2].trim();
    const answer = match[3].trim().replace(/\r?\n+/g, ' ');
    const query = `${question} ${answer}`.toLowerCase();
    return `<details class="faq-doc-entry" data-search="${escapeHtml(query)}"><summary><span>${number}</span>${renderInline(question)}</summary><p>${renderInline(answer)}</p></details>`;
  }).join('');
  return `<h1>${renderInline(title)}</h1><p>${renderInline(introParagraph)}</p><div class="faq-document-list">${cards}</div><p id="faq-empty" class="loading faq-result-hidden">검색 결과가 없습니다.</p>`;
}

function renderMarkdown(markdown) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  let html = '';
  let paragraph = [];
  let listOpen = false;
  let tableOpen = false;
  let tableHeader = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${renderInline(paragraph.join(' '))}</p>`;
      paragraph = [];
    }
  };
  const closeList = () => { if (listOpen) { html += '</ul>'; listOpen = false; } };
  const closeTable = () => { if (tableOpen) { html += '</tbody></table>'; tableOpen = false; tableHeader = false; } };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) { flushParagraph(); closeList(); closeTable(); continue; }
    if (/^\|?\s*:?-{3,}/.test(line) && line.includes('|')) continue;
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph(); closeList();
      const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
      if (!tableOpen) { html += '<table><thead><tr>' + cells.map((cell) => `<th>${renderInline(cell)}</th>`).join('') + '</tr></thead><tbody>'; tableOpen = true; tableHeader = true; }
      else { html += '<tr>' + cells.map((cell) => `<td>${renderInline(cell)}</td>`).join('') + '</tr>'; }
      continue;
    }
    closeTable();
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length; html += `<h${level}>${renderInline(heading[2])}</h${level}>`; continue; }
    if (line.startsWith('- ')) { flushParagraph(); if (!listOpen) { html += '<ul>'; listOpen = true; } html += `<li>${renderInline(line.slice(2))}</li>`; continue; }
    if (/^\d+\.\s/.test(line)) { flushParagraph(); closeList(); html += `<p>${renderInline(line)}</p>`; continue; }
    if (line.startsWith('> ')) { flushParagraph(); closeList(); html += `<blockquote>${renderInline(line.slice(2))}</blockquote>`; continue; }
    paragraph.push(line);
  }
  flushParagraph(); closeList(); closeTable();
  return html;
}

function activateSearch() {
  if (!selected.searchable) {
    search.hidden = true;
    return;
  }
  const entries = [...document.querySelectorAll('.faq-doc-entry')];
  const empty = document.querySelector('#faq-empty');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    entries.forEach((entry) => {
      const match = !query || entry.dataset.search.includes(query);
      entry.classList.toggle('faq-result-hidden', !match);
      if (match) shown += 1;
    });
    empty?.classList.toggle('faq-result-hidden', shown !== 0);
  });
}

fetch(selected.path)
  .then((response) => {
    if (!response.ok) throw new Error('문서를 불러오지 못했습니다.');
    return response.text();
  })
  .then((markdown) => {
    content.innerHTML = selected.searchable ? renderFaq(markdown) : renderMarkdown(markdown);
    activateSearch();
  })
  .catch((error) => {
    content.innerHTML = `<h1>문서를 표시할 수 없습니다.</h1><p>${escapeHtml(error.message)}</p>`;
    search.hidden = true;
  });
