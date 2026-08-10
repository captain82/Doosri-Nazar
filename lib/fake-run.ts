import type { RunReport } from "./types";

// Hardcoded sample report. The results page reads this until the real
// pipeline exists, swapping it for a fetch is a one-line change.
//
// load_seconds follows the real formula: bytes / throughput, where throughput
// is 1.5MB/s (5G), 400KB/s (4G), 100KB/s (Weak 4G), 12KB/s (Throttled).

export const FAKE_REPORT: RunReport = {
  id: "demo",
  title: "Sehat Sathi: doctor consultation booking",
  description:
    "A telemedicine flow for booking a video consultation with a doctor. Users pick a doctor, choose a slot, optionally upload medical records, and pay ₹299 by UPI before the call.",
  status: "done",
  created_at: "2026-08-07T10:30:00Z",
  screens: [
    { id: "s1", position: 1, label: "Phone Login", storage_path: null, width: 1080, height: 2280, bytes: 210_000 },
    { id: "s2", position: 2, label: "Choose Doctor", storage_path: null, width: 1080, height: 2280, bytes: 480_000 },
    { id: "s3", position: 3, label: "Time Slot", storage_path: null, width: 1080, height: 2280, bytes: 150_000 },
    { id: "s4", position: 4, label: "Upload Records", storage_path: null, width: 1080, height: 2280, bytes: 190_000 },
    { id: "s5", position: 5, label: "Payment", storage_path: null, width: 1080, height: 2280, bytes: 260_000 },
  ],
  personas: [
    {
      id: "p1",
      name: "Ramesh Yadav",
      age: 46,
      language: "Bhojpuri, some Hindi",
      device: "Redmi 9A",
      connection: "Throttled",
      context: "First smartphone in 2024 · reads Hindi slowly · has never paid online",
      initials: "RY",
      outcome: "dropped",
      dropped_at_screen: 3,
      steps: [
        {
          id: "p1-1", screen_id: "s1", position: 1, status: "friction",
          narrative:
            "The OTP arrived after the 30-second countdown had already expired. He tapped resend twice and got locked out for a minute, unsure if he had done something wrong.",
          suggestion: "Give the OTP window 90 seconds and never punish resend, on a throttled connection the SMS itself is the slow part.",
          metrics: { load_seconds: 7.0 },
        },
        {
          id: "p1-2", screen_id: "s2", position: 2, status: "friction",
          narrative:
            "Doctor photos loaded one by one over 16 seconds. For most of that the screen was blank cards, and he assumed the app was broken and pressed back twice before it filled in.",
          suggestion: "Show doctor names and fees as text first; let photos arrive late. Something readable within 3 seconds.",
          metrics: { load_seconds: 16.0 },
        },
        {
          id: "p1-3", screen_id: "s3", position: 3, status: "dropped",
          narrative:
            "Slots were shown as 14:00 and 16:30. He reads time as morning or evening, not on a 24-hour clock, and could not tell whether 14:00 was day or night. With ₹299 at stake for the wrong answer, he closed the app.",
          suggestion: "Say \"2:00 dopahar\", write times as morning/afternoon/evening in the user's language, never 24-hour.",
          metrics: { load_seconds: 5.0 },
        },
      ],
    },
    {
      id: "p2",
      name: "Lakshmi Narsamma",
      age: 58,
      language: "Telugu only",
      device: "Samsung J2 (son's old phone)",
      connection: "Throttled",
      context: "Cannot read English · navigates by icons and colour · son usually helps",
      initials: "LN",
      outcome: "dropped",
      dropped_at_screen: 2,
      steps: [
        {
          id: "p2-1", screen_id: "s1", position: 1, status: "ok",
          narrative:
            "She recognised the phone-number field from the telephone icon and typed her number. Her son has walked her through OTP screens before, so she copied the code across without reading the labels.",
          suggestion: null,
          metrics: { load_seconds: 7.0 },
        },
        {
          id: "p2-2", screen_id: "s2", position: 2, status: "dropped",
          narrative:
            "The doctor list is entirely in English, \"General Physician\", \"Dermatology\", with no Telugu anywhere and no language switch she could find. None of the words meant anything to her. She closed the app and decided to phone her son instead.",
          suggestion: "Ask for language on the first screen and translate specialty names into plain words: \"skin doctor\", not \"Dermatology\".",
          metrics: { load_seconds: 16.0 },
        },
      ],
    },
    {
      id: "p3",
      name: "Arjun Kumar",
      age: 22,
      language: "Hindi + English",
      device: "Realme Narzo",
      connection: "5G",
      context: "Booking for his grandfather 400 km away · operates every app for the family",
      initials: "AK",
      outcome: "dropped",
      dropped_at_screen: 5,
      steps: [
        {
          id: "p3-1", screen_id: "s1", position: 1, status: "friction",
          narrative:
            "He registered with his grandfather's number so the records stay linked, but the OTP went to a phone 400 km away. He had to call his grandfather and have the code read out before it expired. It took three tries.",
          suggestion: "Let people book for someone else: a caregiver flow, or OTP to the operator's own number.",
          metrics: { load_seconds: 0.5 },
        },
        {
          id: "p3-2", screen_id: "s2", position: 2, status: "ok",
          narrative: "Found a cardiologist in under a minute and compared fees across three doctors before choosing.",
          suggestion: null,
          metrics: { load_seconds: 1.2 },
        },
        {
          id: "p3-3", screen_id: "s3", position: 3, status: "ok",
          narrative: "Reads 24-hour time without thinking about it. Picked 16:30 for after his grandfather's nap.",
          suggestion: null,
          metrics: { load_seconds: 0.4 },
        },
        {
          id: "p3-4", screen_id: "s4", position: 4, status: "ok",
          narrative:
            "Uploaded the ECG report PDF the hospital had sent on WhatsApp. The \"PDF only\" label nearly stopped him, most of his grandfather's records are photos of paper.",
          suggestion: null,
          metrics: { load_seconds: 0.5 },
        },
        {
          id: "p3-5", screen_id: "s5", position: 5, status: "dropped",
          narrative:
            "₹299 due upfront by UPI, with nothing anywhere about what happens if the doctor doesn't join or how a refund works. It's his own money spent on someone else's behalf. He closed the app to ask the family first, and the slot will be gone by the time they decide.",
          suggestion: "One line under the pay button: \"Doctor doesn't join? Money back the same day.\" Or let them pay after the call.",
          metrics: { load_seconds: 0.7 },
        },
      ],
    },
    {
      id: "p4",
      name: "Farhan Sheikh",
      age: 33,
      language: "Urdu + Hindi",
      device: "Vivo Y12 (shared with wife)",
      connection: "Weak 4G",
      context: "Gig driver · fluent in WhatsApp and YouTube · wary of online payments",
      initials: "FS",
      outcome: "struggled",
      dropped_at_screen: null,
      steps: [
        {
          id: "p4-1", screen_id: "s1", position: 1, status: "ok",
          narrative: "Logged in on the second try. OTP flows are familiar territory from delivery apps.",
          suggestion: null,
          metrics: { load_seconds: 1.8 },
        },
        {
          id: "p4-2", screen_id: "s2", position: 2, status: "ok",
          narrative: "Sorted by fee and picked the cheapest general physician. Didn't read the qualifications, the fee was the only number that mattered.",
          suggestion: null,
          metrics: { load_seconds: 4.0 },
        },
        {
          id: "p4-3", screen_id: "s3", position: 3, status: "friction",
          narrative:
            "The slot list showed only times, 16:30, 18:00, with no date. He wanted evening after his shift but couldn't tell if 18:00 meant today or tomorrow, and booked the wrong day's slot before catching it on the confirmation line.",
          suggestion: "Put the date on every slot, not just in the header. \"Aaj, 6:00 shaam\" removes the guess.",
          metrics: { load_seconds: 1.3 },
        },
        {
          id: "p4-4", screen_id: "s4", position: 4, status: "friction",
          narrative:
            "The upload asks for a PDF. His wife's reports are photos in the phone gallery, he doesn't have \"files\", he has photos. There was no camera or gallery option, so he skipped the step worried the doctor would go in blind.",
          suggestion: "Accept gallery photos and add a \"take photo of the paper\" camera option. PDF is a city assumption.",
          metrics: { load_seconds: 1.6 },
        },
        {
          id: "p4-5", screen_id: "s5", position: 5, status: "friction",
          narrative:
            "He paid by UPI, then the confirmation screen sat on a spinner long enough that he nearly paid a second time. The confirmation SMS arriving was the only thing that stopped him.",
          suggestion: "Show \"payment received\" the instant the UPI callback lands, even if the booking is still writing.",
          metrics: { load_seconds: 2.2 },
        },
      ],
    },
    {
      id: "p5",
      name: "Priya Sharma",
      age: 27,
      language: "Hindi + English",
      device: "OnePlus Nord",
      connection: "4G",
      // (Priya stays on solid 4G, the comfortable end of the spread)
      context: "School teacher in a district town · comfortable online · books everything herself",
      initials: "PS",
      outcome: "completed",
      dropped_at_screen: null,
      steps: [
        {
          id: "p5-1", screen_id: "s1", position: 1, status: "ok",
          narrative: "In within fifteen seconds. Nothing to report.",
          suggestion: null,
          metrics: { load_seconds: 0.5 },
        },
        {
          id: "p5-2", screen_id: "s2", position: 2, status: "ok",
          narrative: "Chose a female general physician, the filter for that existed and she found it, which she noted approvingly.",
          suggestion: null,
          metrics: { load_seconds: 1.2 },
        },
        {
          id: "p5-3", screen_id: "s3", position: 3, status: "friction",
          narrative:
            "Only four slots over the next three days, all between 11:00 and 15:00, the middle of her school day. She nearly gave up before finding a 14:30 on her lunch break.",
          suggestion: "Working people need evening slots. If there are none, say when they open up instead of showing an empty midday grid.",
          metrics: { load_seconds: 0.4 },
        },
        {
          id: "p5-4", screen_id: "s4", position: 4, status: "ok",
          narrative: "Had a lab report as a PDF already and uploaded it without friction.",
          suggestion: null,
          metrics: { load_seconds: 0.5 },
        },
        {
          id: "p5-5", screen_id: "s5", position: 5, status: "ok",
          narrative: "Paid by UPI in one pass. She did glance for a refund policy and didn't find one, but paid anyway.",
          suggestion: null,
          metrics: { load_seconds: 0.7 },
        },
      ],
    },
  ],
};
