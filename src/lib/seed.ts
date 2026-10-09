import {
  CAR_PHOTOS,
  DEFAULT_SETTINGS,
  PHOTOS,
  TEAM,
  videoFile,
  videoPoster,
  type Corner,
  type Customer,
  type Estimate,
  type ExpenseTransaction,
  type Grade,
  type Inspection,
  type Job,
  type JobStatus,
  type Media,
  type Message,
  type Report,
  type ShopState,
  type TimelineEntry,
  type Vehicle,
} from "./data";
import { addDays, blankInspection } from "./utils";

export const STORE_VERSION = 4;

const ORDER: JobStatus[] = [
  "waiting",
  "accepted",
  "inspection",
  "inspection_complete",
  "customer_contacted",
  "approved",
  "completed",
];

/** Builds the demo data set relative to `today` so the shop always has a fresh "today". */
export function createSeed(today: string): ShopState {
  const day = (offset: number) => addDays(today, offset);
  const at = (offset: number, hhmm: string) => `${day(offset)}T${hhmm}:00`;
  const timeline = (offset: number, tech: string, times: string[]): TimelineEntry[] =>
    times.map((t, i) => ({ status: ORDER[i], at: at(offset, t), by: i === 0 ? "jen" : tech }));

  const customers: Customer[] = [
    { id: "c1", name: "John Smith", phone: "(857) 555-1234", email: "john.smith@email.com", city: "Boston, MA", since: "2021" },
    { id: "c2", name: "Maria Lopez", phone: "(508) 555-0187", email: "maria.lopez@email.com", city: "Worcester, MA", since: "2019" },
    { id: "c3", name: "Carlos Rivera", phone: "(617) 555-0133", email: "crivera@email.com", city: "Cambridge, MA", since: "2017" },
    { id: "c4", name: "Ana Torres", phone: "(781) 555-0164", email: "ana.torres@email.com", city: "Waltham, MA", since: "2023" },
    { id: "c5", name: "Maria Gonzalez", phone: "(508) 555-0142", email: "maria.gonzalez@email.com", city: "Shrewsbury, MA", since: "2020" },
    { id: "c6", name: "James O'Brien", phone: "(617) 555-0178", email: "jobrien@email.com", city: "Quincy, MA", since: "2016" },
    { id: "c7", name: "Daniel Costa", phone: "(508) 555-0107", email: "dcosta@email.com", city: "Brockton, MA", since: "2018" },
    { id: "c8", name: "Linda Nguyen", phone: "(617) 555-0124", email: "linda.nguyen@email.com", city: "Somerville, MA", since: "2021" },
    { id: "c9", name: "Tom Gallagher", phone: "(781) 555-0159", email: "tgallagher@email.com", city: "Braintree, MA", since: "2020" },
    { id: "c10", name: "Aisha Thompson", phone: "(413) 555-0121", email: "aisha.t@email.com", city: "Springfield, MA", since: "2022" },
  ];

  const vehicles: Vehicle[] = [
    { id: "v1", customerId: "c1", year: 2021, make: "Toyota", model: "RAV4", trim: "XLE", color: "Silver", plate: "3ABC27", mileage: 68450, vin: "2T3P1RFV6MC154321", photo: CAR_PHOTOS.suv },
    { id: "v2", customerId: "c2", year: 2017, make: "BMW", model: "328i", trim: "Sport", color: "White", plate: "6XYZ12", mileage: 74210, vin: "WBA8E9G57HNU45210", photo: CAR_PHOTOS.sedan },
    { id: "v3", customerId: "c3", year: 2019, make: "Honda", model: "Pilot", trim: "EX-L", color: "White", plate: "8DEF45", mileage: 59870, vin: "5FNYF6H59KB012345", photo: CAR_PHOTOS.suvCity },
    { id: "v4", customerId: "c4", year: 2023, make: "Tesla", model: "Model Y", trim: "Long Range", color: "White", plate: "4JKL33", mileage: 18240, vin: "7SAYGDEE5PF712345", photo: CAR_PHOTOS.ev },
    { id: "v5", customerId: "c5", year: 2019, make: "Honda", model: "CR-V", trim: "EX", color: "White", plate: "4TXR82", mileage: 48210, vin: "2HKRW2H84KH501142", photo: CAR_PHOTOS.suvHarbor },
    { id: "v6", customerId: "c6", year: 2016, make: "Ford", model: "F-150", trim: "XLT", color: "Yellow", plate: "7KLM19", mileage: 92400, vin: "1FTEW1EF5GKD33817", photo: CAR_PHOTOS.truck },
    { id: "v7", customerId: "c6", year: 2021, make: "Toyota", model: "Camry", trim: "SE", color: "Red", plate: "2NJV55", mileage: 31905, vin: "4T1G11AK6MU410982", photo: CAR_PHOTOS.sedanRed },
    { id: "v8", customerId: "c7", year: 2017, make: "Nissan", model: "Altima", trim: "SV", color: "White", plate: "8LMT33", mileage: 84002, vin: "1N4AL3AP8HC214557", photo: CAR_PHOTOS.sedan },
    { id: "v9", customerId: "c8", year: 2020, make: "Jeep", model: "Wrangler", trim: "Sport", color: "Gray", plate: "6GZC27", mileage: 39780, vin: "1C4HJXDG2LW102863", photo: CAR_PHOTOS.jeep },
    { id: "v10", customerId: "c9", year: 2014, make: "Toyota", model: "Sienna", trim: "LE", color: "White", plate: "1PBN48", mileage: 143300, vin: "5TDKK3DC4ES471265", photo: CAR_PHOTOS.suvGarage },
    { id: "v11", customerId: "c10", year: 2018, make: "Subaru", model: "Outback", trim: "Premium", color: "White", plate: "9WQP14", mileage: 66118, vin: "4S4BSAFC5J3266711", photo: CAR_PHOTOS.suvHarbor },
  ];

  const jobs: Job[] = [
    { id: "J-2051", date: day(0), time: "08:15 AM", customerId: "c1", vehicleId: "v1", complaint: "Tire repair, check brakes", status: "inspection_complete", assignedTo: "mike", mileageIn: 68450, timeline: timeline(0, "mike", ["08:05", "08:22", "08:31", "09:12"]) },
    { id: "J-2052", date: day(0), time: "09:05 AM", customerId: "c2", vehicleId: "v2", complaint: "Brake pads, squealing when stopping", status: "inspection", assignedTo: "mike", mileageIn: 74210, timeline: timeline(0, "mike", ["08:52", "09:07", "09:15"]) },
    { id: "J-2053", date: day(0), time: "09:20 AM", customerId: "c3", vehicleId: "v3", complaint: "Alignment, pulls to the right", status: "accepted", assignedTo: "luis", mileageIn: 59870, timeline: timeline(0, "luis", ["09:02", "09:24"]) },
    { id: "J-2054", date: day(0), time: "10:10 AM", customerId: "c4", vehicleId: "v4", complaint: "TPMS sensors, warning light on", status: "waiting", assignedTo: null, mileageIn: 18240, timeline: timeline(0, "", ["09:40"]) },
    { id: "J-2055", date: day(0), time: "10:45 AM", customerId: "c5", vehicleId: "v5", complaint: "Tire rotation, hum above 50 mph", status: "waiting", assignedTo: null, mileageIn: 48210, timeline: timeline(0, "", ["09:55"]) },
    { id: "J-2059", date: day(0), time: "01:00 PM", customerId: "c9", vehicleId: "v10", complaint: "Full safety inspection + shocks", status: "waiting", assignedTo: "luis", mileageIn: 143300, timeline: timeline(0, "", ["10:15"]) },
    { id: "J-2056", date: day(0), time: "07:45 AM", customerId: "c6", vehicleId: "v6", complaint: "Front brake pads & rotors", status: "approved", assignedTo: "kevin", mileageIn: 92400, timeline: timeline(0, "kevin", ["07:35", "07:48", "07:55", "08:30", "08:40", "08:55"]) },
    { id: "J-2060", date: day(0), time: "08:30 AM", customerId: "c10", vehicleId: "v11", complaint: "Four new tires + alignment", status: "customer_contacted", assignedTo: "mike", mileageIn: 66118, timeline: timeline(0, "mike", ["08:20", "08:35", "08:40", "09:25", "09:40"]) },
    { id: "J-2057", date: day(0), time: "07:30 AM", customerId: "c7", vehicleId: "v8", complaint: "Tire puncture repair", status: "completed", assignedTo: "luis", mileageIn: 84002, timeline: timeline(0, "luis", ["07:20", "07:31", "07:36", "07:50", "08:00", "08:05", "08:40"]) },
    { id: "J-2058", date: day(0), time: "08:00 AM", customerId: "c8", vehicleId: "v9", complaint: "Seasonal tire swap", status: "completed", assignedTo: "kevin", mileageIn: 39780, timeline: timeline(0, "kevin", ["07:50", "08:02", "08:10", "08:30", "08:35", "08:36", "09:20"]) },
    { id: "J-1990", date: day(-40), time: "11:00 AM", customerId: "c6", vehicleId: "v7", complaint: "Alignment, steering wheel off-center", status: "completed", assignedTo: "kevin", mileageIn: 30120, timeline: timeline(-40, "kevin", ["10:50", "11:02", "11:10", "11:40", "11:45", "11:50", "12:40"]) },
    { id: "J-1987", date: day(-57), time: "10:00 AM", customerId: "c1", vehicleId: "v1", complaint: "Tire rotation & brake inspection", status: "completed", assignedTo: "mike", mileageIn: 63980, timeline: timeline(-57, "mike", ["09:50", "10:02", "10:10", "10:50", "11:00", "11:05", "11:45"]) },
    { id: "J-1932", date: day(-140), time: "09:30 AM", customerId: "c5", vehicleId: "v5", complaint: "Winter tire install", status: "completed", assignedTo: "luis", mileageIn: 44010, timeline: timeline(-140, "luis", ["09:20", "09:32", "09:40", "10:20", "10:40", "10:42", "11:30"]) },
  ];

  // ---------- Inspections ----------
  const g = (t: number): Grade => (t <= 3 ? "replace" : t <= 5 ? "soon" : "good");
  const tires = (lf: number, rf: number, lr: number, rr: number): Inspection["tires"] => ({
    LF: { tread: lf, grade: g(lf) },
    RF: { tread: rf, grade: g(rf) },
    LR: { tread: lr, grade: g(lr) },
    RR: { tread: rr, grade: g(rr) },
  });
  const psi = (n: number): Record<Corner, number | null> => ({ LF: n, RF: n, LR: n, RR: n });
  const okRest = (): Pick<Inspection, "tpms" | "suspension" | "alignment"> => ({
    tpms: { status: "ok", tpmNumber: "", psi: psi(35) },
    suspension: { status: "ok", parts: [], other: "" },
    alignment: { status: "ok", package: null },
  });
  const notes = (n: Partial<Inspection["notes"]>): Inspection["notes"] => ({
    tires: "",
    brakes: "",
    suspension: "",
    alignment: "",
    tpms: "",
    ...n,
  });
  const rec = (r: Partial<Inspection["recommended"]>): Inspection["recommended"] => ({
    tires: null,
    brakes: null,
    suspension: null,
    alignment: null,
    tpms: null,
    ...r,
  });
  const allOk = () => rec({ tires: "ok", brakes: "ok", tpms: "ok", suspension: "ok", alignment: "ok" });
  const ins = (jobId: string, p: Partial<Inspection>): Inspection => ({ ...blankInspection(jobId), ...p });

  const inspections: Inspection[] = [
    ins("J-2051", {
      techId: "mike",
      startedAt: at(0, "08:31"),
      completedAt: at(0, "09:12"),
      tireSize: "225/65R17",
      tireBrand: "Bridgestone Alenza",
      tires: {
        LF: { tread: 4, grade: "soon" },
        RF: { tread: 4, grade: "soon" },
        LR: { tread: 6, grade: "good" },
        RR: { tread: 5, grade: "soon" },
      },
      brakes: { front: { pad: 3, rotor: "worn" }, rear: { pad: 7, rotor: "good" } },
      tpms: { status: "ok", tpmNumber: "", psi: { LF: 35, RF: 35, LR: 34, RR: 35 } },
      suspension: { status: "rec", parts: ["Outer Tie Rod"], other: "" },
      alignment: { status: "rec", package: 89 },
      notes: notes({
        tires: "Front tires wearing outer edge.",
        brakes: "Front pads at 3 mm. Rotor surface worn.",
        tpms: "No issues.",
        suspension: "Outer tie rod play.",
        alignment: "Excessive outer tire wear.",
      }),
      additionalNotes:
        "Outer-edge wear on both front tires points to alignment. Replace the outer tie rod and align before installing new front tires. Customer is waiting in the lobby.",
      recommended: rec({ tires: "soon", brakes: "now", tpms: "ok", suspension: "soon", alignment: "now" }),
    }),
    ins("J-2052", {
      techId: "mike",
      startedAt: at(0, "09:15"),
      tireSize: "225/45R18",
      tireBrand: "Michelin Pilot Sport A/S 4",
      tires: tires(7, 7, 6, 6),
      brakes: { front: { pad: 2.5, rotor: "worn" }, rear: { pad: null, rotor: null } },
      notes: notes({ tires: "Even wear, good condition.", brakes: "Front pads almost gone. Squeal on stop." }),
    }),
    ins("J-2056", {
      techId: "kevin",
      startedAt: at(0, "07:55"),
      completedAt: at(0, "08:30"),
      tireSize: "275/65R18",
      tireBrand: "Goodyear Wrangler",
      tires: tires(7, 7, 6, 6),
      brakes: { front: { pad: 2, rotor: "replace" }, rear: { pad: 6.5, rotor: "good" } },
      ...okRest(),
      notes: notes({ brakes: "Front pads at 2 mm. Rotors scored below minimum thickness.", tpms: "No issues." }),
      additionalNotes: "Brake fluid tested OK.",
      recommended: rec({ tires: "ok", brakes: "now", tpms: "ok", suspension: "ok", alignment: "ok" }),
    }),
    ins("J-2060", {
      techId: "mike",
      startedAt: at(0, "08:40"),
      completedAt: at(0, "09:25"),
      tireSize: "225/60R18",
      tireBrand: "Yokohama Geolandar",
      tires: tires(2, 2, 3, 3),
      brakes: { front: { pad: 6, rotor: "good" }, rear: { pad: 6, rotor: "good" } },
      tpms: { status: "ok", tpmNumber: "", psi: psi(33) },
      suspension: { status: "ok", parts: [], other: "" },
      alignment: { status: "rec", package: 99 },
      notes: notes({
        tires: "All four tires at or below 3/32\". Not safe in rain or snow.",
        alignment: "Required with new tires to protect the tire warranty.",
      }),
      recommended: rec({ tires: "now", brakes: "ok", tpms: "ok", suspension: "ok", alignment: "now" }),
    }),
    ins("J-2057", {
      techId: "luis",
      startedAt: at(0, "07:36"),
      completedAt: at(0, "07:50"),
      tireSize: "215/55R17",
      tireBrand: "Continental TrueContact",
      tires: tires(6, 6, 6, 6),
      brakes: { front: { pad: 8, rotor: "good" }, rear: { pad: 7, rotor: "good" } },
      ...okRest(),
      notes: notes({ tires: "Nail in LR tread. Plug-patch repair completed." }),
      recommended: allOk(),
    }),
    ins("J-2058", {
      techId: "kevin",
      startedAt: at(0, "08:10"),
      completedAt: at(0, "08:30"),
      tireSize: "245/75R17",
      tireBrand: "BFGoodrich Trail-Terrain",
      tires: tires(9, 9, 9, 9),
      brakes: { front: { pad: 8, rotor: "good" }, rear: { pad: 8, rotor: "good" } },
      ...okRest(),
      notes: notes({ tires: "Winter tires removed and stored (rack B-12). All-seasons installed." }),
      recommended: allOk(),
    }),
    ins("J-1990", {
      techId: "kevin",
      startedAt: at(-40, "11:10"),
      completedAt: at(-40, "11:40"),
      tireSize: "235/45R18",
      tireBrand: "Michelin Primacy",
      tires: tires(8, 8, 8, 8),
      brakes: { front: { pad: 9, rotor: "good" }, rear: { pad: 8, rotor: "good" } },
      tpms: { status: "ok", tpmNumber: "", psi: psi(35) },
      suspension: { status: "ok", parts: [], other: "" },
      alignment: { status: "rec", package: 89 },
      notes: notes({ alignment: "Toe out of spec, steering wheel off-center. Aligned same day." }),
      recommended: rec({ tires: "ok", brakes: "ok", tpms: "ok", suspension: "ok", alignment: "now" }),
    }),
    ins("J-1987", {
      techId: "mike",
      startedAt: at(-57, "10:10"),
      completedAt: at(-57, "10:50"),
      tireSize: "225/65R17",
      tireBrand: "Bridgestone Alenza",
      tires: tires(8, 8, 7, 7),
      brakes: { front: { pad: 7, rotor: "good" }, rear: { pad: 8, rotor: "good" } },
      ...okRest(),
      notes: notes({ tires: "Rotated front to rear.", brakes: "Front pads at 7 mm. Plan replacement in about a year." }),
      recommended: rec({ tires: "ok", brakes: "future", tpms: "ok", suspension: "ok", alignment: "ok" }),
    }),
    ins("J-1932", {
      techId: "luis",
      startedAt: at(-140, "09:40"),
      completedAt: at(-140, "10:20"),
      tireSize: "235/65R17",
      tireBrand: "Bridgestone Blizzak",
      tires: tires(11, 11, 11, 11),
      brakes: { front: { pad: 9, rotor: "good" }, rear: { pad: 8, rotor: "good" } },
      ...okRest(),
      notes: notes({ tires: "New winter tires installed. All-seasons stored." }),
      recommended: allOk(),
    }),
  ];

  // ---------- Photos & videos ----------
  const media: Media[] = [];
  const addMedia = (
    jobId: string,
    vehicleId: string,
    section: Media["section"],
    item: string | undefined,
    url: string,
    caption: string,
    time: string,
    by: string,
    offset = 0,
    video?: number,
  ) =>
    media.push({
      id: `md${media.length + 1}`,
      jobId,
      vehicleId,
      section,
      item,
      type: video ? "video" : "photo",
      url: video ? videoFile(video) : url,
      poster: video ? videoPoster(video) : undefined,
      caption,
      takenAt: at(offset, time),
      by,
    });

  addMedia("J-2051", "v1", "tires", "LF", PHOTOS.tireTread, "Uneven wear on outer edge.", "08:41", "mike");
  addMedia("J-2051", "v1", "tires", "LF", PHOTOS.tireSidewall, "LF sidewall and DOT code", "08:42", "mike");
  addMedia("J-2051", "v1", "tires", "RF", PHOTOS.stackedTires, "RF tread at 4/32\"", "08:44", "mike");
  addMedia("J-2051", "v1", "brakes", "front", PHOTOS.brakeCaliper, "Front pads at 3 mm", "08:52", "mike");
  addMedia("J-2051", "v1", "brakes", "front", PHOTOS.brakeDisc, "Rotor surface worn", "08:53", "mike");
  addMedia("J-2051", "v1", "suspension", undefined, PHOTOS.suspension, "Outer tie rod play, passenger side", "09:01", "mike");
  addMedia("J-2051", "v1", "alignment", undefined, PHOTOS.carLiftWhite, "On the alignment rack", "09:05", "mike");
  addMedia("J-2051", "v1", "tpms", undefined, PHOTOS.pressureGauge, "All sensors reading 34–35 PSI", "08:47", "mike");
  addMedia("J-2051", "v1", "general", undefined, "", "Walk-around video", "08:33", "mike", 0, 8987075);
  addMedia("J-2052", "v2", "tires", "LF", PHOTOS.alloyWheel, "Check-in photo, LF wheel", "09:16", "mike");
  addMedia("J-2052", "v2", "brakes", "front", PHOTOS.brakeDisc, "Front rotor scoring", "09:22", "mike");
  addMedia("J-2056", "v6", "brakes", "front", PHOTOS.brakeCaliper, "Front pads at 2 mm", "08:05", "kevin");
  addMedia("J-2056", "v6", "brakes", "front", "", "Brake job walk-around", "08:12", "kevin", 0, 6870347);
  addMedia("J-2060", "v11", "tires", "LF", PHOTOS.tireTread, "2/32\" with cords close to showing", "08:48", "mike");
  addMedia("J-2060", "v11", "tires", "RR", PHOTOS.tireSidewall, "RR at 3/32\"", "08:50", "mike");
  addMedia("J-2060", "v11", "alignment", undefined, PHOTOS.undercarriage, "Alignment check on the lift", "09:10", "mike");
  addMedia("J-2057", "v8", "tires", "LR", PHOTOS.mechanic, "LR plug-patch repair", "07:45", "luis");
  addMedia("J-2058", "v9", "tires", undefined, PHOTOS.stackedTires, "Winter set stored on rack B-12", "08:20", "kevin");
  addMedia("J-2058", "v9", "general", undefined, "", "Seasonal swap walk-around", "08:25", "kevin", 0, 8470697);
  addMedia("J-1987", "v1", "general", undefined, PHOTOS.carOnLift, "Check-in on lift 2", "10:05", "mike", -57);
  addMedia("J-1990", "v7", "alignment", undefined, PHOTOS.inspector, "Alignment readings", "11:20", "kevin", -40);

  // fix the third video (8470697 is 25fps on Pexels)
  for (const m of media) if (m.url.includes("8470697")) m.url = videoFile(8470697, 25);

  const reports: Report[] = [
    { code: "K7Q2XM", jobId: "J-2051", createdAt: at(0, "09:12"), sentAt: null },
    { code: "P4N8RD", jobId: "J-2056", createdAt: at(0, "08:30"), sentAt: at(0, "08:40") },
    { code: "W2H6TB", jobId: "J-2060", createdAt: at(0, "09:25"), sentAt: at(0, "09:40") },
    { code: "T5J8QA", jobId: "J-2057", createdAt: at(0, "07:50"), sentAt: at(0, "08:00") },
    { code: "B3Z7NE", jobId: "J-2058", createdAt: at(0, "08:30"), sentAt: at(0, "08:35") },
    { code: "D6Y1KP", jobId: "J-1990", createdAt: at(-40, "11:40"), sentAt: at(-40, "11:45") },
    { code: "M9C3LV", jobId: "J-1987", createdAt: at(-57, "10:50"), sentAt: at(-57, "11:00") },
    { code: "H8V4CW", jobId: "J-1932", createdAt: at(-140, "10:20"), sentAt: at(-140, "10:40") },
  ];

  const estimates: Estimate[] = [
    {
      id: "E-1001",
      jobId: "J-2056",
      createdAt: at(0, "08:36"),
      status: "approved",
      sentAt: at(0, "08:40"),
      approvedAt: at(0, "08:55"),
      lines: [
        { id: "l1", section: "brakes", description: "Front brake pads & rotors", priority: "now", parts: 260, labor: 180, decision: "approved" },
      ],
    },
    {
      id: "E-1002",
      jobId: "J-2060",
      createdAt: at(0, "09:32"),
      status: "sent",
      sentAt: at(0, "09:41"),
      approvedAt: null,
      lines: [
        { id: "l2", section: "tires", description: "Replace 4 tires (225/60R18) · mount, balance & disposal", priority: "now", parts: 660, labor: 100, decision: "pending" },
        { id: "l3", section: "alignment", description: "Four-wheel + steering angle reset (ALG 99)", priority: "now", parts: 0, labor: 99, decision: "pending" },
        { id: "l4", section: "tpms", description: "TPMS service kits & relearn", priority: "soon", parts: 24, labor: 20, decision: "pending" },
      ],
    },
  ];

  const reportBody = (first: string) =>
    `Hi ${first}, your vehicle inspection is complete. View your inspection report, photos and recommendations here:`;

  const messages: Message[] = [
    { id: "m1", customerId: "c1", jobId: "J-1987", direction: "out", kind: "report", body: reportBody("John"), link: "/r/M9C3LV", at: at(-57, "11:00"), by: "mike" },
    { id: "m2", customerId: "c1", jobId: "J-1987", direction: "in", kind: "text", body: "Thanks! See you next time.", at: at(-57, "11:20") },
    { id: "m3", customerId: "c6", jobId: "J-2056", direction: "out", kind: "report", body: reportBody("James"), link: "/r/P4N8RD", at: at(0, "08:40"), by: "kevin" },
    { id: "m4", customerId: "c6", jobId: "J-2056", direction: "out", kind: "estimate", body: "Your estimate for front brake pads & rotors is $456.25. Reply YES to approve.", link: "/r/P4N8RD", at: at(0, "08:41"), by: "jen" },
    { id: "m5", customerId: "c6", jobId: "J-2056", direction: "in", kind: "text", body: "YES, go ahead with the brakes. Thanks!", at: at(0, "08:55") },
    { id: "m6", customerId: "c10", jobId: "J-2060", direction: "out", kind: "report", body: reportBody("Aisha"), link: "/r/W2H6TB", at: at(0, "09:40"), by: "mike" },
    { id: "m7", customerId: "c10", jobId: "J-2060", direction: "out", kind: "estimate", body: "Your estimate for 4 tires + alignment is $945.75. Review and approve it on your report.", link: "/r/W2H6TB", at: at(0, "09:41"), by: "jen" },
    { id: "m8", customerId: "c7", jobId: "J-2057", direction: "out", kind: "text", body: "Hi Daniel, your Altima is ready for pickup. The LR tire was plug-patched. — Castle Tire Shop", at: at(0, "08:42"), by: "jen" },
    { id: "m9", customerId: "c7", jobId: "J-2057", direction: "in", kind: "text", body: "On my way, thank you!", at: at(0, "08:50") },
    { id: "m10", customerId: "c8", jobId: "J-2058", direction: "out", kind: "text", body: "Hi Linda, your Wrangler is ready. Your winter tires are stored with us on rack B-12.", at: at(0, "09:25"), by: "jen" },
  ];

  // ---------- Expenses: shop money in (income) vs money out (expense) ----------
  let expN = 0;
  const exp = (
    offset: number,
    hhmm: string,
    type: ExpenseTransaction["type"],
    category: string,
    description: string,
    amount: number,
    method: ExpenseTransaction["method"],
    by: string,
    jobId?: string,
  ): ExpenseTransaction => {
    expN += 1;
    return { id: `x${expN}`, date: day(offset), at: at(offset, hhmm), type, category, description, amount, method, by, jobId };
  };

  const expenses: ExpenseTransaction[] = [
    // Today — income from completed / approved work
    exp(0, "08:45", "income", "Labor", "J-2057 Altima puncture repair — labor", 95, "card", "jen", "J-2057"),
    exp(0, "08:46", "income", "Parts", "J-2057 plug-patch kit + supplies", 28, "card", "jen", "J-2057"),
    exp(0, "09:22", "income", "Labor", "J-2058 Wrangler seasonal swap — labor", 120, "card", "jen", "J-2058"),
    exp(0, "09:22", "income", "Other income", "J-2058 winter tire storage (season)", 60, "card", "jen", "J-2058"),
    exp(0, "09:30", "expense", "Supplies", "Shop supplies restock (valves, weights)", 86, "card", "jen"),
    // Yesterday
    exp(-1, "10:15", "income", "Tires", "4× all-season tires — walk-in sale", 720, "card", "jen"),
    exp(-1, "10:15", "income", "Labor", "Mount + balance (4)", 100, "card", "jen"),
    exp(-1, "11:40", "income", "Alignment", "Four-wheel alignment ALG 89", 89, "cash", "jen"),
    exp(-1, "14:05", "expense", "Tire inventory", "Distributor invoice — 8 tires", 1180, "bank", "mike"),
    exp(-1, "16:20", "income", "Inspection fee", "State safety inspection", 35, "cash", "jen"),
    // -2 days
    exp(-2, "09:05", "income", "Labor", "Brake pads front — labor", 180, "card", "jen"),
    exp(-2, "09:05", "income", "Parts", "Brake pads + rotors front", 260, "card", "jen"),
    exp(-2, "12:30", "expense", "Parts purchase", "Brake parts — NAPA", 310, "card", "mike"),
    exp(-2, "13:10", "expense", "Utilities", "National Grid — electric", 342, "bank", "mike"),
    // -3 days
    exp(-3, "10:00", "income", "TPMS", "TPMS sensor + relearn", 95, "card", "jen"),
    exp(-3, "11:30", "income", "Labor", "Tire rotation + balance", 75, "cash", "jen"),
    exp(-3, "15:00", "expense", "Equipment", "Torque wrench calibration", 120, "card", "mike"),
    // -5 days (payday + rent week)
    exp(-5, "09:00", "expense", "Salaries", "Weekly payroll — techs + advisor", 3450, "bank", "mike"),
    exp(-5, "10:30", "income", "Tires", "2× winter tires + install", 410, "card", "jen"),
    exp(-5, "14:00", "income", "Alignment", "Truck alignment ALG 120", 120, "card", "jen"),
    // -6 days
    exp(-6, "09:15", "expense", "Rent", "Shop rent — monthly", 4200, "bank", "mike"),
    exp(-6, "11:00", "income", "Labor", "Suspension work — outer tie rod", 230, "card", "jen"),
    exp(-6, "11:00", "income", "Parts", "Outer tie rod part", 75, "card", "jen"),
    // -8 days
    exp(-8, "10:20", "expense", "Insurance", "Garage liability — monthly", 685, "bank", "mike"),
    exp(-8, "13:45", "income", "Labor", "Diagnostic labor (1 hr)", 120, "card", "jen"),
    exp(-8, "15:30", "expense", "Marketing", "Google ads — monthly", 250, "card", "mike"),
    // -9 days
    exp(-9, "09:30", "income", "Tires", "4× tires + alignment bundle", 899, "card", "jen"),
    exp(-9, "16:00", "expense", "Supplies", "Cleaning + office supplies", 94, "cash", "jen"),
    // -12 days
    exp(-12, "09:00", "expense", "Salaries", "Weekly payroll — techs + advisor", 3450, "bank", "mike"),
    exp(-12, "11:20", "income", "Parts", "Battery + install", 210, "card", "jen"),
  ];

  return {
    version: STORE_VERSION,
    anchorDay: today,
    seq: 600,
    settings: { ...DEFAULT_SETTINGS, alignmentPackages: DEFAULT_SETTINGS.alignmentPackages.map((p) => ({ ...p })) },
    team: TEAM.map((m) => ({ ...m })),
    customers,
    vehicles,
    jobs,
    inspections,
    media,
    reports,
    estimates,
    messages,
    expenses,
  };
}
