// Shared types, constants and stock media for the Castle Tire Shop demo.
// There is no database: all records live in the browser (see src/lib/store.tsx).

export type Corner = "LF" | "RF" | "LR" | "RR";
export type Section = "tires" | "brakes" | "suspension" | "alignment" | "tpms";
export type MediaSection = Section | "general";
export type Grade = "good" | "soon" | "replace";
export type RotorGrade = "good" | "worn" | "replace";
export type OkRec = "ok" | "rec";
export type Priority = "ok" | "soon" | "future" | "now";
export type Light = "green" | "blue" | "yellow" | "red" | "none";
export type SuspensionPart = "Inner Tie Rod" | "Outer Tie Rod" | "Control Arm" | "Shock" | "Strut" | "Other";
export type AlignmentPrice = 79 | 89 | 99 | 120;

export const JOB_STATUSES = [
  "waiting",
  "accepted",
  "inspection",
  "inspection_complete",
  "customer_contacted",
  "approved",
  "completed",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  waiting: "Waiting",
  accepted: "Accepted",
  inspection: "Inspection",
  inspection_complete: "Inspection Complete",
  customer_contacted: "Customer Contacted",
  approved: "Approved",
  completed: "Completed",
};

export type Member = { id: string; name: string; role: string; initials: string };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  since: string;
};

export type Vehicle = {
  id: string;
  customerId: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  color: string;
  plate: string;
  mileage: number;
  vin: string;
  photo?: string;
};

export type TimelineEntry = { status: JobStatus; at: string; by: string };

export type Job = {
  id: string;
  date: string;
  time: string;
  customerId: string;
  vehicleId: string;
  complaint: string;
  status: JobStatus;
  assignedTo: string | null;
  mileageIn: number;
  timeline: TimelineEntry[];
};

export type TireCorner = { tread: number | null; grade: Grade | null };
export type BrakeAxle = { pad: number | null; rotor: RotorGrade | null };

export type Inspection = {
  jobId: string;
  techId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  tireSize: string;
  tireBrand: string;
  tires: Record<Corner, TireCorner>;
  brakes: { front: BrakeAxle; rear: BrakeAxle };
  tpms: { status: OkRec | null; tpmNumber: string; psi: Record<Corner, number | null> };
  suspension: { status: OkRec | null; parts: SuspensionPart[]; other: string };
  alignment: { status: OkRec | null; package: AlignmentPrice | null };
  notes: Record<Section, string>;
  additionalNotes: string;
  recommended: Record<Section, Priority | null>;
};

export type Media = {
  id: string;
  jobId: string;
  vehicleId: string;
  section: MediaSection;
  item?: string;
  type: "photo" | "video";
  url: string;
  poster?: string;
  caption: string;
  takenAt: string;
  by: string;
};

export type Report = { code: string; jobId: string; createdAt: string; sentAt: string | null };

export type Decision = "pending" | "approved" | "declined";

export type EstimateLine = {
  id: string;
  section: Section | "other";
  description: string;
  priority: Priority;
  parts: number;
  labor: number;
  decision: Decision;
};

export type EstimateStatus = "draft" | "sent" | "approved" | "declined";

export type Estimate = {
  id: string;
  jobId: string;
  createdAt: string;
  status: EstimateStatus;
  sentAt: string | null;
  approvedAt: string | null;
  lines: EstimateLine[];
};

export type Message = {
  id: string;
  customerId: string;
  jobId?: string;
  direction: "out" | "in";
  body: string;
  at: string;
  kind: "text" | "report" | "estimate";
  link?: string;
  by?: string;
};

export type ExpenseType = "income" | "expense";
export type ExpenseMethod = "cash" | "card" | "check" | "bank" | "other";

export type ExpenseTransaction = {
  id: string;
  date: string;
  at: string;
  type: ExpenseType;
  category: string;
  description: string;
  amount: number;
  method: ExpenseMethod;
  jobId?: string;
  by: string;
};

export type AlignmentPackage = { price: AlignmentPrice; label: string };

