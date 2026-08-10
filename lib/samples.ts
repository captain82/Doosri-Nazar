// Ready-made flows so someone without their own screenshots can test Setu in
// one click. Each sample is a set of mock public-service screens (in
// public/samples/*) plus a curated title/category/description, so the run
// skips the "read your screens" step and goes straight to the walkthrough.

export interface SampleScreen {
  src: string;
  label: string;
}

export interface Sample {
  id: string;
  emoji: string;
  label: string;
  blurb: string;
  accent: string;
  title: string;
  category: string;
  description: string;
  screens: SampleScreen[];
}

export const SAMPLES: Sample[] = [
  {
    id: "doctor",
    emoji: "🩺",
    label: "Book a doctor",
    blurb: "Telemedicine · doctor, slot, ₹299 fee",
    accent: "#0E9AA7",
    title: "SehatConnect: book a doctor consultation",
    category: "telemedicine",
    description:
      "A video doctor consultation flow. The user picks a medical specialty, chooses a doctor, selects a time slot, and pays a ₹299 consultation fee by UPI before the call.",
    screens: [
      { src: "/samples/doctor/1.png", label: "Choose specialty" },
      { src: "/samples/doctor/2.png", label: "Choose doctor" },
      { src: "/samples/doctor/3.png", label: "Time slot" },
      { src: "/samples/doctor/4.png", label: "Payment" },
    ],
  },
  {
    id: "scheme",
    emoji: "📄",
    label: "Apply for a scheme",
    blurb: "Govt welfare · Aadhaar, documents",
    accent: "#1B3A6B",
    title: "Kisan Seva: farmer pension scheme application",
    category: "government scheme",
    description:
      "A government welfare application. The user reads the scheme, verifies identity with Aadhaar e-KYC over OTP, uploads land, bank and income documents, and submits with a legal declaration.",
    screens: [
      { src: "/samples/scheme/1.png", label: "Scheme" },
      { src: "/samples/scheme/2.png", label: "Aadhaar e-KYC" },
      { src: "/samples/scheme/3.png", label: "Documents" },
      { src: "/samples/scheme/4.png", label: "Review & submit" },
    ],
  },
  {
    id: "upi",
    emoji: "💸",
    label: "Send money on UPI",
    blurb: "First UPI payment · PIN, trust",
    accent: "#5B2E91",
    title: "PayNow: send money on UPI",
    category: "digital payment",
    description:
      "A first-time UPI money transfer. The user enters a mobile number and amount, authenticates with a 6-digit UPI PIN, and sees a payment receipt.",
    screens: [
      { src: "/samples/upi/1.png", label: "Send money" },
      { src: "/samples/upi/2.png", label: "UPI PIN" },
      { src: "/samples/upi/3.png", label: "Receipt" },
    ],
  },
  {
    id: "power",
    emoji: "⚡",
    label: "Pay a power bill",
    blurb: "Utility · consumer no., bill, pay",
    accent: "#E8730C",
    title: "BijliPay: pay an electricity bill",
    category: "utility bill",
    description:
      "An electricity bill payment. The user selects their state board, enters a consumer number to fetch the latest bill, reviews the amount and due date, and pays.",
    screens: [
      { src: "/samples/power/1.png", label: "Enter consumer no." },
      { src: "/samples/power/2.png", label: "Bill details" },
      { src: "/samples/power/3.png", label: "Receipt" },
    ],
  },
];
