/**
 * xlsx.js — 의존성 없는 최소 .xlsx 작성기
 *
 * .xlsx = OOXML XML 파일들을 담은 ZIP. 여기서는 압축 없이(store) 담아 CRC-32 만 계산한다.
 * 지원: 여러 시트, 인라인 문자열/숫자, 헤더 스타일(배경·흰 글씨·굵게), 폰트 이름,
 *       열 너비, 틀 고정(A2), 자동 필터. 오프라인·단일 HTML 에서 동작시키기 위해 직접 구현.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function utf8(str) {
  return new TextEncoder().encode(str);
}

function u16(v) { return [v & 0xff, (v >>> 8) & 0xff]; }
function u32(v) { return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]; }

/** DOS 날짜/시간 (ZIP 헤더용) */
function dosDateTime(d = new Date()) {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() >> 1) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

/**
 * 파일 목록 → ZIP(store) 바이트
 * @param {{name:string, data:Uint8Array}[]} files
 */
export function buildZip(files, date = new Date()) {
  const { time, date: dd } = dosDateTime(date);
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const f of files) {
    const name = utf8(f.name);
    const data = f.data;
    const crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(dd),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
      ...name,
    ]);
    locals.push(local, data);
    const central = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(time), ...u16(dd),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ...name,
    ]);
    centrals.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centrals.reduce((a, c) => a + c.length, 0);
  const eocd = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);
  const total = offset + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of [...locals, ...centrals, eocd]) { out.set(part, p); p += part.length; }
  return out;
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function colLetter(n) { // 0-based → A, B, ..., Z, AA
  let s = '';
  n = n + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function sheetXml(rows, opts) {
  const ncols = Math.max(1, ...rows.map((r) => r.length));
  const nrows = Math.max(1, rows.length);
  const widths = opts.colWidths || [];
  let cols = '<cols>';
  for (let c = 0; c < ncols; c++) {
    const w = widths[c] || Math.min(60, Math.max(10, ...rows.map((r) => String(r[c] ?? '').length * 1.1 + 2)));
    cols += `<col min="${c + 1}" max="${c + 1}" width="${w.toFixed(1)}" customWidth="1"/>`;
  }
  cols += '</cols>';
  let data = '<sheetData>';
  rows.forEach((row, r) => {
    data += `<row r="${r + 1}">`;
    row.forEach((v, c) => {
      const ref = `${colLetter(c)}${r + 1}`;
      const style = r === 0 ? (opts.plainHeader ? ' s="3"' : ' s="1"') : (opts.monoCols && opts.monoCols.includes(c) ? ' s="2"' : ' s="3"');
      if (v === null || v === undefined || v === '') return;
      if (typeof v === 'number' && Number.isFinite(v)) data += `<c r="${ref}"${style}><v>${v}</v></c>`;
      else data += `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;
    });
    data += '</row>';
  });
  data += '</sheetData>';
  const ref = `A1:${colLetter(ncols - 1)}${nrows}`;
  const views = opts.noFreeze
    ? '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';
  const filter = opts.noFilter ? '' : `<autoFilter ref="${ref}"/>`;
  // 드롭다운(목록) 유효성 검사: validations = [{ sqref:'B2:B200', list:['a','b'] }]
  const vals = (opts.validations || []).map((v) => `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${xmlEscape(v.sqref)}"><formula1>"${xmlEscape(v.list.join(','))}"</formula1></dataValidation>`);
  const validations = vals.length ? `<dataValidations count="${vals.length}">${vals.join('')}</dataValidations>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="${ref}"/>${views}<sheetFormatPr defaultRowHeight="16"/>${cols}${data}${filter}${validations}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

function stylesXml(style) {
  const font = xmlEscape(style.fontName || 'KoPub Dotum');
  const fill = (style.headerFill || '0C3026').replace('#', '').toUpperCase();
  const hfont = (style.headerFont || 'FFFFFF').replace('#', '').toUpperCase();
  const mono = xmlEscape(style.monoFont || 'Consolas');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="11"/><name val="${font}"/></font>
<font><b/><sz val="11"/><color rgb="FF${hfont}"/><name val="${font}"/></font>
<font><sz val="11"/><name val="${mono}"/></font>
</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${fill}"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="4">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

/**
 * 워크북 생성
 * @param {{name:string, rows:any[][], colWidths?:number[], monoCols?:number[]}[]} sheets
 * @param {{fontName?:string, headerFill?:string, headerFont?:string, monoFont?:string}} style
 * @returns {Uint8Array} .xlsx 바이트
 */
export function buildXlsx(sheets, style = {}, date = new Date()) {
  const files = [];
  const sheetNames = sheets.map((s, i) => xmlEscape((s.name || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)));
  files.push({
    name: '[Content_Types].xml',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`),
  });
  files.push({
    name: '_rels/.rels',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
  });
  const iso = date.toISOString().replace(/\.\d+Z$/, 'Z');
  files.push({
    name: 'docProps/core.xml',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:creator>KASP Designer</dc:creator><cp:lastModifiedBy>KASP Designer</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`),
  });
  files.push({
    name: 'docProps/app.xml',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>KASP Designer</Application></Properties>`),
  });
  const definedNames = sheets.map((s, i) => {
    if (s.noFilter) return '';
    const ncols = Math.max(1, ...s.rows.map((r) => r.length));
    const nrows = Math.max(1, s.rows.length);
    return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${sheetNames[i]}'!$A$1:${colLetter(ncols - 1)}${nrows}</definedName>`;
  }).join('');
  files.push({
    name: 'xl/workbook.xml',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<workbookPr/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="12000"/></bookViews>
<sheets>${sheets.map((_, i) => `<sheet name="${sheetNames[i]}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
<definedNames>${definedNames}</definedNames>
</workbook>`),
  });
  files.push({
    name: 'xl/_rels/workbook.xml.rels',
    data: utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
  });
  files.push({ name: 'xl/styles.xml', data: utf8(stylesXml(style)) });
  sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: utf8(sheetXml(s.rows, s)) }));
  return buildZip(files, date);
}

/**
 * (검증용) ZIP 중앙 디렉터리 파싱 → 항목 이름/CRC 목록
 */
export function listZipEntries(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = bytes.length;
  let eocd = -1;
  for (let i = n - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('EOCD not found');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const entries = [];
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('bad central header');
    const crc = dv.getUint32(p + 16, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    const lnameLen = dv.getUint16(localOff + 26, true);
    const lextraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lnameLen + lextraLen;
    const data = bytes.subarray(dataStart, dataStart + size);
    entries.push({ name, crc, size, data, crcOk: crc32(data) === crc });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
