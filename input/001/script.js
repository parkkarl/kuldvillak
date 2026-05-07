const aInput = document.getElementById('a');
const bInput = document.getElementById('b');
const result = document.getElementById('result');

const operations = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => {
    if (b === 0) throw new Error('Nulliga ei saa jagada');
    return a / b;
  },
};

function readNumber(input, label) {
  if (input.value.trim() === '') throw new Error(`${label} on tühi`);
  const n = Number(input.value);
  if (Number.isNaN(n)) throw new Error(`${label} ei ole arv`);
  return n;
}

document.querySelectorAll('.buttons button').forEach((btn) => {
  btn.addEventListener('click', () => {
    result.classList.remove('error');
    try {
      const a = readNumber(aInput, 'Esimene arv');
      const b = readNumber(bInput, 'Teine arv');
      const op = operations[btn.dataset.op];
      result.textContent = `Tulemus: ${op(a, b)}`;
    } catch (err) {
      result.classList.add('error');
      result.textContent = err.message;
    }
  });
});
