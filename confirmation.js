const lang=document.documentElement.lang;
const t=(await(await fetch('registration-messages.json?v=20261125c')).json())[lang];
const token=new URLSearchParams(location.hash.slice(1)).get('token');
history.replaceState(null,'',location.pathname);
const button=document.getElementById('confirm-button'),error=document.getElementById('confirm-error');
// [MODIFICA] la conferma viene registrata nel foglio Google tramite Apps Script (config.js).
const endpoint=window.MC_CONFIG&&window.MC_CONFIG.endpoint;
if(!token){button.disabled=true;document.getElementById('confirm-message').textContent=t.invalidToken;}
else if(!endpoint){button.disabled=true;document.getElementById('confirm-message').textContent=t.network;}
button.addEventListener('click',async()=>{
 button.disabled=true;error.hidden=true;
 try{
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'confirm',token}),redirect:'follow'});const data=await res.json();
  if(!data||data.ok!==true){error.textContent=data&&data.code==='token'?t.invalidToken:t.network;error.hidden=false;button.disabled=false;return;}
  document.querySelector('h1').textContent=t.confirmed;document.getElementById('confirm-message').textContent=t.confirmedText;document.getElementById('confirm-reference').textContent=`${t.reference}: ${data.reference}`;button.hidden=true;
 }catch{error.textContent=t.network;error.hidden=false;button.disabled=false;}
});
