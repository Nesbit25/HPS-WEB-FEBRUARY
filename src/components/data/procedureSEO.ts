// SEO-optimized metadata for procedure pages

export interface ProcedureSEO {
  title: string;
  h1: string;
  description: string;
  keywords: string;
  canonical: string;
  schema: {
    name: string;
    alternateName?: string;
    description: string;
    bodyLocation: string;
    procedureType: 'Surgical' | 'Noninvasive';
    preparation: string;
    followup: string;
    typicalRecoveryTime: string;
  };
  breadcrumbs: Array<{ label: string; href?: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

export const procedureSEOData: Record<string, ProcedureSEO> = {
  rhinoplasty: {
    title: "Rhinoplasty in Baton Rouge, LA | Nose Surgery by Dr. Hanemann",
    h1: "Rhinoplasty in Baton Rouge, LA",
    description: "Expert rhinoplasty and revision nose surgery in Baton Rouge by double board-certified Dr. Hanemann. Natural-looking results, specialized ethnic rhinoplasty. Serving Baton Rouge and surrounding areas.",
    keywords: "rhinoplasty Baton Rouge, nose surgery Baton Rouge, revision rhinoplasty Louisiana, ethnic rhinoplasty, nose job Baton Rouge, Dr. Hanemann rhinoplasty",
    canonical: "/procedures/rhinoplasty",
    schema: {
      name: "Rhinoplasty",
      alternateName: "Nose Surgery",
      description: "Surgical reshaping of the nose to improve facial balance, refine the bridge or tip, and in many cases improve breathing function.",
      bodyLocation: "Nose",
      procedureType: "Surgical",
      preparation: "Pre-operative consultation, medical clearance, avoid blood-thinning medications and smoking 2-3 weeks before surgery. Stop eating/drinking 8 hours before procedure.",
      followup: "Post-operative visits at 1 week (splint removal), 1 month, 3 months, 6 months, and 1 year to monitor healing and final shape development.",
      typicalRecoveryTime: "Most Baton Rouge patients return to non-strenuous work in 7–10 days. Visible swelling resolves in 2-3 weeks. Final results visible after 6–12 months as subtle swelling continues to refine."
    },
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Procedures', href: '/procedures/rhinoplasty' },
      { label: 'Rhinoplasty' }
    ],
    faqs: [
      {
        question: "How long does rhinoplasty recovery take in Baton Rouge?",
        answer: "Our patients who undergo rhinoplasty (nasal reshaping surgery) in Baton Rouge typically return to desk type work after 7 days. Internal and external splints are removed at the 1 week postop visit. The nasal skin is re-taped for another week to help with swelling. Noticeable swelling usually resolves by 2-3 weeks; however, subtle swelling continues to decrease over the next 6-12 months. We review our first set of postop photos at 3 months and our final result photos at 1 year. Dr. Hanemann will provide detailed recovery instructions at your preoperative visit to ensure optimal healing and results. After the consultation and preop visit, our patients feel well educated and well prepared for their rhinoplasty surgery."
      },
      {
        question: "How much does rhinoplasty cost in Baton Rouge?",
        answer: "Rhinoplasty cost varies depending on the complexity of the procedure and whether it is a first-time (primary) or revision rhinoplasty. At the end of your consultation at our Baton Rouge office, Dr. Hanemann will provide a quote, which is all inclusive of the surgeon's professional fee, the anesthesia provider's professional fee, the facility fee, and your postoperative care. Please call our Baton Rouge office at (225)766-2166 for more details on the cost of rhinoplasty. We offer financing options (Care-Credit) to make your procedure more accessible."
      },
      {
        question: "Does Dr. Hanemann perform ethnic rhinoplasty?",
        answer: "Yes, Dr. Hanemann has extensive training and experience with ethnic rhinoplasty, or nasal reshaping for non–white patients. Ethnic rhinoplasty can enhance the appearance of a patient's nose while preserving cultural identity."
      },
      {
        question: "What's the difference between open and closed rhinoplasty?",
        answer: "Open rhinoplasty involves a small incision across the columella (the skin bridge between the nostrils). This technique provides binocular visualization of the nasal bones, upper lateral cartilages, and tip cartilages. Closed (endonasal) rhinoplasty uses incisions inside the nose only. Dr. Hanemann will recommend the best approach based on your anatomy and goals during your Baton Rouge rhinoplasty consultation."
      },
      {
        question: "Can rhinoplasty fix breathing problems?",
        answer: "Absolutely. Many of our Baton Rouge patients seek rhinoplasty to improve both nasal appearance and nasal breathing. As the only double board certified (Otolaryngology – Head and Neck Surgery and Plastic Surgery) rhinoplasty surgeon in Baton Rouge, Dr. Hanemann is uniquely qualified to address both functional nasal issues and nasal aesthetics. If indicated, Dr. Hanemann will address the nasal septum, nasal valves, and inferior turbinates to ensure that the patient can breathe comfortably through both sides of the nose."
      },
      {
        question: "Am I a good candidate for rhinoplasty?",
        answer: "Dr. Hanemann will assess your candidacy for rhinoplasty based on your history, functional / aesthetic concerns, photographic analysis, and physical exam. Favorable candidates are in good overall health, have realistic expectations, and are bothered by the size, shape, proportions, and / or function of their nose. The ideal candidate is emotionally stable, a good listener, a good communicator, intelligent, and attractive. Facial growth should be complete (typically ages 15+ for women and 17+ for men). During your rhinoplasty consultation in Baton Rouge, Dr. Hanemann will evaluate your anatomy and discuss whether nasal surgery is right for you."
      }
    ]
  },
  
  face: {
    title: "Facelift in Baton Rouge, LA | Facial Rejuvenation by Dr. Hanemann",
    h1: "Facelift & Facial Rejuvenation in Baton Rouge, LA",
    description: "Natural facelift, neck lift, and facial rejuvenation in Baton Rouge by board-certified Dr. Hanemann. Restore youthful contours with subtle, refreshed results. Serving Baton Rouge, Prairieville, and Gonzales.",
    keywords: "facelift Baton Rouge, facial rejuvenation Baton Rouge, neck lift Louisiana, brow lift Baton Rouge, deep plane facelift, Dr. Hanemann facelift",
    canonical: "/procedures/face",
    schema: {
      name: "Facelift",
      alternateName: "Rhytidectomy",
      description: "Surgical procedure to lift and tighten facial tissues, reducing sagging skin and wrinkles to restore a more youthful appearance.",
      bodyLocation: "Face and Neck",
      procedureType: "Surgical",
      preparation: "Pre-operative consultation and medical clearance. Stop smoking 4 weeks before surgery. Avoid blood-thinning medications 2 weeks prior. Arrange for someone to drive you home and stay with you 24-48 hours post-surgery.",
      followup: "Post-operative appointments at 1 week, 2 weeks, 1 month, 3 months, 6 months, and 1 year to monitor healing and results.",
      typicalRecoveryTime: "Most patients in Baton Rouge return to light activities in 10-14 days. Swelling and bruising peak at 2-3 days and resolve significantly by 2 weeks. Full results visible in 3-6 months."
    },
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Procedures', href: '/procedures/face' },
      { label: 'Facelift' }
    ],
    faqs: [
      {
        question: "How long does a facelift last?",
        answer: "This is an interesting and challenging question that can't be accurately or honestly answered with a number of years. While the aging process continues, most Baton Rouge patients find they still look significantly younger 10 years later than if they hadn't had the procedure. We can't stop the conveyor belt of time, but we can pick you up and move your backwards on it."
      },
      {
        question: "Will a facelift look natural or overdone?",
        answer: "Dr. Hanemann specializes in natural-looking facelifts that refresh your appearance without looking 'pulled,' 'done,' or 'wind swept.' Tight skin doesn't look youthful or natural. Dr. Hanemann's technique focuses on correcting the descent of soft tissue structures by repositioning deeper tissue layers (SMAS facial fascia / platysma muscle) rather than just pulling the skin taught. Dr. Hanemann lifts the SMAS in a vertical vector and the skin in a posterolateral vector, achieving results that look natural and age gracefully."
      },
      {
        question: "What's the difference between a mini facelift and full facelift?",
        answer: "A mini facelift addresses mild to moderate jowling and neck laxity with shorter incisions, usually in front of the ears. A full facelift addresses more significant sagging throughout the face and neck and uses incision in front of and behind the ears. During your Baton Rouge consultation, Dr. Hanemann will recommend an individualized approach based on your photos, anatomy, skin / tissue quality, and aesthetic goals."
      },
      {
        question: "Can I combine a facelift with other procedures?",
        answer: "Yes. Many Baton Rouge patients are candidates for combining a facelift with eyelid surgery (blepharoplasty), browlift, or facial fat injections to restore facial volume and improve deep wrinkles. Dr. Hanemann utilizes a comprehensive approach to facial rejuvenation to achieve facial youthfulness, harmony, and balance."
      },
      {
        question: "How much does a facelift cost in Baton Rouge?",
        answer: "Facelift cost varies based on the facelift / neck lift technique selected and whether fat grafting or other procedures are performed at the same time. You will receive a quote for facelift at the time of your consultation, which is all-inclusive of the surgeon's fee, anesthesia, facility, and all of your postop care. Please call our Baton Rouge office for more details of the cost of facelift, neck lift, and facial rejuvenation. We offer financing (Care Credit) to make your facelift / neck lift more accessible."
      },
      {
        question: "What is the recovery like for a facelift?",
        answer: "After facelift in Baton Rouge, patients temporarily experience some facial swelling and a sensation of tightness. This gradually improves over the first two weeks postoperatively. We recommend that patients not plan any social events for about 2 to 3 weeks postoperatively. Most patients are ready to return to work between 2 and 3 weeks postop. Dr. Hanemann provides detailed recovery instructions and sees patients back in the office on postop days 1, 2, 7, and 14 to ensure that everything is healing optimally."
      }
    ]
  },
  
