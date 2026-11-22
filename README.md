# Law Firm Website  

A professional website built for a law firm during my internship at **RSTDEV S.R.L.** (Aug–Sep 2023).  
I was responsible for both the **design** and the **full implementation**, managing the project independently with guidance from mentors.  
You can access it [here](https://davidvladuca.github.io/indexRO.html)

---

## 🚀 Features  
- Responsive design for desktop and mobile  
- Informational pages (services, about, contact)  
- Contact form prepared for FormSubmit email delivery (activation pending)
- SEO-friendly structure
<img width="1900" height="951" alt="image" src="https://github.com/user-attachments/assets/007d519d-bd8c-4996-ae8a-087f1689b6c3" />

---

## 🛠️ Tech Stack  
- **Frontend:** HTML, CSS, JavaScript, 
- **Form delivery:** FormSubmit, compatible with static GitHub Pages hosting
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


## Contact-form setup

The form uses [FormSubmit AJAX](https://formsubmit.co/ajax-documentation) and is prepared for `infoavocati@yahoo.com`. There are no client-side API keys.

On 22 November 2026, the owner authorized enabling delivery and requesting activation for `infoavocati@yahoo.com`. The local form now has `data-delivery-enabled="true"`. These changes are not deployed yet. Mail delivery still depends on the inbox owner completing FormSubmit's confirmation and on a real message reaching the inbox.

One authorized activation/test request was made from the intended site origin, `https://infoavocati.ro`, on 22 November 2026. FormSubmit returned HTTP 200 with `success: "false"` and reported sending an activation email to `infoavocati@yahoo.com`. The form correctly displayed an unavailable notice and retained the message; no enquiry delivery was confirmed.

The owner has asked to continue when his mother sees the email. Do not repeat the activation request while confirmation is pending. After she clicks **Activate Form** and the owner confirms this, send one controlled delivery test and verify it reaches Yahoo with all five fields and the intended Reply-To. These changes remain local; the published form has not been enabled or redeployed as part of this work.

A provider activation notice is shown as unavailable, never as successful message delivery. Rate limits and network/provider errors preserve entered values for retry. Setting `data-delivery-enabled="false"` disables requests if needed.

The honeypot uses FormSubmit's `_honey` field. Submission feedback checks the provider's response, including activation errors. Client-side validation improves usability; FormSubmit processes submissions on the server. Local simulated responses cannot verify actual inbox delivery or provider activation.

Local checks passed 37 cases at 320, 390, and 1440 px, covering validation, floating errors without layout shifts, both accepted-response formats, activation pending, rate limits, provider and connection errors, malformed responses, timeouts, duplicate-submit prevention, trimmed UTF-8 payloads, Reply-To, honeypot blocking, and the no-JavaScript contact fallback. All test requests were intercepted before the separately authorized real activation request. The notification close control has a 44 px touch target; the approved field, footer, and notification designs are retained.
