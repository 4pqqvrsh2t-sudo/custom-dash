'use strict';
(() => {
  const supported = 'serial' in navigator && window.isSecureContext;
  let port=null, reader=null, task=null, busy=false, stopping=false, identified=false;
  let packets=0, errors=0, last=0, lastSensors=0, lastPower=0, sensors=[], pinReport=[], pinTime=0, usbPower=null;
  const text=(id,value)=>{const element=$('#'+id);if(element)element.textContent=value;};
  function controls() {
    $('#connect-port').disabled=!supported||busy||!!port;
    $('#disconnect-port').disabled=busy||!port;
    $('#port-baud').disabled=busy||!!port;
  }
  function render() {
    const now=Date.now(), stale=last && now-last>5000;
    const state=port ? last ? stale?'STALE / NO DATA':identified?'DEVICE ONLINE':'DATA / UNIDENTIFIED':'OPEN / WAITING' : 'NOT OPEN';
    text('port-state',state);
    const alert=(id,on,label)=>window.SurfaceAlerts?.update(id,on,stopping?'info':'warning',label);
    alert('serial',!!port&&!stale,'ESP32 link');
    sensors.forEach(v=>alert('sensor:'+v.id,!!port&&now-lastSensors<=5000,v.id));
    pinReport.forEach(v=>alert('pin:'+v.gpio,!!port&&now-pinTime<=5000&&v.connected,'GPIO '+v.gpio));
    text('port-packets',packets); text('port-errors',errors);
    text('port-age',last?Math.floor((now-last)/1000)+'s AGO':'—');
    text('esp-power',lastPower ? (!port||now-lastPower>5000?'STALE / ':'')+(usbPower?'PRESENT / REPORTED':'ABSENT / REPORTED') : 'NOT REPORTED');
    text('sensor-count',sensors.length);if(typeof PinDiagram!=='undefined')PinDiagram.update(pinReport,pinTime,!!port);
    const container=$('#sensor-readings'); container.replaceChildren();
    if (!sensors.length) { const p=document.createElement('p');p.textContent='No sensor values received. Waiting for your firmware.';container.append(p); }
    sensors.forEach(v=>{
      const row=document.createElement('div');row.className='sensor-row';
      const name=document.createElement('span'),value=document.createElement('b'),status=document.createElement('small');
      name.textContent=v.id;value.textContent=v.value.toLocaleString(undefined,{maximumFractionDigits:3})+' '+v.unit;
      status.textContent=!port||now-lastSensors>5000?'STALE':'LIVE / SERIAL';
      row.append(name,value,status);container.append(row);
    });
  }
  function receive(line) {
    if (!line.trim()) return;
    try {
      const p=SurfaceProtocol.parse(line);packets++;last=Date.now();
      if (p.type==='hello') {identified=true;text('port-device',p.device);text('port-firmware',p.firmware);}
      if (p.type==='sensors') {sensors.filter(v=>!p.values.some(n=>n.id===v.id)).forEach(v=>window.SurfaceAlerts?.update('sensor:'+v.id,false,'warning',v.id));sensors=p.values;lastSensors=last;}
      if(p.type==='pins'){pinReport.filter(v=>!p.pins.some(n=>n.gpio===v.gpio)).forEach(v=>window.SurfaceAlerts?.update('pin:'+v.gpio,false,'warning','GPIO '+v.gpio));pinReport=p.pins;pinTime=last;}
      if (p.type==='power') {usbPower=p.usb_present;lastPower=last;}
    render();
    } catch {errors++;}
  }
  async function read(opened) {
    const decoder=new TextDecoder();let buffer='',discard=false;
    try {
      reader=opened.readable.getReader();
      while (!stopping) {
        const {value,done}=await reader.read();if(done)break;
        // Drop oversized lines through their next newline; never parse their tail.
        for(const char of decoder.decode(value,{stream:true})) {
          if(char==='\n') {if(!discard)receive(buffer);buffer='';discard=false;}
          else if(!discard) {buffer+=char;if(buffer.length>4096){buffer='';discard=true;errors++;}}
        }
      }
    } catch { if(!stopping)text('port-message','Device removed or serial read failed. Check the cable and reconnect.'); }
    finally {
      if(reader){reader.releaseLock();reader=null;}
      try{await opened.close();}catch{}
      port=null;identified=false;controls();render();
      if(!stopping)text('port-message','Serial link ended. Last readings are stale; reconnect to resume.');
    }
  }
  $('#connect-port').onclick=async()=>{
    if(!supported||busy||port)return;
    busy=true;controls();
    let selected;
    try {
      selected=await navigator.serial.requestPort();
      await selected.open({baudRate:Number($('#port-baud').value),bufferSize:8192});
      if(!selected.readable)throw Error('No readable stream');
      port=selected;stopping=false;identified=false;packets=errors=last=lastSensors=lastPower=0;sensors=[];pinReport=[];pinTime=0;usbPower=null;
      const info=port.getInfo(),hex=n=>n===undefined?'—':n.toString(16).padStart(4,'0').toUpperCase();
      text('port-usb',hex(info.usbVendorId)+' / '+hex(info.usbProductId));
      text('port-device','UNIDENTIFIED');text('port-firmware','—');
      text('port-message','Port opened. Waiting for surface-port/1 firmware packets. Data stays on this device.');
      task=read(port);
    } catch(e) {
      if(selected&&!port)try{await selected.close();}catch{}
      text('port-message',e.name==='NotFoundError'?'No device selected.':e.name==='SecurityError'?'Access denied by browser policy. Use an allowed top-level browser page.':'Could not open serial. Close other serial tools, verify the data cable and try again.');
    } finally {busy=false;controls();render();}
  };
  $('#disconnect-port').onclick=async()=>{
    if(!port||busy)return;busy=true;stopping=true;controls();
    try{if(reader)await reader.cancel();if(task)await task;}catch{}
    finally{busy=false;text('port-message','Disconnected. Last sensor readings are stale.');controls();render();}
  };
  $('#validate-packet').onclick=()=>{
    try{const p=SurfaceProtocol.parse($('#packet-test').value);text('packet-result','VALID / '+p.type.toUpperCase()+' — format check only; no hardware connected.');}
    catch(e){text('packet-result','INVALID / '+e.message);}
  };
  text('port-capability',supported?'WEB SERIAL AVAILABLE / choose your device to grant access.':'USB SERIAL UNAVAILABLE HERE / use a supported browser on your Chromebook. A native or compatible network bridge is needed for this host.');
  if('getBattery' in navigator)navigator.getBattery().then(b=>{
    const update=()=>{text('host-battery',Math.round(b.level*100)+'% / REPORTED');text('host-charging',b.charging?'CHARGING / REPORTED':'DISCHARGING / REPORTED');};
    update();b.addEventListener('chargingchange',update);b.addEventListener('levelchange',update);
  }).catch(()=>{text('host-charging','ACCESS UNAVAILABLE');});
  controls();render();setInterval(render,1000);
})();
