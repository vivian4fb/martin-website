import"./hoisted.BsPv2Qun.js";const t=document.querySelector("#enquiry"),s=t.querySelector(".form-status");t.addEventListener("submit",async a=>{if(a.preventDefault(),!t.reportValidity())return;const e=new FormData(t);if(t.dataset.direct!=="true"){const o=`${e.get("message")}

— ${e.get("name")}
${e.get("email")}${e.get("phone")?`
${e.get("phone")}`:""}`,n=`${e.get("topic")} enquiry from ${e.get("name")}`;window.location.href=`mailto:${t.dataset.email}?subject=${encodeURIComponent(n)}&body=${encodeURIComponent(o)}`,s.textContent="Your email application should now be open. If not, write to the address shown.";return}s.textContent="Sending…";try{const o=await fetch("https://api.web3forms.com/submit",{method:"POST",body:e}),n=await o.json();if(!o.ok||!n.success)throw new Error(n.message||`HTTP ${o.status}`);t.reset(),s.textContent="Thank you — your enquiry has been sent."}catch(o){s.textContent=`The message could not be sent (${o.message}). Please email ${t.dataset.email} directly.`}});
