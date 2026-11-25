// The guide and all languages also work without JavaScript.
document.querySelectorAll('[data-open-rule]').forEach(link=>{
  link.addEventListener('click',()=>{
    const rule=document.getElementById('rule-'+link.dataset.openRule);
    if(rule) rule.open=true;
  });
});
function openHashRule(){
  const target=document.getElementById(location.hash.slice(1));
  if(target && target.matches('details.rule')) target.open=true;
}
window.addEventListener('hashchange',openHashRule);
openHashRule();

// The guide does not collect personal data. This read only checks availability (config.js).
const status=document.querySelector('[data-registration-status]');
const mc=window.MC_CONFIG;
if(status && mc && mc.endpoint && !mc.closed) status.hidden=true;
