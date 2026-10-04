// A tiny JavaScript highlighter for the site: comments, strings, numbers,
// keywords, classes and calls. Returns HTML.
const KEYWORDS = new Set(
  'const let var for of in if else return new function true false null undefined while break continue typeof import from export class extends async await'.split(
    ' '
  )
);

const TOKEN =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(=>|[^\w\s])|(\s+)/g;

const escape = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

export const highlight = (code) => {
  let html = '';
  TOKEN.lastIndex = 0;

  for (let match = TOKEN.exec(code); match; match = TOKEN.exec(code)) {
    const [text, comment, string, number, word, punct] = match;
    const span = (kind) => `<span class="t-${kind}">${escape(text)}</span>`;

    if (comment) html += span('comment');
    else if (string) html += span('string');
    else if (number) html += span('number');
    else if (word) {
      if (KEYWORDS.has(word)) html += span('keyword');
      else if (/^[A-Z]/.test(word)) html += span('type');
      else if (code[TOKEN.lastIndex] === '(') html += span('call');
      else html += escape(text);
    } else if (punct) html += span('punct');
    else html += escape(text);
  }

  return html;
};

/** Highlights every <code data-lang="js"> on the page. */
export const highlightAll = (root = document) =>
  root.querySelectorAll('code[data-lang="js"]').forEach((code) => {
    code.innerHTML = highlight(code.textContent);
  });
