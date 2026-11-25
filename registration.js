import {validateSubmission,romeDate} from './validation.js';
const lang=document.documentElement.lang;
const t=(await(await fetch('registration-messages.json')).json())[lang];
const $=id=>document.getElementById(id);
let config=null,minorCount=0,reviewed=null,requestId=null,submitted=false,busy=false;
function showError(code,target='form-error') {const el=$(target);el.textContent=t.errors[code]||t.network;el.hidden=false;el.scrollIntoView({block:'center',behavior:'smooth'});}
function person(root){const out={};root.querySelectorAll('input[name]:not([type=radio]),select[name]').forEach(el=>out[el.name]=el.value);return out;}
// [MODIFICA] scelta foto/video (punto 27): '' se non indicata.
function photoChoice(name){const el=document.querySelector(`input[name="${name}"]:checked`);return el?el.value:'';}
function payload(){const adult=person($('acceptance-form').querySelector('.form-panel'));return {adult:{firstName:adult.firstName,lastName:adult.lastName,birthDate:adult.birthDate,birthPlace:adult.birthPlace,photo:photoChoice('photo-adult')},email:adult.email,emailConfirm:adult.emailConfirm,minors:[...$('minors-list').querySelectorAll('.minor-card')].map(card=>({...person(card),photo:photoChoice('photo-minor-'+card.dataset.uid)})),terms:$('terms').checked,privacy:$('privacy').checked,authority:$('authority').checked,language:lang,regulationHash:config.regulationHash};}
function focusPanel(id){$(id).hidden=false;$(id).focus();$(id).scrollIntoView({block:'start',behavior:'smooth'});}
// [MODIFICA] un gruppo "Foto e video" per ogni minore, nella sezione 04.
function photoGroup(uid){
 const fs=document.createElement('fieldset');fs.className='photo-choice';fs.dataset.photoFor=uid;
 const lg=document.createElement('legend');fs.append(lg);
 for(const [value,text] of [['yes',t.photoMinorYes],['no',t.photoMinorNo]]){
  const label=document.createElement('label');label.className='check-label';
  const input=document.createElement('input');input.type='radio';input.name='photo-minor-'+uid;input.value=value;input.required=true;input.setAttribute('data-person-input','');input.disabled=!config?.enabled;
  const span=document.createElement('span');span.textContent=text;label.append(input,span);fs.append(label);
 }
 return fs;
}
function syncPhotoGroups(){
 const cards=[...$('minors-list').children],box=$('photo-minors');
 cards.forEach((card,i)=>{
  let fs=box.querySelector(`[data-photo-for="${card.dataset.uid}"]`);if(!fs){fs=photoGroup(card.dataset.uid);}
  box.append(fs);
  const name=[card.querySelector('[name=firstName]').value,card.querySelector('[name=lastName]').value].join(' ').trim();
  fs.querySelector('legend').textContent=`${t.minor} ${i+1}`+(name?` – ${name}`:'');
 });
 box.querySelectorAll('[data-photo-for]').forEach(fs=>{if(!cards.some(c=>c.dataset.uid===fs.dataset.photoFor))fs.remove();});
 $('photo-minor-note').hidden=!cards.length;
}
function renumber(){const cards=[...$('minors-list').children];cards.forEach((card,i)=>{card.querySelector('.minor-number').textContent=i+1;card.querySelector('.remove-minor').setAttribute('aria-label',`${t.remove} ${t.minor} ${i+1}`);});$('no-minors').hidden=!!cards.length;$('authority-label').hidden=!cards.length;$('authority').required=!!cards.length;if(!cards.length)$('authority').checked=false;$('add-minor').disabled=cards.length>=20;syncPhotoGroups();}
$('add-minor').addEventListener('click',()=>{
 if($('minors-list').children.length>=20)return;
 const card=$('minor-template').content.firstElementChild.cloneNode(true);const uid=++minorCount;
 card.innerHTML=card.innerHTML.replaceAll('TEMPLATE',String(uid));card.dataset.uid=String(uid);
 card.querySelectorAll('[data-person-input]').forEach(el=>el.disabled=!config?.enabled);
 card.querySelector('[type=date]').max=romeDate();
 card.querySelector('.remove-minor').addEventListener('click',()=>{card.remove();renumber();$('add-minor').focus();});
 card.querySelectorAll('[name=firstName],[name=lastName]').forEach(el=>el.addEventListener('input',syncPhotoGroups));
 $('minors-list').append(card);renumber();card.querySelector('input:not(:disabled)')?.focus();
});
function reviewPerson(parent,title,p){const h=document.createElement('h3');h.textContent=title;parent.append(h);const dl=document.createElement('dl');for(const key of ['firstName','lastName','birthDate','birthPlace','role','photo']){if(!p[key])continue;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=t[key];dd.textContent=key==='role'?t[p[key]]:key==='photo'?(p[key]==='yes'?t.photoYesShort:t.photoNoShort):p[key];dl.append(dt,dd);}parent.append(dl);}
$('acceptance-form').addEventListener('submit',event=>{
 event.preventDefault();if(!config?.enabled||busy||submitted)return;$('form-error').hidden=true;
 if(!$('acceptance-form').reportValidity())return;
 const data=payload(),valid=validateSubmission(data);if(!valid.ok){showError(valid.code);return;}
 reviewed=data;requestId=crypto.randomUUID();const container=$('review-data');container.replaceChildren();reviewPerson(container,t.adult,valid.value.adult);const email=document.createElement('p');email.textContent=`${t.email}: ${valid.value.email}`;container.append(email);valid.value.minors.forEach((m,i)=>reviewPerson(container,`${t.minor} ${i+1}`,m));
 const declaration=document.createElement('p');declaration.textContent=t.terms;container.append(declaration);
 $('acceptance-form').hidden=true;focusPanel('review-panel');
});
$('edit-button').addEventListener('click',()=>{if(busy)return;$('review-panel').hidden=true;$('acceptance-form').hidden=false;$('review-button').focus();reviewed=null;requestId=null;});
// [MODIFICA] invio al foglio Google (Apps Script). text/plain = richiesta semplice, senza preflight CORS.
async function send(){
 if(busy||!reviewed||!requestId)return;busy=true;$('send-button').disabled=true;$('edit-button').disabled=true;$('retry-button').disabled=true;$('send-error').hidden=true;$('send-button').textContent=t.sending;
 try{
  const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'submit',requestId,...reviewed}),redirect:'follow'});
  const result=await response.json();if(!result||result.ok!==true||!result.reference){showError(result&&result.code,submitted?'result-message':'send-error');return;}
  submitted=true;$('review-panel').hidden=true;$('reference').textContent=result.reference;
  if(result.emailState==='disabled'){$('result-panel').querySelector('h2').textContent=t.savedNoMailTitle;$('result-message').textContent=t.savedNoMail;$('retry-button').hidden=true;focusPanel('result-panel');return;}
  $('result-message').textContent=result.emailState==='submitted'?t.sent:result.emailState==='failed'?t.mailFailed:t.mailPending;
  $('retry-button').hidden=result.emailState==='submitted';focusPanel('result-panel');
 }catch{showError('network',submitted?'result-message':'send-error');}
 finally{busy=false;$('send-button').disabled=false;$('edit-button').disabled=false;$('retry-button').disabled=false;$('send-button').textContent=t.submit;}
}
$('send-button').addEventListener('click',send);$('retry-button').addEventListener('click',send);
try{
 const mc=window.MC_CONFIG;if(!mc||!mc.regulations||!mc.regulations[lang])throw new Error();
 config={enabled:!!mc.endpoint&&!mc.closed,endpoint:mc.endpoint,regulationVersion:mc.regulations[lang].version,regulationHash:mc.regulations[lang].hash};
 $('availability').textContent=config.enabled?t.next:t.unavailable;$('availability').hidden=config.enabled;
 $('review-button').disabled=!config.enabled;$('regulation-version').textContent=`${t.version}: ${config.regulationVersion}`;
 document.querySelectorAll('[data-person-input]').forEach(el=>el.disabled=!config.enabled);
 $('adult-birthDate').max=romeDate();
}catch{$('availability').textContent=t.network;}
