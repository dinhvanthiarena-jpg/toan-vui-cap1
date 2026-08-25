// Chạy file này để tạo 1 mã key mới cho khách hàng.
// Cách chạy: node tools/generate-license-key.js "Tên khách hàng (tuỳ chọn)"
const { generateKey } = require('../license-core');

const note = process.argv.slice(2).join(' ').trim();
const key = generateKey();

console.log('');
console.log('==============================================');
console.log('  MA KEY MOI:  ' + key);
console.log('==============================================');
if (note) console.log('  Ghi chu: ' + note);
console.log('  Ngay tao:  ' + new Date().toLocaleString('vi-VN'));
console.log('');
console.log('Gui nguyen dong ma key phia tren cho khach hang.');
console.log('Moi lan chay lai file nay se ra 1 ma key MOI, KHAC nhau.');
console.log('');
