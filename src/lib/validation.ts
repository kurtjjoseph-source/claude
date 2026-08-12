import { z } from "zod";
import { ALL_JURISDICTIONS } from "@/lib/water/registry";

const yesNoUnknown = z.enum(["yes", "no", "unknown"]);

export const parcelInputSchema = z.object({
  label: z.string().trim().min(1, "Give the parcel a name").max(120),
  jurisdictionCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((c) => c in ALL_JURISDICTIONS, "Unsupported jurisdiction"),
  county: z.string().trim().min(1, "County is required").max(80),
  apn: z.string().trim().max(60).optional(),
  acres: z.number().positive("Acreage must be greater than zero").max(2_000_000),
  basinOrWatercourse: z.string().trim().max(120).optional(),

  buyerCountry: z.string().trim().toUpperCase().min(2).max(2).optional(),
  ownershipStructure: z
    .enum([
      "personal-freehold",
      "local-company",
      "foreign-company",
      "trust-or-fideicomiso",
      "long-lease",
      "joint-venture-with-national",
      "undecided",
    ])
    .optional(),
  hasLocalResidency: yesNoUnknown.optional(),

  intent: z.enum([
    "irrigated-crop",
    "pasture-grazing",
    "livestock",
    "domestic-homestead",
    "recharge-banking",
    "development",
    "conservation-hold",
  ]),
  intendedAcreFeet: z.number().nonnegative().max(1_000_000).optional(),
  irrigatedAcresPlanned: z.number().nonnegative().max(2_000_000).optional(),

  surfaceRight: z.enum([
    "none",
    "decreed-appropriative",
    "permitted-appropriative",
    "pre-1914-or-vested",
    "riparian",
    "ditch-company-shares",
    "federal-project-contract",
    "unknown",
  ]),
  priorityDate: z.string().trim().max(40).optional(),
  decreedAcreFeet: z.number().nonnegative().max(1_000_000).optional(),
  adjudication: z.enum([
    "fully-adjudicated",
    "adjudication-pending",
    "unadjudicated",
    "not-applicable",
    "unknown",
  ]),
  appurtenant: yesNoUnknown,
  previouslySevered: yesNoUnknown,

  wellStatus: z.enum([
    "none",
    "permitted-and-registered",
    "registered-only",
    "unregistered",
    "abandoned-or-unknown",
  ]),
  wellDepthFt: z.number().nonnegative().max(20_000).optional(),
  wellYieldGpm: z.number().nonnegative().max(100_000).optional(),
  aquiferTrend: z.enum(["rising", "stable", "declining", "steeply-declining", "unknown"]),
  inManagedDistrict: yesNoUnknown,

  documents: z.array(
    z.enum([
      "deed-with-water-language",
      "state-permit-or-decree",
      "well-log-and-completion-report",
      "historical-use-records",
      "pump-test",
      "engineers-report",
      "title-commitment",
      "ditch-company-share-certificate",
      "assessment-history",
      "survey",
      "water-quality-analysis",
    ]),
  ),
  documentedUseYears: z.number().nonnegative().max(200).optional(),
  longestNonUseGapYears: z.number().nonnegative().max(200).optional(),

  legalAccess: yesNoUnknown,
  mineralEstateSevered: yesNoUnknown,
  conservationEasement: yesNoUnknown,
  existingLiens: yesNoUnknown,
  tribalOrFederalClaimsInBasin: yesNoUnknown,

  askingPrice: z.number().nonnegative().max(10_000_000_000).optional(),
  closeTimelineDays: z.number().int().nonnegative().max(3650).optional(),
  financing: z.enum(["cash", "seller-carry", "bank", "1031-exchange", "undecided"]).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const holdingDraftSchema = z.object({
  label: z.string().trim().min(1).max(120),
  jurisdictionCode: z.string().trim().toUpperCase().min(2).max(6),
  county: z.string().trim().max(80).default(""),
  acres: z.number().nonnegative().max(2_000_000),
  stage: z.enum(["prospect", "diligence", "loi", "under-contract", "closed", "passed"]),
  reliableAcreFeet: z.number().nonnegative().max(1_000_000).nullable().default(null),
  irrigableAcres: z.number().nonnegative().max(2_000_000).nullable().default(null),
  price: z.number().nonnegative().max(10_000_000_000).nullable().default(null),
  composite: z.number().min(0).max(100).nullable().default(null),
  verdict: z.enum(["pursue", "investigate", "caution", "walk"]).nullable().default(null),
  input: parcelInputSchema.optional(),
});

export const holdingPatchSchema = holdingDraftSchema.partial();
