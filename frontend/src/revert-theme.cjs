const fs = require('fs');
const path = require('path');
const d = 'c:\\Users\\FELIPE VIEIRA\\OneDrive\\Desktop\\Project\\frontend\\src';

function w(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) w(fp);
    else if (f.endsWith('.css') || f.endsWith('.jsx')) {
      let c = fs.readFileSync(fp, 'utf8');
      
      // Reverse changes
      let nc = c;
      if (f.endsWith('.jsx')) {
         nc = nc.replace(/var\(--background-card\)/g, 'white');
         nc = nc.replace(/\'white\'/g, '"white"'); // Just standardizing back
      } else {
         nc = nc.replace(/var\(--background-card\)/g, 'white');
         nc = nc.replace(/var\(--surface-warm\)/g, '#FFF8F3');
      }
      
      if (c !== nc) {
        fs.writeFileSync(fp, nc);
        console.log('Reverted ' + f);
      }
    }
  });
}
w(d);
