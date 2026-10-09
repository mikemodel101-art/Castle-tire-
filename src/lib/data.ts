// Dummy data for Castle Tire Shop demo. No database is connected.

export type Status = "green" | "yellow" | "red";
export type CheckStatus = Status | "pending";
export type Category = "tires" | "brakes" | "tpms" | "suspension" | "alignment" | "general";
export type Corner = "LF" | "RF" | "LR" | "RR";
export type BrakePosition = "Front Left" | "Front Right" | "Rear Left" | "Rear Right";

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
};

export type Job = {
  id: string;
  date: string;
  time: string;
  customerId: string;
  vehicleId: string;
  service: string;
  stage: number; // 0..5 index into STAGES
  assignedTo: string | null;
  accepted: boolean;
  notes: string;
  adHoc?: { customer: Customer; vehicle: Vehicle };
};

export type TireReading = {
  position: Corner;
  brand: string;
  size: string;
  treadDepth: number | null; // 32nds of an inch
  psi: number | null;
};

export type BrakeReading = {
  position: BrakePosition;
  padMm: number | null;
  rotorMm: number | null;
  rotorMinMm: number;
};

export type TpmsReading = {
  position: Corner;
  psi: number | null;
  sensorOk: boolean;
};

export type SuspensionCheck = { item: string; status: CheckStatus; note: string };

export type Measure = { value: number | null; min: number; max: number };

export type Recommendation = {
  id: string;
  text: string;
  severity: Status;
  estimate: number;
  category: Category;
};

export type Inspection = {
  id: string;
  jobId: string;
  technicianId: string | null;
  date: string;
  tires: TireReading[];
  brakes: BrakeReading[];
  tpms: TpmsReading[];
  suspension: SuspensionCheck[];
  alignment: { caster: Measure; camber: Measure; toe: Measure };
  notes: string;
  recommendations: Recommendation[];
};

export type Media = {
  id: string;
  jobId: string;
  vehicleId: string;
  category: Category;
  type: "photo" | "video";
  url: string;
  poster?: string;
  title: string;
  takenAt: string;
  uploadedBy: string;
};

export type Report = {
  id: string;
  jobId: string;
  status: "Draft" | "Ready" | "Sent";
  createdAt: string;
  sentTo?: string;
};

export const TODAY = "2026-05-14";

export const SHOP = {
  name: "Castle Tire Shop",
  tagline: "Tires · Brakes · Alignment · Repairs",
  address: "214 Main Street, Worcester, MA 01608",
  phone: "(508) 555-0100",
  hours: "Mon–Sat 7:30 AM – 6:00 PM",
};

// Pexels photos (free to use). Helper builds sized URLs.
const px = (id: number, w = 1200, h = 627) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${h}&w=${w}`;

export const PHOTOS = {
  shopInterior: px(33814734, 1600, 1100),
  carOnLift: px(8986130, 1400, 900),
  carLiftWhite: px(8986033, 1200, 800),
  alloyWheel: px(14667455, 1400, 900),
  tireTread: px(7019611, 1200, 800),
  brakeCaliper: px(833320, 1200, 800),
  brakeDisc: px(3642618, 1200, 800),
  suspension: px(37175105, 1200, 800),
  mechanic: px(4116224, 1200, 800),
  stackedTires: px(36353556, 1200, 800),
  inspector: px(8986148, 1200, 800),
};

export const videoPoster = (id: number) =>
  `https://images.pexels.com/videos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200`;
export const videoFile = (id: number) =>
  `https://videos.pexels.com/video-files/${id}/${id}-uhd_3840_2160_30fps.mp4`;

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tires", label: "Tires & Tread" },
  { id: "brakes", label: "Brakes" },
  { id: "tpms", label: "TPMS" },
  { id: "suspension", label: "Suspension" },
  { id: "alignment", label: "Alignment" },
  { id: "general", label: "General / Check-in" },
];

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<Category, string>;

export const STAGES = [
  "Checked In",
  "Inspection",
  "Estimate Approval",
  "Repair in Progress",
  "Quality Check",
  "Completed",
];

export const SUSPENSION_ITEMS = [
  "Shocks / Struts",
  "Ball joints",
  "Tie rod ends",
  "Control arm bushings",
  "Sway bar links",
  "CV boots",
  "Springs",
];

