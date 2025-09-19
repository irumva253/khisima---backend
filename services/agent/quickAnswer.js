/* Helpers */
const norm = (s = "") => s.toLowerCase().replace(/\s+/g, " ").trim();
const tokenize = (s = "") => norm(s).split(" ").filter(Boolean);
const hasAny = (txt, arr) => arr.some((p) => norm(txt).includes(norm(p)));
const hasWord = (txt, w) => new RegExp(`\\b${w}\\b`, "i").test(txt);

/* Pure small-talk replies (short & human) */
const R = {
  greeting: (t) => {
    const morning = hasWord(t, "morning");
    const afternoon = hasWord(t, "afternoon");
    const evening = hasWord(t, "evening");
    if (morning) return "🌅 Good morning! How can I help today?";
    if (afternoon) return "🌤️ Good afternoon! What can I do for you?";
    if (evening) return "🌆 Good evening! How can I assist?";
    return "👋 Hello! How can I help today?";
  },
  thanks: () => "You’re welcome! Anything else I can help with? 🙌",
  goodbye: () => "Thanks for visiting Khisima! Have a great day. 👋",
  howareyou: () => "I’m doing great, thanks! How can I help with your project?",
  ack: () => "Got it. What else would you like to know?",
  humor: () => "😄 Haha! Now, how can I help you today?",
};

/**
 * Determine if the text is *only* a greeting (or tiny chit-chat),
 * not a real question. We reject anything that looks like an ask.
 */
function isPureGreeting(text) {
  const t = norm(text);
  if (!t) return false;

  // obvious “ask” signals — don’t treat as greeting
  if (/[?]/.test(text)) return false;
  if (hasAny(t, ["where", "what", "which", "price", "cost", "how", "when", "why"])) return false;

  const tokens = tokenize(text);
  if (tokens.length > 5) return false; // long messages aren’t “just greetings”

  // greet vocab
  const greetWords = [
    "hi", "hello", "hey", "morning", "good morning",
    "afternoon", "good afternoon", "evening", "good evening",
    "muraho", "bonjour", "salut", "habari", "mambo", "yo", "sup",
    "just greeting", "just greetings", "i was just sending my greetings"
  ];
  return hasAny(t, greetWords);
}

/**
 * Local quick answers for *very common, deterministic* intents.
 * IMPORTANT: No generic fallback. Return null if not certain.
 */
export function quickAnswer(input) {
  const t = norm(input || "");
  if (!t) return null;

  // small-talk only (strict)
  if (isPureGreeting(input)) return R.greeting(input);
  if (hasAny(t, ["thanks", "thank you", "murakoze", "merci", "asante", "thx"])) return R.thanks();
  if (hasAny(t, ["bye", "goodbye", "see you", "cheers", "ciao"])) return R.goodbye();
  if (hasAny(t, ["how are you", "how’s it going", "how are u", "how r u"])) return R.howareyou();
  if (hasAny(t, ["ok", "okay", "alright", "cool", "great", "nice"])) return R.ack();
  if (hasAny(t, ["lol", "haha", "lmao", "😂", "😅", "😆"])) return R.humor();

  // deterministic Khisima FAQs (only trigger on clear matches)
  if (hasAny(t, ["what is khisima", "about khisima", "about your company"]))
    return "Khisima is a language services & data company focused on African languages—translation/localization, language data for NLP/LLM, AI language consulting, cultural adaptation, voice-over/dubbing, and multilingual SEO.";

  if (hasAny(t, ["languages you support", "supported languages", "which languages", "language coverage"]))
    return "We support Kinyarwanda, Swahili, English, French, Amharic, Luganda, Chewa, Wolof, Oromo—and more African languages. Tell me your target pair and I’ll confirm coverage.";

  if (hasAny(t, ["pricing", "how much", "rates", "cost"]))
    return "Pricing depends on scope, languages, and turnaround. Translation is usually per word; data services are per task/hour. Share your brief and we’ll prepare a tailored quote.";

  if (hasAny(t, ["turnaround", "timeline", "delivery time", "deadline"]))
    return "Turnaround depends on volume and complexity. Standard documents may be 24–72 hours; larger/technical projects get a milestone plan.";

  if (hasAny(t, ["nda", "confidential", "privacy", "security"]))
    return "We can sign an NDA and follow secure, least-privilege access. Isolated workflows are available on request.";

  if (hasAny(t, ["voice over", "voice-over", "voiceover", "dubbing"]))
    return "We provide voice-over & dubbing: script adaptation, casting, studio recording, and QC for broadcast/online.";

  if (hasAny(t, ["seo", "multilingual seo"]))
    return "We offer multilingual SEO: local keyword research, culturally adapted content, and on-page optimization.";

  if (hasAny(t, ["careers", "job", "hiring", "internship"]))
    return "We love meeting talented linguists, annotators, and engineers. Check the Careers page or send a short intro + CV.";

  if (hasAny(t, ["quote", "estimate", "proposal", "rfp"]))
    return "Share source/target languages, volume or dataset size, domain (e.g., legal/medical), and your deadline—we’ll prepare a quote.";

  // DO NOT return a generic message here.
  return null;
}