  breast: {
    title: "Breast Surgery in Baton Rouge, LA | Augmentation & Lift by Dr. Hanemann",
    h1: "Breast Procedures in Baton Rouge, LA",
    description: "Expert breast augmentation, breast lift, and breast reconstruction in Baton Rouge by Dr. Hanemann. Natural-looking results tailored to your goals. Serving Baton Rouge and surrounding Louisiana communities.",
    keywords: "breast augmentation Baton Rouge, breast lift Baton Rouge, breast surgery Louisiana, breast implants Baton Rouge, Dr. Hanemann breast surgery",
    canonical: "/procedures/breast",
    schema: {
      name: "Breast Surgery",
      alternateName: "Breast Augmentation, Mastopexy, Breast Reduction",
      description: "Surgical procedures to enhance, lift, reduce, or reconstruct the breasts, including augmentation with implants, lift (mastopexy), reduction, and reconstruction.",
      bodyLocation: "Breast",
      procedureType: "Surgical",
      preparation: "Pre-operative consultation and medical clearance. Baseline mammogram if over 40. Stop smoking 4 weeks prior. Avoid blood-thinning medications 2 weeks before surgery. Arrange post-op care at home.",
      followup: "Post-operative visits at 1 week, 2 weeks, 6 weeks, 3 months, 6 months, and 1 year. Annual follow-ups recommended for implant monitoring.",
      typicalRecoveryTime: "Most Baton Rouge patients return to desk work in 1 week. Avoid heavy lifting and strenuous activity for 4-6 weeks. Swelling resolves over 2-3 months. Final breast shape settles by 3-6 months."
    },
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Procedures', href: '/procedures/breast' },
      { label: 'Breast Surgery' }
    ],
    faqs: [
      {
        question: "What breast implant size is right for me?",
        answer: "Dr. Hanemann will help you select the ideal implant volume, width, and projection based on your aesthetic size goals, breast tissue characteristics, and breast dimensions. Dr. Hanemann will review multiple before and after photos of his own breast augmentation patients during your Baton Rouge consultation to determine which size and shape appeal to you. We can usually find patient photos with similar anatomy to yours, which will give you a more accurate idea of what your breast can look like postoperatively. We encourage patients to bring digital photos of breasts they fine attractive to convey what size they prefer."
      },
      {
        question: "How long do breast implants last?",
        answer: "Modern breast implants (4th and 5th generation devices) are designed to be long-lasting, but they're not lifetime devices. Most breast implants last 10-20 years before removal and replacement are needed. Dr. Hanemann uses physical exam and ultrasound to assess implant integrity. Future pregnancies and significant weight gain or loss (usually greater than 20 lb in a year) can cause significant changes to the breasts, which may decrease the time until a revision surgery is desired."
      },
      {
        question: "Silicone vs saline breast implants: which is better?",
        answer: "Both silicone and saline breast implants are FDA-approved, and extensive data shows that they are safe. Breast implants are among the most studied of all implantable medical devices. The plastic surgery literature includes data from tens of thousands of patients enrolled in clinical trials. Silicone implants are softer, feel more like natural breast tissue, and are the significantly more popular choice among our Baton Rouge patients. Saline implants are filled during surgery and can be placed with slightly smaller incisions. Dr. Hanemann will discuss the advantages and disadvantages of each during your consultation."
      },
      {
        question: "Can I breastfeed after breast augmentation?",
        answer: "Most women can breastfeed successfully after breast augmentation. Dr. Hanemann uses techniques that minimize disruption to milk ducts and nerves. In breast augmentation, the milk producing lobules and ductal system are not altered. Choice of incision placement (inframammary, periareolar, or transaxillary) may affect the ability to breastfeed, which we'll discuss during your Baton Rouge consultation."
      },
      {
        question: "What's the recovery time for breast augmentation?",
        answer: "Most Baton Rouge patients return to desk work in 5-7 days. You'll wear a bra except when showering for 6 weeks postoperatively. Avoid heavy lifting and chest exercises such as push ups for 6 weeks. We review our first set of before and after photos at 6 weeks postop and our final result photos at 6 months postop after implants have had an opportunity to settle and all swelling has resolved."
      },
      {
        question: "Do I need a breast lift or breast augmentation?",
        answer: "If your breasts are ptotic (sagging), and if you have enough breast tissue (volume) to make your breasts look the way you want them to in a bra, you may be a good candidate for mastopexy (breast lift) without an implant. If your breasts are ptotic and you would like to increase breast size or restore breast volume, a breast augmentation with implant placement and a mastopexy can be done at the same time. The implant adds volume (size) to the breast, and the mastopexy (breast lift) repositions and reshapes the breast."
      },
      {
        question: "What makes Dr. Hanemann's mastopexy (breast lift) different or special?",
        answer: "Dr. Hanemann performs the vertical mastopexy, a technique which avoids the anchor scar across the entire inframmary fold below the breast. The scar patten is a circle around the areola connected to a vertical line below. This technique avoids \"bottoming out\" and eventual elevation of the inframammary fold scar, which is commonly seen in Wise pattern / anchor scar breast lifts and reductions because it relies on a stretchy \"skin brassiere\" to support the breast tissues over time. Breast shape after a traditional anchor scar technique is wide, flat (deprojected), and boxy. Breast shape after the vertical technique is rounder, curvier, narrower, and more projecting (increased distance from the plane of the chest to the nipple). Dr. Hanemann also performs the \"autoaugmentation\" vertical breast lift, which transposes your own tissue from the sagging bottom part of the breast to the upper part of the breast to preserve volume and optimize shape, all with your own tissue."
      },
      {
        question: "What about fat grafting to the breasts?",
        answer: "In select patients, Dr. Hanemann will augment breast volume and contour with autologous fat injections, which are obtained by performing liposuction of and area such as the flanks, thighs, or abdomen. These patients have the advantage of improving the contour of the breasts and the liposuctioned areas at the same time. Fat grafting is a useful tool to improve contour transitions and enhance breast shape, but it cannot enlarge the breasts as much as an implant can."
      },
      {
        question: "What if my breasts sag and they're too large?",
        answer: "If your breasts are ptotic (sagging) and too large, a breast lift with volume reduction (breast reduction) may be the right procedure for you. This procedure will lift your breasts and make them smaller at the same time. Removing excess tissue from the breasts increases the longevity of your result because your skin and breast tissues no longer have to support so much weight. Dr. Hanemann also performs the vertical technique (short scar) for breast reductions to optimize breast shape, projection, and overall appearance. Breast reduction also improves problems such as neck and back pain, bra shoulder strap grooving, moisture underneath the breasts, and not being able to find bras and tops that fit well."
      }
    ]
  },
  
  body: {
    title: "Body Contouring in Baton Rouge, LA | Tummy Tuck & Liposuction by Dr. Hanemann",
    h1: "Body Contouring in Baton Rouge, LA",
    description: "Expert tummy tuck, liposuction, and body contouring in Baton Rouge by Dr. Hanemann. Sculpt your body after weight loss or pregnancy. Serving Baton Rouge, Denham Springs, and surrounding areas.",
    keywords: "tummy tuck Baton Rouge, liposuction Baton Rouge, body contouring Louisiana, mommy makeover Baton Rouge, abdominoplasty Baton Rouge, Dr. Hanemann body surgery",
    canonical: "/procedures/body",
    schema: {
      name: "Body Contouring",
      alternateName: "Tummy Tuck, Abdominoplasty, Liposuction, Body Lift",
      description: "Surgical procedures to reshape and contour the body, including tummy tuck (abdominoplasty), liposuction, body lift, and mommy makeover procedures.",
      bodyLocation: "Abdomen, Flanks, Thighs, Arms, Back",
      procedureType: "Surgical",
      preparation: "Pre-operative consultation and medical clearance. Achieve stable weight before surgery. Stop smoking 6 weeks prior. Avoid blood-thinning medications 2 weeks before. Arrange for assistance at home during recovery.",
      followup: "Post-operative visits at 1 week, 2 weeks, 4 weeks, 3 months, 6 months, and 1 year to monitor healing, scar maturation, and final contour.",
      typicalRecoveryTime: "Most Baton Rouge patients return to light activities in 2-3 weeks. Avoid heavy lifting and strenuous exercise for 6-8 weeks. Compression garments worn for 6-8 weeks. Full results visible in 3-6 months as swelling resolves."
    },
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Procedures', href: '/procedures/body' },
      { label: 'Body Contouring' }
    ],
    faqs: [
      {
        question: "How long is tummy tuck recovery in Baton Rouge?",
        answer: "Tummy tuck (abdominoplasty) is one of our highest satisfaction procedures. Since 2013, Dr. Hanemann has injected Exparel (liposomal bupivacaine) for his abdominoplasty patients to significantly decrease postop pain and make walking and overall recovery much easier. Most patients return to work at a desk job within 2 week. Some patients feel up to working from home at 1 week postop. We recommend avoiding lifting >10 lb for 1 week and > 20 lb for 2 weeks. You should wait to resume abdominal muscle / core exercises for 6-8 weeks. You'll wear a compression garment for 6 weeks. Dr. Hanemann and his nurses provide detailed recovery instructions and close follow-up care. We see all tummy tuck patients in our Baton Rouge office the following day, at 1 week postop, and at 2 weeks postop."
      },
      {
        question: "When can I return to work after abdominoplasty?",
        answer: "This depends on the physical demands required by your job. Patients typically return to a desk job within 2 weeks. Physical jobs which entail lifting or climbing may require 4-6 weeks off. Dr. Hanemann will provide a personalized timeline based on your individualized procedure and job requirements."
      },
      {
        question: "What's the difference between a tummy tuck and liposuction?",
        answer: "Liposuction removes excess fat but doesn't address excess skin or separated abdominal muscles. A tummy tuck removes excess skin, tightens muscles, and removes some fat. Many patients benefit from both procedures combined for optimal body contouring. Dr. Hanemann will recommend the best approach during your consultation in our Baton Rouge office based on your anatomy and physical exam."
      },
      {
        question: "Can I have a tummy tuck after pregnancy?",
        answer: "Yes. We recommend waiting until you're done having children to undergo abdominoplasty, as future pregnancy can negatively affect results. It's preferable to wait at least 6 months after childbirth and to achieve a stable weight before undergoing a tummy tuck. Many Baton Rouge mothers combine tummy tuck with breast procedures as part of a 'mommy makeover.'"
      },
      {
        question: "How much does tummy tuck / body contouring cost in Baton Rouge?",
        answer: "Costs vary depending on which procedures are performed (tummy tuck, liposuction, thigh lift, etc.) and whether multiple procedures are combined. Dr. Hanemann provides detailed pricing during your consultation, and we offer financing (Care-Credit) to make your transformation more accessible. Please call our Baton Rouge office at (225)766-2166 for information about tummy tuck and body contouring pricing."
      },
      {
        question: "What do your belly button scars look like?",
        answer: "Many women are nervous about what their belly button (umbilical) scar will look like after abdominoplasty. Dr. Hanemann takes multiple steps during a tummy tuck to ensure that the belly button will look natural and unoperated. A natural \"innie\" belly button with a concealed scar is the hallmark of a beautifully done tummy tuck. We encourage you to look at Dr. Hanemann's before and after tummy tuck photos so you can see these results for yourself."
      }
    ]
  }
};

// Helper function to get SEO data for a procedure type
export function getProcedureSEO(procedureType: 'nose' | 'face' | 'breast' | 'body'): ProcedureSEO {
  const seoMap: Record<string, string> = {
    'nose': 'rhinoplasty',
    'face': 'face',
    'breast': 'breast',
    'body': 'body'
  };
  
  const seoKey = seoMap[procedureType] || procedureType;
  return procedureSEOData[seoKey];
}