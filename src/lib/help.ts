import type { Section } from "./data";

export type TourStep = {
  title: string;
  text: string;
  tip?: string;
};

export const APP_JOURNEY: TourStep[] = [
  {
    title: "1. Check in the vehicle",
    text: "Start with New Vehicle / Customer. Search by phone, select the vehicle, write the complaint, then create the work order.",
    tip: "If the customer already exists, the phone number auto-fills the account.",
  },
  {
    title: "2. Watch Today's Jobs",
    text: "The shop board separates work into Waiting, In Progress and Completed, so the front desk and technicians see the same queue.",
    tip: "Tap any vehicle card to open its full job page.",
  },
  {
    title: "3. Accept and inspect",
    text: "A technician accepts the job, opens the digital inspection, records measurements and adds photos or short videos.",
    tip: "Each camera button files media into the matching inspection section automatically.",
  },
  {
    title: "4. Complete and share",
    text: "When the inspection is complete, the app builds the customer summary and the public report link right away.",
    tip: "The customer never needs to download an app.",
  },
  {
    title: "5. Build the estimate",
    text: "Create an estimate from the inspection findings, text it, and record approval or decline decisions on each line.",
    tip: "Approved work totals are separated from declined items automatically.",
  },
  {
    title: "6. Keep the history",
    text: "Every customer, vehicle, inspection, photo, report, estimate and text stays tied together for future visits.",
    tip: "Open Customers or Vehicles to see the full service history.",
  },
];

export const SECTION_EXPLAINERS: Record<Section, { title: string; text: string; customerText: string }> = {
  tires: {
    title: "Tire condition",
    text: "Measure tread depth in 32nds and mark Good, Soon or Replace. This drives the tire summary and recommended repair priority.",
    customerText: "Tire tread is measured in 32nds of an inch. Lower numbers mean the tire is closer to replacement.",
  },
  brakes: {
    title: "Brake safety",
    text: "Enter pad thickness in mm and mark rotor condition. The app turns those findings into clear Replace / Soon recommendations.",
    customerText: "Brake pad thickness is measured in millimeters. Lower pad numbers mean the brakes are more worn.",
  },
  suspension: {
    title: "Steering & suspension",
    text: "Use OK / Rec and identify which suspension parts need attention. Notes appear in the customer report.",
    customerText: "Suspension issues can affect ride quality, tire wear and steering safety.",
  },
  alignment: {
    title: "Wheel alignment",
    text: "Mark whether alignment is OK or recommended, then choose the right ALG package for the estimate.",
    customerText: "Poor alignment can cause uneven tire wear and the vehicle pulling left or right.",
  },
  tpms: {
    title: "TPMS system",
    text: "Record whether the TPMS is OK or needs attention and add the TPM number if a sensor is involved.",
    customerText: "TPMS is the tire pressure monitoring system that warns the driver about low pressure or sensor faults.",
  },
};

export const DASHBOARD_QUICKSTART = [
  "Create a new work order from the blue New Vehicle button.",
  "Use Today's Jobs to see what is waiting, in progress, or done.",
  "Open any inspection complete screen to send the report and create an estimate.",
  "Use Customers and Vehicles to look up service history fast.",
];
