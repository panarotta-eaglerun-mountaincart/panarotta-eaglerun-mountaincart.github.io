// Configurazione del modulo di accettazione.
// endpoint: incolla qui l'URL dell'App web di Google Apps Script (finisce con /exec).
//           Finché è vuoto il modulo resta disattivato e mostra "La registrazione online non è ancora attiva".
// closed:   metti true per sospendere la raccolta delle accettazioni.
window.MC_CONFIG = {
  endpoint: "",
  closed: false,
  regulations: {
    it: { version: "PER-2026-09-07-IT-bee1f4df", hash: "bee1f4df70bf17d51471b6396cb89902f189e1ee644d5a1a16375c169ab4247f" },
    en: { version: "PER-2026-09-07-EN-7236b406", hash: "7236b40639edcf9ec1607bf169dbef61fee7b8a67030a4385454ac379ca2da0f" },
    de: { version: "PER-2026-09-07-DE-f17cfb1c", hash: "f17cfb1cc91770e0d1674c8683f1869f5e5c949a7b055ddc73716b90685515aa" }
  }
};