export const TEAM: Member[] = [
  { id: "mike", name: "Mike Sullivan", role: "Owner & Manager", initials: "MS" },
  { id: "carlos", name: "Carlos Rivera", role: "Lead Technician", initials: "CR" },
  { id: "dev", name: "Dev Patel", role: "Technician", initials: "DP" },
  { id: "jen", name: "Jen Alves", role: "Service Advisor", initials: "JA" },
];

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Maria Gonzalez", phone: "(508) 555-0142", email: "maria.gonzalez@email.com", city: "Worcester, MA", since: "2019" },
  { id: "c2", name: "James O'Brien", phone: "(617) 555-0178", email: "jobrien@email.com", city: "Quincy, MA", since: "2016" },
  { id: "c3", name: "Aisha Thompson", phone: "(413) 555-0121", email: "aisha.t@email.com", city: "Springfield, MA", since: "2022" },
  { id: "c4", name: "Robert Kowalski", phone: "(978) 555-0166", email: "rkowalski@email.com", city: "Lowell, MA", since: "2014" },
  { id: "c5", name: "Priya Shah", phone: "(508) 555-0193", email: "priya.shah@email.com", city: "Marlborough, MA", since: "2023" },
  { id: "c6", name: "Daniel Costa", phone: "(508) 555-0107", email: "dcosta@email.com", city: "Brockton, MA", since: "2018" },
  { id: "c7", name: "Linda Nguyen", phone: "(617) 555-0124", email: "linda.nguyen@email.com", city: "Somerville, MA", since: "2021" },
  { id: "c8", name: "Tom Gallagher", phone: "(781) 555-0159", email: "tgallagher@email.com", city: "Braintree, MA", since: "2020" },
];

export const VEHICLES: Vehicle[] = [
  { id: "v1", customerId: "c1", year: 2019, make: "Honda", model: "CR-V", trim: "EX", color: "Silver", plate: "4TXR82", mileage: 48210, vin: "2HKRW2H84KH501142" },
  { id: "v2", customerId: "c2", year: 2016, make: "Ford", model: "F-150", trim: "XLT", color: "Blue", plate: "7KLM19", mileage: 92400, vin: "1FTEW1EF5GKD33817" },
  { id: "v3", customerId: "c2", year: 2021, make: "Toyota", model: "Camry", trim: "SE", color: "White", plate: "2NJV55", mileage: 31905, vin: "4T1G11AK6MU410982" },
  { id: "v4", customerId: "c3", year: 2018, make: "Subaru", model: "Outback", trim: "Premium", color: "Green", plate: "9WQP14", mileage: 66118, vin: "4S4BSAFC5J3266711" },
  { id: "v5", customerId: "c4", year: 2015, make: "Chevrolet", model: "Silverado 1500", trim: "LT", color: "Red", plate: "5DRF71", mileage: 121640, vin: "1GCVKREC4FZ182240" },
  { id: "v6", customerId: "c5", year: 2023, make: "Tesla", model: "Model 3", trim: "Long Range", color: "Black", plate: "3HSK60", mileage: 22500, vin: "5YJ3E1EB7PF601928" },
  { id: "v7", customerId: "c6", year: 2017, make: "Nissan", model: "Altima", trim: "SV", color: "Gray", plate: "8LMT33", mileage: 84002, vin: "1N4AL3AP8HC214557" },
  { id: "v8", customerId: "c7", year: 2020, make: "Jeep", model: "Wrangler", trim: "Sport", color: "Orange", plate: "6GZC27", mileage: 39780, vin: "1C4HJXDG2LW102863" },
  { id: "v9", customerId: "c8", year: 2014, make: "Toyota", model: "Sienna", trim: "LE", color: "Silver", plate: "1PBN48", mileage: 143300, vin: "5TDKK3DC4ES471265" },
];

