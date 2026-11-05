const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(month = 11, missing) {
  const writes = [];
  const sheets = {};
  for (const name of ['copy', 'next2', 'last', 'next', 'current']) {
    if (name === missing) continue;
    sheets[name] = {
      value: name, rows: 40, columns: name === 'next2' ? 30 : 10,
      dataColumns: name === 'next2' ? 30 : 10,
      getMaxRows() { return this.rows; },
      getMaxColumns() { return this.columns; },
      insertRowsAfter(_, count) { this.rows += count; },
      insertColumnsAfter(_, count) { this.columns += count; },
      insertColumns() { writes.push(name); },
      getLastColumn() { return 10; },
      getLastRow() { return 40; },
      clear() { writes.push(name); this.value = null; },
      getRange(...args) {
        return {
          sheet: this,
          setValue(value) {
            writes.push(name);
            if (args[0] === 'C2') sheets[name].month = value;
          },
          setValues() { writes.push(name); },
          getValues() {
            return args[0] === 40 ? [['user']] : Array.from({ length: args[2] }, () => ['']);
          },
          getDisplayValues() { return Array.from({ length: args[2] }, () => ['1']); },
        };
      },
      getDataRange() {
        const source = this;
        return {
          getNumRows: () => 40,
          getNumColumns: () => source.dataColumns,
          copyTo(target) {
            assert.ok(target.sheet.columns >= source.dataColumns);
            target.sheet.value = source.value;
            target.sheet.dataColumns = source.dataColumns;
          },
        };
      },
    };
  }
  const context = vm.createContext({
    Date: class extends Date { constructor() { super(2026, month - 1, 1); } },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => text }) },
  });
  const directory = path.join(__dirname, '../gas');
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.js'))) {
    vm.runInContext(fs.readFileSync(path.join(directory, file), 'utf8'), context);
  }
  return { context, sheets, writes };
}

for (const operation of ['inputNewDate', 'inputCorrectDate']) {
  for (const targetMonth of ['current', 'next', 'next2']) {
    const { context, writes } = setup();
    context[operation]({ targetMonth, id: 'user', name: 'test', comment: '', responses: { 1: 'OK' } });
    assert.deepEqual([...new Set(writes)], [targetMonth]);
  }
  for (const targetMonth of ['last', 'copy', 'invalid', undefined]) {
    const { context, writes } = setup();
    assert.throws(() => context[operation]({ targetMonth }));
    assert.deepEqual(writes, []);
  }
  const { context, writes } = setup(11, 'next2');
  assert.throws(() => context[operation]({ targetMonth: 'next2' }));
  assert.deepEqual(writes, []);
}

for (const [month, expected] of [[11, [10, 11, 12, 1]], [12, [11, 12, 1, 2]], [1, [12, 1, 2, 3]], [2, [1, 2, 3, 4]]]) {
  const { context, sheets, writes } = setup(month);
  context.monthlyTrigger();
  assert.deepEqual(['last', 'current', 'next', 'next2'].map(name => sheets[name].value), ['current', 'next', 'next2', 'copy']);
  assert.deepEqual(['last', 'current', 'next', 'next2'].map(name => sheets[name].month), expected);
  assert.equal(sheets.copy.value, 'copy');
  assert.equal(writes.includes('copy'), false);
}
for (const missing of ['last', 'current', 'next', 'next2', 'copy']) {
  const { context, writes } = setup(11, missing);
  assert.throws(() => context.monthlyTrigger());
  assert.deepEqual(writes, []);
}
console.log('PASS: month routing, invalid/missing sheets, rotation, template preservation, column growth, year rollover');
