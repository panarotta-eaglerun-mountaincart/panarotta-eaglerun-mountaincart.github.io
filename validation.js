export function romeDate(now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
export function ageOn(birth,today) {
 if(typeof birth!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return null;
 const date=new Date(`${birth}T12:00:00Z`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==birth||birth>today||Number(birth.slice(0,4))<1900) return null;
 return Number(today.slice(0,4))-Number(birth.slice(0,4))-(today.slice(5)<birth.slice(5)?1:0);
}
// [MODIFICA] photo: scelta foto/video del punto 27 ('yes' | 'no'), obbligatorio scegliere, non obbligatorio acconsentire.
const PHOTO=['yes','no'];
export function validateSubmission(input,today=romeDate()) {
 const fail=code=>({ok:false,code});
 if(!input||typeof input!=='object')return fail('required');
 const person=(p)=> {
  if(!p||typeof p!=='object')return null;
  const result={};
  for(const key of ['firstName','lastName','birthPlace']){
   if(typeof p[key]!=='string')return null;
   const value=p[key].trim().normalize('NFC').replace(/\s+/g,' ');
   if(!value||value.length>120||/[\u0000-\u001f\u007f<>]/.test(value)||!/[\p{L}\p{N}]/u.test(value))return null;
   result[key]=value;
  }
  result.birthDate=p.birthDate;
  return result;
 };
 const adult=person(input.adult);if(!adult)return fail('name');
 const adultAge=ageOn(adult.birthDate,today);if(adultAge===null)return fail('date');if(adultAge<18)return fail('adultAge');
 if(typeof input.email!=='string'||typeof input.emailConfirm!=='string')return fail('email');
 const email=input.email.trim().toLowerCase();
 if(email.length>254||! /^[^\s@<>\u0000-\u001f]+@[^\s@<>\u0000-\u001f]+\.[^\s@<>\u0000-\u001f]+$/.test(email))return fail('email');
 if(email!==input.emailConfirm.trim().toLowerCase())return fail('emailMismatch');
 if(!Array.isArray(input.minors)||input.minors.length>20)return fail('minors');
 const minors=[],seen=new Set();
 for(const item of input.minors){
  const minor=person(item);if(!minor)return fail('name');
  const age=ageOn(minor.birthDate,today);if(age===null)return fail('date');if(age<5||age>=18)return fail('minorAge');
  if(!['parent','guardian','authorized'].includes(item.role))return fail('minors');
  minor.role=item.role;
  const fingerprint=JSON.stringify([minor.firstName.toLocaleLowerCase(),minor.lastName.toLocaleLowerCase(),minor.birthDate]);
  if(seen.has(fingerprint))return fail('duplicate');seen.add(fingerprint);
  minor.photo=item.photo;minors.push(minor);
 }
 if(!PHOTO.includes(input.adult.photo)||minors.some(m=>!PHOTO.includes(m.photo)))return fail('photo');
 if(minors.some(m=>m.role==='authorized'&&m.photo==='yes'))return fail('photoRole');
 adult.photo=input.adult.photo;
 if(input.terms!==true||input.privacy!==true||(minors.length&&input.authority!==true))return fail('terms');
 return {ok:true,value:{adult,email,minors,terms:true,privacy:true,authority:minors.length?true:false}};
}
