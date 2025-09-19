import axios from 'axios';
import * as cheerio from 'cheerio';

const SEED_URLS = (process.env.SEARCH_SEED_URLS ||
 'https://www.khisima.com,https://www.khisima.com/services,https://www.khisima.com/about-us,https://www.khisima.com/contact,https://www.khisima.com/workplace,https://www.khisima.com/quote'
).split(',').map(s => s.trim());
const TIMEOUT = Number(process.env.SEARCH_TIMEOUT_MS || 8000);
const CACHE_TTL = Number(process.env.SEARCH_CACHE_TTL_MS || 15*60*1000);
const MAX_PAGES = Math.max(1, Number(process.env.SEARCH_MAX_PAGES || 8));
const cache = new Map();

const normalize = s => s.toLowerCase().replace(/\s+/g,' ').trim();
const score = (q,t)=>{ const Q=normalize(q).split(' ').filter(Boolean); t=normalize(t); if(!Q.length||!t) return 0; let h=0; for(const w of Q) if(t.includes(w)) h++; return h/Q.length;};
const snippet=(body,q,max=260)=>{ const t=body.replace(/\s+/g,' ').trim(); if(t.length<=max) return t;
  const n=(q.split(/\s+/)[0]||'').toLowerCase(); const i=t.toLowerCase().indexOf(n);
  if(i<0) return t.slice(0,max-1)+'…'; const s=Math.max(0,i-Math.floor(max/2)); return (s?'…':'')+t.slice(s,s+max-(s?1:0))+'…';};

async function fetchPage(url){
  const hit=cache.get(url),now=Date.now(); if(hit&&now-hit.ts<CACHE_TTL) return hit;
  const { data } = await axios.get(url, { timeout: TIMEOUT });
  const $=cheerio.load(data); ['script','style','noscript','svg','img','video','iframe'].forEach(sel=>$(sel).remove());
  const title=($('title').first().text()||'').trim(); const text=$('body').text().replace(/\s+/g,' ').trim();
  const doc={ ts:now, title, text, url }; cache.set(url,doc); return doc;
}

export async function siteSearch(query) {
  const q = (query || "").toLowerCase();

  // location
  if (q.includes("location") || q.includes("where are you") || q.includes("where do you")) {
    return { answer: "We’re based in Kigali, Rwanda, with a distributed team across Africa." };
  }

  // contact
  if (q.includes("contact") || q.includes("email") || q.includes("phone")) {
    return { answer: "Contact us at info@khisima.com or +250 789 619 370." };
  }

  // services
  if (q.includes("services") || q.includes("what do you offer")) {
    return {
      answer:
        "Services: Translation & Localization • Language Data (collection/annotation/evaluation) • AI Language Consulting • Cultural Adaptation • Voice-over & Dubbing • Multilingual SEO.",
    };
  }

  // workplace/countries
  if (q.includes("workplace") || q.includes("countries")) {
    return { answer: "We operate across Africa and collaborate with partners in multiple countries." };
  }

  return null; // nothing solid
}