export const JOBS: Job[] = [
  { id: "J-2051", date: TODAY, time: "08:00 AM", customerId: "c1", vehicleId: "v1", service: "Tire rotation + multi-point inspection", stage: 1, assignedTo: "carlos", accepted: true, notes: "Customer hears a hum above 50 mph. Check rear tires." },
  { id: "J-2052", date: TODAY, time: "08:30 AM", customerId: "c2", vehicleId: "v2", service: "Front brake pads & rotors", stage: 3, assignedTo: "dev", accepted: true, notes: "Customer approved estimate by phone." },
  { id: "J-2053", date: TODAY, time: "09:00 AM", customerId: "c3", vehicleId: "v4", service: "Four new all-season tires + alignment", stage: 0, assignedTo: "carlos", accepted: false, notes: "Tires on order, arriving 8:45 AM." },
  { id: "J-2054", date: TODAY, time: "09:30 AM", customerId: "c4", vehicleId: "v5", service: "Alignment check after suspension work", stage: 1, assignedTo: null, accepted: false, notes: "" },
  { id: "J-2055", date: TODAY, time: "10:00 AM", customerId: "c5", vehicleId: "v6", service: "EV tire service + TPMS check", stage: 0, assignedTo: null, accepted: false, notes: "Tesla Model 3 — use EV-rated tires only." },
  { id: "J-2056", date: TODAY, time: "10:30 AM", customerId: "c6", vehicleId: "v7", service: "Tire puncture repair", stage: 5, assignedTo: "dev", accepted: true, notes: "Nail in LR tread, plug-patch completed." },
  { id: "J-2057", date: TODAY, time: "11:00 AM", customerId: "c7", vehicleId: "v8", service: "Seasonal tire swap", stage: 2, assignedTo: "mike", accepted: true, notes: "" },
  { id: "J-2058", date: TODAY, time: "01:00 PM", customerId: "c8", vehicleId: "v9", service: "Full safety inspection + shocks", stage: 0, assignedTo: null, accepted: false, notes: "Minivan, 3 passengers on a family trip next week." },
  { id: "J-2031", date: "2026-03-18", time: "10:00 AM", customerId: "c1", vehicleId: "v1", service: "Tire rotation & brake inspection", stage: 5, assignedTo: "carlos", accepted: true, notes: "Routine service." },
];

const corners: Corner[] = ["LF", "RF", "LR", "RR"];

