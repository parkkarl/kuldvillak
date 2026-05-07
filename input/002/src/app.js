async function loadBooks() {
  const list = document.getElementById('list');
  const errorEl = document.getElementById('error');
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`Andmete laadimine ebaõnnestus (${res.status})`);
    const books = await res.json();
    for (const book of books) {
      const el = document.createElement('article');
      el.className = 'book';
      el.innerHTML = `
        <h2>${book.title}</h2>
        <p class="meta">${book.author} (${book.year})</p>
      `;
      list.appendChild(el);
    }
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = err.message;
  }
}

loadBooks();