export type Settings = {
  shopName: string;
  phone: string;
  address: string;
  hours: string;
  website: string;
  treadSoon: number;
  treadReplace: number;
  padSoon: number;
  padReplace: number;
  taxRate: number;
  alignmentPackages: AlignmentPackage[];
  reportTemplate: string;
  estimateTemplate: string;
};

export type ShopState = {
  version: number;
  anchorDay: string;
  seq: number;
  settings: Settings;
  team: Member[];
  customers: Customer[];
  vehicles: Vehicle[];
  jobs: Job[];
  inspections: Inspection[];
  media: Media[];
  reports: Report[];
  estimates: Estimate[];
  messages: Message[];
  expenses: ExpenseTransaction[];
};

// ---------- Constants ----------

export const CORNERS: Corner[] = ["LF", "RF", "LR", "RR"];
export const CORNER_LABEL: Record<Corner, string> = {
  LF: "Left front",
  RF: "Right front",
  LR: "Left rear",
  RR: "Right rear",
};

export const SECTION_LABEL: Record<Section, string> = {
  tires: "Tires",
  brakes: "Brakes",
  suspension: "Suspension",
  alignment: "Alignment",
  tpms: "TPMS",
};

export const MEDIA_SECTION_LABEL: Record<MediaSection, string> = {
  ...SECTION_LABEL,
  general: "General / check-in",
};

export const MEDIA_SECTIONS: MediaSection[] = ["tires", "brakes", "suspension", "alignment", "tpms", "general"];

/** Step order used by the technician wizard (matches the phone mock-up). */
export const WIZARD_ORDER: Section[] = ["tires", "brakes", "suspension", "alignment", "tpms"];
/** Order used on summaries and the customer report. */
export const SUMMARY_ORDER: Section[] = ["tires", "brakes", "tpms", "suspension", "alignment"];
/** Order used by the "Recommended repairs" block on the paper sheet. */
export const SHEET_REPAIR_ORDER: Section[] = ["tires", "alignment", "tpms", "brakes", "suspension"];

export const SUSPENSION_PARTS: SuspensionPart[] = [
  "Inner Tie Rod",
  "Outer Tie Rod",
  "Control Arm",
  "Shock",
  "Strut",
  "Other",
];

export const PRIORITIES: Priority[] = ["ok", "soon", "future", "now"];
export const PRIORITY_LABEL: Record<Priority, string> = { ok: "OK", soon: "Soon", future: "Future", now: "Now" };
export const GRADE_LABEL: Record<Grade, string> = { good: "Good", soon: "Soon", replace: "Replace" };
export const ROTOR_LABEL: Record<RotorGrade, string> = { good: "Good", worn: "Worn", replace: "Replace" };

export const TEAM: Member[] = [
  { id: "mike", name: "Mike Sullivan", role: "Owner · Lead Technician", initials: "MS" },
  { id: "luis", name: "Luis Ortega", role: "Technician", initials: "LO" },
  { id: "kevin", name: "Kevin Tran", role: "Technician", initials: "KT" },
  { id: "jen", name: "Jen Alves", role: "Service Advisor", initials: "JA" },
];

export const MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ford", "GMC", "Honda",
  "Hyundai", "Infiniti", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Mitsubishi", "Nissan", "Ram",
  "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other",
];

export const MODELS: Record<string, string[]> = {
  Toyota: ["RAV4", "Camry", "Corolla", "Highlander", "Tacoma", "Tundra", "Sienna", "4Runner", "Prius"],
  Honda: ["CR-V", "Civic", "Accord", "Pilot", "Odyssey", "HR-V", "Ridgeline"],
  Ford: ["F-150", "Escape", "Explorer", "Edge", "Ranger", "Bronco", "Mustang", "Transit"],
  Chevrolet: ["Silverado 1500", "Equinox", "Malibu", "Traverse", "Tahoe", "Colorado"],
  Nissan: ["Altima", "Rogue", "Sentra", "Pathfinder", "Frontier", "Murano"],
  Subaru: ["Outback", "Forester", "Crosstrek", "Ascent", "Impreza"],
  Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  BMW: ["328i", "330i", "X3", "X5", "530i"],
  Hyundai: ["Elantra", "Tucson", "Santa Fe", "Sonata", "Kona"],
  Kia: ["Sorento", "Sportage", "Telluride", "Forte", "Soul"],
  Ram: ["1500", "2500", "ProMaster"],
  Volkswagen: ["Jetta", "Tiguan", "Atlas", "Golf"],
  Mazda: ["CX-5", "CX-50", "Mazda3", "CX-9"],
};