export const INSPECTIONS: Inspection[] = [
  {
    id: "INS-2051",
    jobId: "J-2051",
    technicianId: "carlos",
    date: TODAY,
    tires: [
      { position: "LF", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 5, psi: 34 },
      { position: "RF", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 5, psi: 33 },
      { position: "LR", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 3, psi: 29 },
      { position: "RR", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 4, psi: 35 },
    ],
    brakes: [
      { position: "Front Left", padMm: 7.0, rotorMm: 25.1, rotorMinMm: 22 },
      { position: "Front Right", padMm: 7.0, rotorMm: 24.8, rotorMinMm: 22 },
      { position: "Rear Left", padMm: 4.5, rotorMm: 9.6, rotorMinMm: 8 },
      { position: "Rear Right", padMm: 4.0, rotorMm: 9.4, rotorMinMm: 8 },
    ],
    tpms: [
      { position: "LF", psi: 34, sensorOk: true },
      { position: "RF", psi: 33, sensorOk: true },
      { position: "LR", psi: 31, sensorOk: true },
      { position: "RR", psi: 35, sensorOk: true },
    ],
    suspension: [
      { item: "Shocks / Struts", status: "green", note: "Good damping, no leaks" },
      { item: "Ball joints", status: "green", note: "" },
      { item: "Tie rod ends", status: "yellow", note: "Slight play passenger side — monitor" },
      { item: "Control arm bushings", status: "green", note: "" },
      { item: "Sway bar links", status: "yellow", note: "Light wear, rattle on bumps" },
      { item: "CV boots", status: "green", note: "" },
      { item: "Springs", status: "green", note: "" },
    ],
    alignment: {
      caster: { value: 2.4, min: 1.5, max: 3.0 },
      camber: { value: -1.6, min: -1.0, max: 0.0 },
      toe: { value: 0.12, min: -0.1, max: 0.2 },
    },
    notes: "Customer reports slight pull to the right on highway. Camber out of spec on driver side. Recommend four-wheel alignment after tire rotation.",
    recommendations: [
      { id: "r-2051-1", text: "Replace rear-left tire (3/32\" tread)", severity: "red", estimate: 243, category: "tires" },
      { id: "r-2051-2", text: "Four-wheel alignment (camber out of spec)", severity: "red", estimate: 129, category: "alignment" },
      { id: "r-2051-3", text: "Replace rear brake pads at next service", severity: "yellow", estimate: 210, category: "brakes" },
      { id: "r-2051-4", text: "Inspect tie rod ends at next oil change", severity: "yellow", estimate: 0, category: "suspension" },
    ],
  },
  {
    id: "INS-2052",
    jobId: "J-2052",
    technicianId: "dev",
    date: TODAY,
    tires: [
      { position: "LF", brand: "Goodyear Wrangler", size: "275/65R18", treadDepth: 7, psi: 36 },
      { position: "RF", brand: "Goodyear Wrangler", size: "275/65R18", treadDepth: 7, psi: 36 },
      { position: "LR", brand: "Goodyear Wrangler", size: "275/65R18", treadDepth: 6, psi: 35 },
      { position: "RR", brand: "Goodyear Wrangler", size: "275/65R18", treadDepth: 6, psi: 37 },
    ],
    brakes: [
      { position: "Front Left", padMm: 2.5, rotorMm: 19.8, rotorMinMm: 22 },
      { position: "Front Right", padMm: 2.8, rotorMm: 20.5, rotorMinMm: 22 },
      { position: "Rear Left", padMm: 6.5, rotorMm: 14.1, rotorMinMm: 12 },
      { position: "Rear Right", padMm: 6.2, rotorMm: 14.0, rotorMinMm: 12 },
    ],
    tpms: corners.map((c) => ({ position: c, psi: 35, sensorOk: true })),
    suspension: [
      { item: "Shocks / Struts", status: "yellow", note: "Rear left shock leaking lightly" },
      { item: "Ball joints", status: "green", note: "" },
      { item: "Tie rod ends", status: "green", note: "" },
      { item: "Control arm bushings", status: "green", note: "" },
      { item: "Sway bar links", status: "green", note: "" },
      { item: "CV boots", status: "green", note: "" },
      { item: "Springs", status: "green", note: "" },
    ],
    alignment: {
      caster: { value: 4.1, min: 3.0, max: 5.0 },
      camber: { value: -0.4, min: -1.0, max: 0.0 },
      toe: { value: 0.05, min: 0.0, max: 0.1 },
    },
    notes: "Front pads at 2.5 mm and 2.8 mm. Rotors scored and below minimum thickness. Brake job in progress.",
    recommendations: [
      { id: "r-2052-1", text: "Replace front brake pads & rotors (both sides)", severity: "red", estimate: 620, category: "brakes" },
      { id: "r-2052-2", text: "Replace rear-left shock absorber", severity: "yellow", estimate: 240, category: "suspension" },
    ],
  },
  {
    id: "INS-2031",
    jobId: "J-2031",
    technicianId: "carlos",
    date: "2026-03-18",
    tires: [
      { position: "LF", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 9, psi: 35 },
      { position: "RF", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 9, psi: 35 },
      { position: "LR", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 8, psi: 35 },
      { position: "RR", brand: "Michelin Defender2", size: "235/65R17", treadDepth: 8, psi: 36 },
    ],
    brakes: [
      { position: "Front Left", padMm: 9.5, rotorMm: 26.2, rotorMinMm: 22 },
      { position: "Front Right", padMm: 9.4, rotorMm: 26.0, rotorMinMm: 22 },
      { position: "Rear Left", padMm: 7.8, rotorMm: 10.9, rotorMinMm: 8 },
      { position: "Rear Right", padMm: 7.6, rotorMm: 10.8, rotorMinMm: 8 },
    ],
    tpms: corners.map((c) => ({ position: c, psi: 35, sensorOk: true })),
    suspension: SUSPENSION_ITEMS.map((item) => ({ item, status: "green" as CheckStatus, note: "" })),
    alignment: {
      caster: { value: 2.2, min: 1.5, max: 3.0 },
      camber: { value: -0.5, min: -1.0, max: 0.0 },
      toe: { value: 0.08, min: -0.1, max: 0.2 },
    },
    notes: "Routine multi-point inspection. Good overall condition. Tires rotated.",
    recommendations: [
      { id: "r-2031-1", text: "Rear brake pads expected to need replacement in about 12 months", severity: "yellow", estimate: 0, category: "brakes" },
    ],
  },
];

