# Law Firm Website  

A professional website built for a law firm during my internship at **RSTDEV S.R.L.** (Aug–Sep 2023).  
I was responsible for both the **design** and the **full implementation**, managing the project independently with guidance from mentors.  
You can access it [here](https://davidvladuca.github.io/indexRO.html)

---

## 🚀 Features  
- Responsive design for desktop and mobile  
- Informational pages (services, about, contact)  
- Contact form prepared for Formspree email delivery
- SEO-friendly structure
<img width="1900" height="951" alt="image" src="https://github.com/user-attachments/assets/007d519d-bd8c-4996-ae8a-087f1689b6c3" />

---

## 🛠️ Tech Stack  
- **Frontend:** HTML, CSS, JavaScript, 
- **Form delivery:** Formspree, compatible with static GitHub Pages hosting
- **Other:** Figma
<img width="1401" height="836" alt="image" src="https://github.com/user-attachments/assets/52d0fb8e-c5db-48d8-90db-616db0166daf" />


---

## 📖 About the Project  
This project was developed as part of my internship, with regular feedback sessions and progress tracking with supervisors.  
The website is currently used as the official online presence of the law firm.  

---

## 👨‍💻 Role  
- Designed and implemented the website from scratch  
- Managed all development independently with mentorship support  
- Delivered a fully functional and deployed product  


## English version and page metadata

Stage 5 adds eleven static English pages, starting at `indexEN.html`. Each interior page has the same filename as its Romanian counterpart with `EN` in place of `RO`. Both versions use the existing stylesheets, photographs, logos, library animation, and trailer. Language switches keep the current page or practice area, and English navigation and practice-area links stay in English.

Page copy, navigation, image descriptions, form labels, required-field help, fee factors, partner controls, quotations, and trailer controls have English versions. Shared messages are in `js/i18n.js`; the document language selects the catalogue. Form delivery targets `infoavocati@yahoo.com` through the shared Formspree setup described below.

Each content page has a distinct title and description, a canonical URL, the existing favicon, and reciprocal `ro`, `en`, and `x-default` language associations. Romanian home links open the main homepage directly. The existing `indexRO.html` redirect remains available for old links, with a dark background to avoid a white flash. See [Google’s language-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

For local review, open `http://127.0.0.1:8631/indexEN.html`, then use RO/EN on Home, About Us, Partners, Legal Services, Contact, and all six practice-area pages. Check the phone layout, both fee categories, the Partners carousel, and the English trailer controls. Keep provider requests intercepted during QA; the separately controlled real Formspree test and owner-confirmed Yahoo receipt are recorded below.

Local verification passed 22 content-page metadata/link checks, 88 English layout cases, all eleven language-switch pairs, both languages’ fee and partner controls, ten intercepted form-response scenarios, and the English homepage/trailer flow. An existing homepage overflow at a 320 px viewport with 200% root text sizing occurs in both RO and EN and is recorded for Stage 6. Physical phone checks remain outstanding.

## Mobile trailer landscape view

On phone layouts, a subtle landscape/fullscreen control appears alongside Play and Mute once the trailer starts. It is available in both languages and hidden at desktop sizes. The existing library entrance, player controls, trailer file, and return fade are retained.

The control requests fullscreen and landscape orientation when the browser supports them. Otherwise, it rotates only the inner player, including its controls; the homepage and navbar are never transformed. Physical phone rotation is handled without applying an extra rotation to an already-landscape viewport. The complete video frame is retained in this mode.

Finishing the trailer or closing it clears the player rotation, requests portrait before releasing an owned orientation lock, and exits owned fullscreen before returning to the library. Back/Escape, manual fullscreen exit, rejected APIs, delayed fullscreen/orientation requests, and reduced-motion playback also clean up. No orientation lock is retained by the website after the player closes. Browsers and operating systems can refuse forced orientation; after unlock, the page follows the device’s normal orientation. Actual iPhone/Safari and Android/Chrome testing remains outstanding.

The implementation is in `js/trailer-mobile.js`, loaded before the homepage player. Local verification covered 19 rotation/cleanup scenarios and unchanged desktop geometry at 1024, 1440, and 1920 px. Native fullscreen was exercised in desktop Edge with emulated phone dimensions; orientation-lock success and delayed responses were simulated. No media asset, library-camera script, Formspree setup, or unrelated page content was changed. The mobile background also fills the area behind the navbar so its fade reveals a continuous library image. Eight RO/EN mobile entrance, rotation, and return checks passed, together with two unchanged desktop layout comparisons.

## Contact-form setup

The Romanian and English forms use the same [Formspree](https://formspree.io/) endpoint, `https://formspree.io/f/xgakpwkw`. Configuration is shared in `js/contact-config.js`, loaded before `js/contact.js`. The endpoint is public and is not an API key. The `enabled` setting controls real requests independently of the approved form design. A missing or invalid endpoint sends nothing and offers direct email/phone contact instead.

The intended recipient is **infoavocati@yahoo.com**. The owner may sign in to Formspree with a different personal email. The Yahoo address must be linked and verified in the account, then selected in **Workflow → Email**. The recipient is configured in Formspree, not in the browser payload. See [Changing a form email address](https://help.formspree.io/articles/form-and-project-settings/changing-a-form-email-address).

Both languages retain the same five required fields, limits, labels, validation, floating field explanations, and fixed feedback notifications. Payloads contain `name`, `email`, `phone`, `subject`, `message`, and the empty `_gotcha` honeypot. Formspree uses the visitor’s `email` as Reply-To and `subject` as the notification subject; there are no FormSubmit-specific `_subject`, `_replyto`, or `_template` settings. See [Special fields](https://help.formspree.io/articles/building-your-form/special-fields) and [Honeypot filtering](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering).

The handler accepts success only after Formspree confirms the request. Service errors, inactive/missing forms, invalid provider responses, and connection failures retain the entered message. Provider field errors appear with the existing red highlights and translated floating help; editing the rejected field clears its server error. Rate-limit feedback also covers submission quotas without promising that waiting a few minutes will reset the monthly allowance. Submitting again while a request is pending is prevented.

On 22 November 2026, 36 intercepted form cases and six layout cases passed across RO/EN and 320, 390, and 1440 px. The original field layout, visible page wording, stylesheets, and unrelated source files are preserved. JavaScript syntax and whitespace checks passed. All simulated requests were intercepted; no FormSubmit request occurred.

One separately controlled real technical submission was made from the `https://infoavocati.ro` origin in an isolated browser. Formspree returned HTTP 200 with `{"next":"/thanks?language=en","ok":true}` and the handler showed success. Its subject starts **TEST TEHNIC Formspree infoavocati.ro**. The owner then confirmed that it appeared in Formspree Submissions and was received in Yahoo. The shared configuration is enabled for both languages. No additional real test was sent.

Account setup and real delivery are checked separately from simulated responses. Dashboard visibility and Yahoo receipt are owner-confirmed; the five-field payload was captured, and Formspree’s documented `email` field supplies Reply-To. Received email headers have not been independently inspected. A successful API response by itself confirms acceptance, not inbox receipt. The free plan currently allows 50 submissions per month and 30 days of dashboard history; see [Account limits](https://help.formspree.io/articles/account-management/account-limits).

The previous FormSubmit connection is retired after two authorized activation attempts produced activation-required responses but neither activation email was received. Do not resend FormSubmit activation, run the old activation scripts, or reintroduce its endpoint.

## Publication

GitHub Pages publishes the repository root of `2026-version` at `https://infoavocati.ro/`. Approved releases are merged into `main` and advanced to `2026-version`; pushing the publishing branch starts the Pages build. The English release includes the approved mobile reading and practice-link refinements, confirmed Formspree delivery, trailer rotation, and continuous mobile library background.

## Page transitions

The approved option 1 adds restrained content entrances on interior pages and a short fade through black when entering either homepage language. For local review, open `http://127.0.0.1:8631/` and use the navigation links and browser Back/Forward on desktop and phone layouts. The implementation branch is `codex/page-transitions`.

The shared `css/page-transitions.css` and `js/page-transitions.js` use browser-native transitions when available, with a home-fade fallback otherwise. Interior headings and the first content section enter over about 400 ms; later content groups reveal once as they enter view. Movement is 10 px on phones and 16 px on larger screens. The navbar does not slide. An outgoing mobile menu is cleared before its page snapshot, preventing its gold panel from lingering over the destination. Entering Home fades out over 180 ms and reveals the library over 420 ms, with no wait for the loop video.

Ordinary navigation, language links, modified clicks, downloads, same-page anchors, and browser history keep their normal behavior. Restored pages retain their reading position. Focus immediately reveals a hidden group; reduced motion, printing, missing observation APIs, and disabled JavaScript keep content available. The fallback home cover has a timed recovery and waits at most 800 ms for the library poster.

To prepare the photographs sooner, `images/optimized` contains 960 px and 1920 px WebP copies of the same sixteen background photographs and six practice-page photographs. Media queries and responsive image sources select the appropriate copy, banner images receive preload priority, and existing image elements now reserve their intrinsic dimensions. Original assets are retained. The existing layout, image framing, text, logos, trailer file, library-camera code, and contact handler/configuration are preserved. The remaining Stage 6 work is separate from this change.

Local verification matched eighteen layout baselines and passed forty additional RO/EN template checks, four native navigation/contact/history flows, seven fallback/accessibility cases, four final scroll-reveal cases, and both language trailer flows. Four contact submissions were intercepted during QA; no real email was sent. In four simulated cold mobile loading cases, the banner images were ready before the first content paint. Physical-device checks remain outstanding.
