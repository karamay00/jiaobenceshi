const fs = require('fs');

// 读取原始脚本
const scriptContent = fs.readFileSync('./script.js', 'utf8');

// 简单的方式：直接将脚本内容作为字符串，不做复杂的压缩处理
// 只去掉外层的 (function () { ... })(); 包装，因为bookmarklet会自己包装
const cleanScript = scriptContent.trim();

// 为bookmarklet format创建URL编码版本
const bookmarkletUrl = 'javascript:' + encodeURIComponent(cleanScript);

// 输出到文件
fs.writeFileSync('./bookmarklet-generated.txt', bookmarkletUrl, 'utf8');

console.log('✅ Bookmarklet已生成到 bookmarklet-generated.txt');
console.log('长度:', bookmarkletUrl.length);

// 同时输出不编码的版本用于调试
fs.writeFileSync('./bookmarklet-raw.txt', 'javascript:' + cleanScript, 'utf8');
console.log('✅ 原始版本已生成到 bookmarklet-raw.txt（用于调试）');