export const SERVICE_CHIPS = [
  "Tire repair",
  "Check brakes",
  "New tires",
  "Alignment",
  "TPMS light on",
  "Tire rotation",
  "Seasonal tire swap",
  "Vibration / noise",
  "Pulls to one side",
];

export const TIME_SLOTS = [
  "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM",
  "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

export const INCOME_CATEGORIES = [
  "Labor",
  "Parts",
  "Tires",
  "Alignment",
  "Inspection fee",
  "TPMS",
  "Other income",
];

export const EXPENSE_CATEGORIES = [
  "Parts purchase",
  "Tire inventory",
  "Rent",
  "Utilities",
  "Salaries",
  "Insurance",
  "Equipment",
  "Supplies",
  "Marketing",
  "Other",
];

export const EXPENSE_METHODS: { id: import("./data").ExpenseMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "check", label: "Check" },
  { id: "bank", label: "Bank transfer" },
  { id: "other", label: "Other" },
];

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Castle Tire Shop",
  phone: "(508) 555-0100",
  address: "214 Main Street, Worcester, MA 01608",
  hours: "Mon–Fri 7:30 AM – 6:00 PM · Sat 8:00 AM – 3:00 PM",
  website: "castletire.com",
  treadSoon: 5,
  treadReplace: 3,
  padSoon: 5,
  padReplace: 3,
  taxRate: 6.25,
  alignmentPackages: [
    { price: 79, label: "Front-end alignment" },
    { price: 89, label: "Four-wheel alignment" },
    { price: 99, label: "Four-wheel + steering angle reset" },
    { price: 120, label: "Truck / SUV / lifted alignment" },
  ],
  reportTemplate:
    "Hi {first}, your vehicle inspection is complete. View your inspection report, photos and recommendations here: {link}",
  estimateTemplate:
    "Hi {first}, your estimate for your {vehicle} is ready ({total}). Review and approve it here: {link}",
};

/** Static shop identity used by server-rendered pages (login). */
export const SHOP = {
  name: DEFAULT_SETTINGS.shopName,
  tagline: "Tires · Alignments · Brakes · Auto Repair",
  address: DEFAULT_SETTINGS.address,
  phone: DEFAULT_SETTINGS.phone,
};

// ---------- Stock media (Pexels, free to use) ----------

export const px = (id: number, w = 1200, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${h}&w=${w}`;

export const PHOTOS = {
  shopInterior: px(33814734, 1600, 1100),
  carOnLift: px(8986130, 1400, 900),
  carLiftWhite: px(8986033),
  alloyWheel: px(14667455),
  tireTread: px(7019611),
  tireSidewall: px(16685597),
  brakeCaliper: px(833320),
  brakeDisc: px(3642618),
  suspension: px(37175105),
  mechanic: px(4116224),
  stackedTires: px(36353556),
  inspector: px(8986148),
  pressureGauge: px(5640643),
  undercarriage: px(8986137),
};

export const CAR_PHOTOS = {
  suv: px(4909544, 900, 600),
  suvHarbor: px(27497575, 900, 600),
  suvCity: px(37025272, 900, 600),
  suvGarage: px(11873083, 900, 600),
  truck: px(7873720, 900, 600),
  sedan: px(12206292, 900, 600),
  sedanRed: px(5864402, 900, 600),
  ev: px(10029873, 900, 600),
  jeep: px(17722340, 900, 600),
};

export const videoPoster = (id: number) =>
  `https://images.pexels.com/videos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200`;
export const videoFile = (id: number, fps = 30) =>
  `https://videos.pexels.com/video-files/${id}/${id}-uhd_3840_2160_${fps}fps.mp4`;
