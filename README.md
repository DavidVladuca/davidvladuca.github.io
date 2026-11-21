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

Delivery is currently disabled through `data-delivery-enabled="false"` on `#contact-form` in `contactRO.html`, following the owner's decision to leave activation for later. The local preview validates fields and displays an unavailable message without posting to FormSubmit. No activation or test email has been sent.

To finish setup after approval, send an authorized activation request for the intended site, confirm the email received in the firm inbox, then set `data-delivery-enabled="true"`. Verify a controlled submission arrives with all five fields and that Reply-To addresses the visitor. Test errors as well as successful acceptance before publication.

The honeypot uses FormSubmit's `_honey` field. Submission feedback checks the provider's response, including activation errors. Client-side validation improves usability; FormSubmit processes submissions on the server. Local simulated responses cannot verify actual inbox delivery or provider activation.
