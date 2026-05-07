const STORAGE_KEY = 'todos';
const list = document.getElementById('taskList');
const form = document.getElementById('addForm');
const input = document.getElementById('newTask');

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  const todos = load();
  list.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');
    li.innerHTML = `
      <input type="checkbox" ${todo.done ? 'checked' : ''} data-idx="${idx}" class="toggle" />
      <span>${todo.text}</span>
      <button class="del" data-idx="${idx}">Kustuta</button>
    `;
    list.appendChild(li);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const todos = load();
  todos.push({ text, done: false });
  save(todos);
  input.value = '';
  render();
});

list.addEventListener('click', (e) => {
  const idx = Number(e.target.dataset.idx);
  if (Number.isNaN(idx)) return;
  const todos = load();
  if (e.target.classList.contains('toggle')) {
    todos[idx].done = e.target.checked;
    save(todos);
    render();
  } else if (e.target.classList.contains('del')) {
    todos.splice(idx, 1);
    save(todos);
    render();
  }
});

render();
