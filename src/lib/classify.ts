import type { SortTicketResponse } from "./schema";
type CaseType = SortTicketResponse["case_type"];
type Severity = SortTicketResponse["severity"];
type Department = SortTicketResponse["department"];

export interface Classification {
  case_type: CaseType;
  severity: Severity;
  department: Department;
  confidence: number;
}

const departmentMap: Record<CaseType, (message: string) => Department> = {
  wrong_transfer: () => "dispute_resolution",
  payment_failed: () => "payments_ops",
  refund_request: (message) => {
    const contested =
      /disputed|unauthorized|didn't authorize|did not authorize|not authorized|fraud/i.test(
        message,
      );
    return contested ? "dispute_resolution" : "customer_support";
  },
  phishing_or_social_engineering: () => "fraud_risk",
  other: () => "customer_support",
};

const phishingKeywords = [
  /otp/i,
  /\bpincode\b/i,
  /\bpin\b/i,
  /\bpassword\b/i,
  /ask for my/i,
  /called asking/i,
  /is that bkash/i,
  /verification code/i,
  /card number/i,
  /mpin\b/i,
  /secret code/i,
  /security code/i,
  /request.*(?:otp|pin|password)/i,
  /(?:otp|pin|password).*request/i,
  /সিকিউরিটি কোড/i,
  /পিন\b/i,
  /পাসওয়ার্ড/i,
  /ওটিপি/i,
  /ভেরিফিকেশন কোড/i,
];

const wrongTransferKeywords = [
  /wrong (?:number|recipient|account|person|send(?:er|ing)?)/i,
  /sent (?:to|the) wrong/i,
  /send.*wrong (?:number|account|person)/i,
  /transferred.*wrong/i,
  /wrongly (?:sent|transferred|send)/i,
  /ভুল (?:নম্বর|অ্যাকাউন্ট|ব্যক্তি)/i,
  /ভুল.*(?:পাঠান|টাকা|সেন্ড)/i,
];

const paymentFailedKeywords = [
  /(?:payment|transaction) (?:failed|declined|unsuccessful)/i,
  /failed (?:payment|transaction)/i,
  /deducted (?:but|and) (?:not|no)/i,
  /money (?:gone|deducted|cut) (?:but|and)/i,
  /balance (?:deducted|cut|gone) (?:but|and)/i,
  /money (?:is|was) (?:gone|deducted)/i,
  /amount (?:deducted|cut)/i,
  /টাকা (?:কেটেছে|কাটা|গেছে) (?:কিন্তু|হয়নি)/i,
  /পেমেন্ট (?:ব্যর্থ|ফেল|হয়নি)/i,
  /লেনদেন (?:ব্যর্থ|failed)/i,
  /টাকা.*কেটেছে.*(?:কিন্তু|পায়নি)/i,
];

const refundKeywords = [
  /\brefund\b/i,
  /changed my mind/i,
  /want.*money.*back/i,
  /money back/i,
  /give.*back.*money/i,
  /cancel.*(?:transaction|payment)/i,
  /return.*money/i,
  /টাকা (?:ফেরত|ফিরিয়ে|ফিরিয়ে দিন)/i,
  /রিফান্ড/i,
  /ক্যান্সেল/i,
];

export function classify(message: string, _locale?: string): Classification {
  const msg = message;

  // Priority 1: Phishing/social engineering (critical)
  for (const pattern of phishingKeywords) {
    if (pattern.test(msg)) {
      return {
        case_type: "phishing_or_social_engineering",
        severity: "critical",
        department: departmentMap.phishing_or_social_engineering(msg),
        confidence: 0.9,
      };
    }
  }

  // Priority 2: Wrong transfer
  for (const pattern of wrongTransferKeywords) {
    if (pattern.test(msg)) {
      return {
        case_type: "wrong_transfer",
        severity: "high",
        department: departmentMap.wrong_transfer(msg),
        confidence: 0.9,
      };
    }
  }

  // Priority 3: Payment failed
  for (const pattern of paymentFailedKeywords) {
    if (pattern.test(msg)) {
      return {
        case_type: "payment_failed",
        severity: "high",
        department: departmentMap.payment_failed(msg),
        confidence: 0.9,
      };
    }
  }

  // Priority 4: Refund request
  for (const pattern of refundKeywords) {
    if (pattern.test(msg)) {
      const contested =
        /disputed|unauthorized|didn't authorize|did not authorize|not authorized|fraud/i.test(
          msg,
        );
      const severity = contested ? "high" : "low";
      return {
        case_type: "refund_request",
        severity: severity as Severity,
        department: departmentMap.refund_request(msg),
        confidence: contested ? 0.6 : 0.9,
      };
    }
  }

  // Priority 5: Other / no match
  return {
    case_type: "other",
    severity: "low",
    department: departmentMap.other(msg),
    confidence: 0.4,
  };
}
