'use strict';
const SurfaceProtocol = (() => {
  function parse(line) {
    if (typeof line !== 'string' || line.length > 4096) throw Error('Packet exceeds 4096 characters.');
    let p; try { p = JSON.parse(line); } catch { throw Error('Not valid JSON.'); }
    if (!p || typeof p !== 'object' || Array.isArray(p)) throw Error('Expected a packet object.');
    const short = (s,max) => typeof s === 'string' && s.length > 0 && s.length <= max && !/[\u0000-\u001f]/.test(s);
    if (p.type === 'hello') {
      if (p.protocol !== 'surface-port/1' || !short(p.device,40) || !short(p.firmware,40)) throw Error('Expected surface-port/1, device and firmware.');
      return {type:'hello',device:p.device,firmware:p.firmware};
    }
    if (p.type === 'sensors') {
      if (!Array.isArray(p.values) || p.values.length > 24) throw Error('Expected up to 24 sensor values.');
      const seen = new Set();
      const values = p.values.map(v => {
        if (!v || !short(v.id,32) || !/^[a-zA-Z0-9_-]+$/.test(v.id) || seen.has(v.id) || typeof v.value !== 'number' || !Number.isFinite(v.value) || Math.abs(v.value) > 1e9 || typeof v.unit !== 'string' || v.unit.length > 12 || /[\u0000-\u001f]/.test(v.unit)) throw Error('Invalid or duplicate sensor ID, value or unit.');
        seen.add(v.id); return {id:v.id,value:v.value,unit:v.unit};
      });
      return {type:'sensors',values};
    }
    if (p.type === 'power' && (p.usb_present === true || p.usb_present === false)) return {type:'power',usb_present:p.usb_present};
    throw Error('Unknown packet type.');
  }
  function remainingRoute(progress) {
    const points = [[172,440],[172,272],[388,272],[388,150],[480,150]], lengths=[168,216,122,92];
    let distance = Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0))*598;
    if (distance >= 598) return '';
    for (let i=0;i<lengths.length;i++) {
      if (distance < lengths[i]) {
        const fraction=distance/lengths[i], a=points[i], b=points[i+1];
        return 'M'+(a[0]+(b[0]-a[0])*fraction).toFixed(3)+' '+(a[1]+(b[1]-a[1])*fraction).toFixed(3)+points.slice(i+1).map(p=>'L'+p.join(' ')).join('');
      }
      distance -= lengths[i];
    }
    return '';
  }
  return {parse,remainingRoute};
})();
if (typeof module !== 'undefined') module.exports = SurfaceProtocol;