export const MEDIA: Media[] = [
  { id: "M-101", jobId: "J-2051", vehicleId: "v1", category: "tires", type: "photo", url: PHOTOS.tireTread, title: "Rear-left tread depth at 3/32\"", takenAt: "2026-05-14 08:42", uploadedBy: "carlos" },
  { id: "M-102", jobId: "J-2051", vehicleId: "v1", category: "tires", type: "photo", url: PHOTOS.stackedTires, title: "Tire sidewall DOT check", takenAt: "2026-05-14 08:44", uploadedBy: "carlos" },
  { id: "M-103", jobId: "J-2051", vehicleId: "v1", category: "tires", type: "video", url: videoFile(8987075), poster: videoPoster(8987075), title: "Walk-around tire rotation", takenAt: "2026-05-14 08:55", uploadedBy: "carlos" },
  { id: "M-104", jobId: "J-2051", vehicleId: "v1", category: "alignment", type: "photo", url: PHOTOS.carLiftWhite, title: "Vehicle on rack for alignment", takenAt: "2026-05-14 09:10", uploadedBy: "carlos" },
  { id: "M-105", jobId: "J-2052", vehicleId: "v2", category: "brakes", type: "photo", url: PHOTOS.brakeCaliper, title: "Front-left caliper before service", takenAt: "2026-05-14 08:38", uploadedBy: "dev" },
  { id: "M-106", jobId: "J-2052", vehicleId: "v2", category: "brakes", type: "photo", url: PHOTOS.brakeDisc, title: "Rotor scoring close-up", takenAt: "2026-05-14 08:40", uploadedBy: "dev" },
  { id: "M-107", jobId: "J-2052", vehicleId: "v2", category: "brakes", type: "video", url: videoFile(6870347), poster: videoPoster(6870347), title: "Brake job walk-around", takenAt: "2026-05-14 09:25", uploadedBy: "dev" },
  { id: "M-108", jobId: "J-2054", vehicleId: "v5", category: "suspension", type: "photo", url: PHOTOS.suspension, title: "Rear spring corrosion", takenAt: "2026-05-14 09:35", uploadedBy: "carlos" },
  { id: "M-109", jobId: "J-2054", vehicleId: "v5", category: "suspension", type: "video", url: videoFile(8470697), poster: videoPoster(8470697), title: "Spring and shock check", takenAt: "2026-05-14 09:40", uploadedBy: "carlos" },
  { id: "M-110", jobId: "J-2053", vehicleId: "v4", category: "suspension", type: "photo", url: PHOTOS.mechanic, title: "Strut mount inspection", takenAt: "2026-05-14 09:05", uploadedBy: "carlos" },
  { id: "M-111", jobId: "J-2053", vehicleId: "v4", category: "general", type: "photo", url: PHOTOS.shopInterior, title: "Bay 2 check-in", takenAt: "2026-05-14 09:02", uploadedBy: "jen" },
  { id: "M-112", jobId: "J-2055", vehicleId: "v6", category: "tpms", type: "photo", url: PHOTOS.inspector, title: "TPMS sensor reading", takenAt: "2026-05-14 10:05", uploadedBy: "jen" },
  { id: "M-113", jobId: "J-2058", vehicleId: "v9", category: "tires", type: "photo", url: PHOTOS.tireTread, title: "Front tread wear pattern", takenAt: "2026-05-14 01:10", uploadedBy: "jen" },
  { id: "M-114", jobId: "J-2057", vehicleId: "v8", category: "tires", type: "photo", url: PHOTOS.alloyWheel, title: "Seasonal tire swap complete", takenAt: "2026-05-14 11:40", uploadedBy: "mike" },
  { id: "M-115", jobId: "J-2031", vehicleId: "v1", category: "general", type: "photo", url: PHOTOS.carOnLift, title: "Vehicle check-in March", takenAt: "2026-03-18 09:55", uploadedBy: "carlos" },
];

export const REPORTS: Report[] = [
  { id: "RPT-2051-A7K9", jobId: "J-2051", status: "Ready", createdAt: "2026-05-14 09:58 AM" },
  { id: "RPT-2052-B3X2", jobId: "J-2052", status: "Sent", createdAt: "2026-05-14 08:10 AM", sentTo: "(617) 555-0178" },
  { id: "RPT-2031-C9M1", jobId: "J-2031", status: "Sent", createdAt: "2026-03-18 11:20 AM", sentTo: "(508) 555-0142" },
];
