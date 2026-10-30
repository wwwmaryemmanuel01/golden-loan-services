/* minimal, dependency-free XLSX (Office Open XML) writer — ZIP with STORE entries */
const XENC = new TextEncoder();
function xCrc32(buf){
  let crc = 0xFFFFFFFF;
  for(let i=0;i<buf.length;i++){
    let c = (crc ^ buf[i]) & 0xFF;
    for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
const xU16 = n => [n & 255, (n >> 8) & 255];
const xU32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
function xDosTime(d){
  return {time: ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31),
          date: (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31)};
}
function xZip(files){
  const dt = xDosTime(new Date()), parts = [], central = [];
  let offset = 0;
  files.forEach(f=>{
    const name = XENC.encode(f.name), data = f.bytes, crc = xCrc32(data), size = data.length;
    const local = [].concat([0x50,0x4b,0x03,0x04], xU16(20), xU16(0), xU16(0), xU16(dt.time), xU16(dt.date),
      xU32(crc), xU32(size), xU32(size), xU16(name.length), xU16(0));
    parts.push(new Uint8Array(local), name, data);
    central.push({name, crc, size, offset});
    offset += local.length + name.length + size;
  });
  const cdStart = offset, cd = [];
  central.forEach(c=>{
    const h = [].concat([0x50,0x4b,0x01,0x02], xU16(20), xU16(20), xU16(0), xU16(0), xU16(dt.time), xU16(dt.date),
      xU32(c.crc), xU32(c.size), xU32(c.size), xU16(c.name.length), xU16(0), xU16(0), xU16(0), xU16(0), xU32(0), xU32(c.offset));
    cd.push(new Uint8Array(h), c.name);
  });
  const cdSize = cd.reduce((a,b)=>a+b.length,0);
  const end = [].concat([0x50,0x4b,0x05,0x06], xU16(0), xU16(0), xU16(central.length), xU16(central.length),
    xU32(cdSize), xU32(cdStart), xU16(0));
  return new Blob([...parts, ...cd, new Uint8Array(end)],
    {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xEsc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
const xNum = v => {
  const s = String(v).trim();
  if(!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return (isFinite(n) && Math.abs(n) < 1e15) ? n : null;
};
const xCol = i => { let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; };

function xlsxBlob(sheets){
  // sheets: [{name, rows:[[cell,...],...]}]
  const defs = sheets.map((sh, si)=>{
    const rows = sh.rows.map((row, ri)=>'<row r="'+(ri+1)+'">' + row.map((cell, ci)=>{
      const ref = xCol(ci) + (ri+1), txt = String(cell == null ? '' : cell).replace(/<[^>]+>/g,'').trim();
      const n = xNum(txt);
      return n === null
        ? '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xEsc(txt)+'</t></is></c>'
        : '<c r="'+ref+'"><v>'+n+'</v></c>';
    }).join('') + '</row>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>' + rows + '</sheetData></worksheet>';
  });
  const sheetTags = sheets.map((sh,i)=>'<sheet name="'+xEsc(sh.name||('Sheet'+(i+1)))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('');
  const wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' + sheetTags + '</sheets></workbook>';
  const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((sh,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('') +
    '</Relationships>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
  const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    sheets.map((sh,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
    '</Types>';
  const files = [{name:'[Content_Types].xml', bytes:XENC.encode(ct)},
                 {name:'_rels/.rels', bytes:XENC.encode(rels)},
                 {name:'xl/workbook.xml', bytes:XENC.encode(wb)},
                 {name:'xl/_rels/workbook.xml.rels', bytes:XENC.encode(wbRels)}]
    .concat(defs.map((x,i)=>({name:'xl/worksheets/sheet'+(i+1)+'.xml', bytes:XENC.encode(x)})));
  return xZip(files);
}

/* human label used by the console */
function sheetFor(rep, rows, f){
  return [{name:(rep.id||'Report').replace(/[\\:*?\/\[\]]/g,'-'),
    rows: [['GOLDEN FINANCIAL SERVICES — ADMIN PORTAL'],
           [rep.n + '  (' + rep.id + ')'],
           ['Category: ' + rep.cat.name + '   Period: ' + (f.from||'—') + ' to ' + (f.to||'—') +
            '   Generated: 30 Oct 2026 ' + (typeof stamp==='function'?stamp():'')],
           ['Rows: ' + rows.length],
           [],
           rep.cols.slice(),
           rows.map(r=>r.map(c=>String(c).replace(/<[^>]+>/g,'').trim()))]
  }];
}
