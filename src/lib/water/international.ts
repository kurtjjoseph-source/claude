import type { JurisdictionProfile } from "@/lib/types";

/**
 * Country-level jurisdictions outside the United States.
 *
 * The organising insight is that cross-border land acquisition inverts the
 * domestic risk order. Inside the US the water right is the hard part and
 * ownership is assumed. Abroad, the first question is whether a foreigner may
 * hold the interest at all — and in a meaningful number of countries the answer
 * is no, or only through a structure. A flawless water entitlement attached to
 * land you cannot lawfully own is worth nothing, and the usual workaround (a
 * local nominee holding title for you) is a criminal offence in several of
 * these places and unenforceable in most of the rest.
 *
 * Depth follows usefulness: countries where an outside buyer can actually
 * transact are modeled in detail; countries that are effectively closed are
 * included precisely so the engine can say so early and cheaply.
 *
 * This is diligence routing, not legal advice. Foreign investment rules change
 * faster than water law — Argentina, Romania and South Africa have all moved
 * within the last few years — so every checklist routes back to local counsel.
 */

export const INTERNATIONAL: Record<string, JurisdictionProfile> = {
  // =========================================================================
  // Latin America
  // =========================================================================

  CL: {
    code: "CL",
    name: "Chile",
    country: "Chile",
    region: "latin-america",
    subnational: false,
    subdivisionLabel: "Comuna / Región",
    areaUnitNote: "Transacted in hectares; 1 ha = 2.471 acres.",
    surfaceDoctrine: "tradable-entitlement",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Dirección General de Aguas",
      short: "DGA",
      role: "Grants and registers derechos de aprovechamiento de aguas, maintains the Catastro Público de Aguas, and declares areas of restriction and prohibition.",
      url: "https://dga.mop.gob.cl",
    },
    adjudicationForum: "DGA administrative process; Juntas de Vigilancia administer rivers; civil courts resolve disputes",
    forfeitureYears: 4,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Minor domestic and subsistence uses are exempt, but any productive abstraction needs a registered right.",
    transferability: "severable-freely",
    specialRegimes: [
      {
        name: "Water rights fully separable from land",
        effect:
          "Chile is the clearest case anywhere of water as a standalone asset: rights are registered, mortgageable, and traded independently of the land. The buyer's opportunity and the buyer's trap are the same fact — the farm you are viewing may have been sold away from its water years ago.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "2022 Water Code reform (Ley 21.435)",
        effect:
          "New rights are 30-year concessions rather than perpetual grants, human consumption takes statutory priority, and non-use triggers escalating patente fees and eventual extinction. Pre-reform perpetual rights are grandfathered but not immune to the non-use regime.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "Zonas de prohibición and áreas de restricción",
        effect:
          "Most productive aquifers are closed to new groundwater rights; supply comes only from buying an existing right and transferring it.",
        appliesTo: "Copiapó, Aconcagua, Petorca, La Ligua, Maipo and most of the north and centre",
        severity: "severe",
      },
      {
        name: "Decretos de escasez",
        effect:
          "Scarcity decrees let the DGA redistribute water irrespective of registered rights during declared shortage, which has become close to a permanent condition in the centre-north.",
        appliesTo: "Central and northern regions",
        severity: "high",
      },
    ],
    keyStatutes: ["Código de Aguas (DFL 1.122/1981)", "Ley 21.435 (2022 reform)", "DL 1.939 (border land)"],
    closedBasinRisk: "severe",
    cautions: [
      "Verify the right in the Catastro Público de Aguas and in the Conservador de Bienes Raíces separately. Chilean water rights are registered in two places and the records disagree more often than they should.",
      "Establish whether the right is consuntivo or no consuntivo, permanente or eventual, and superficial or subterráneo. These are four independent axes and they determine what you actually get in a dry year.",
      "South of Biobío, check for Mapuche land claims and CONADI-protected indigenous land, which cannot be transferred to non-indigenous buyers.",
    ],
    notes:
      "The most liquid water market in the Americas and the easiest major jurisdiction in the region for a foreign buyer — paired with the most severely over-allocated basins. Buy the water on its own merits; the land is almost secondary.",
    foreignOwnership: {
      regime: "unrestricted",
      summary:
        "Chile gives foreign buyers national treatment. No approval, no residency requirement, no cap on rural acreage, and water rights themselves may be foreign-held.",
      ruralLandRule: "No restriction on foreign ownership of agricultural or forestry land.",
      borderCoastalRule:
        "DL 1.939 bars nationals of neighbouring countries (Peru, Bolivia, Argentina) from acquiring land within 10 km of the land border and 5 km of the coast. Other nationalities are unaffected.",
      waterRightsForeignRule:
        "Foreigners may hold derechos de aprovechamiento outright, including separately from any land.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation:
        "Inbound capital is reported to the Banco Central under Chapter XIV; a RUT and a local legal representative are required to transact.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "moderate",
      customaryTenureRisk: "moderate",
      currencyControls: null,
      repatriationNote: "Capital and profits move freely; Chapter XIV registration is a reporting formality, not a control.",
      notes:
        "Institutionally the strongest in Latin America. The Conservador system proves title by chain rather than by state guarantee, so commission a ten-year estudio de títulos — title insurance is uncommon and no substitute.",
    },
  },

  UY: {
    code: "UY",
    name: "Uruguay",
    country: "Uruguay",
    region: "latin-america",
    subdivisionLabel: "Departamento",
    subnational: false,
    areaUnitNote: "Transacted in hectares. Land quality is quoted by CONEAT index — ask for it.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Dirección Nacional de Aguas (Ministerio de Ambiente)",
      short: "DINAGUA",
      role: "Grants water use permits and concessions and maintains the registry of authorised abstractions and reservoirs.",
      url: "https://www.gub.uy/ministerio-ambiente",
    },
    adjudicationForum: "Administrative determination by DINAGUA; contentious-administrative courts on appeal",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Stock and domestic abstraction below threshold is exempt; irrigation requires a permit tied to hectares served.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [
      {
        name: "Water as a constitutional human right",
        effect:
          "A 2004 constitutional amendment makes water a human right and reserves supply services to the state. Private irrigation is permitted, but the constitutional framing shapes how conflicts resolve.",
        appliesTo: "Nationwide",
        severity: "low",
      },
      {
        name: "Guaraní Aquifer",
        effect:
          "One of the largest freshwater aquifers on earth underlies much of the country, giving Uruguay genuine long-run water security relative to almost anywhere else in the hemisphere.",
        appliesTo: "Northern and central Uruguay",
        severity: "low",
      },
    ],
    keyStatutes: ["Ley 18.610 (Política Nacional de Aguas)", "Código de Aguas (DL 14.859)", "Ley 18.092 (rural land ownership)"],
    closedBasinRisk: "low",
    cautions: [
      "Ley 18.092 restricts rural land ownership to natural persons and to companies whose shares are nominative and held by natural persons. A bearer-share or opaque offshore vehicle cannot hold rural land — structure the purchase correctly from the outset.",
      "Irrigation permits are tied to a specific abstraction point and hectare count. Confirm the permitted area matches the area you intend to farm.",
      "Water is abundant but reservoir (represa) construction is the practical constraint on dry-summer cropping; check whether existing works are authorised.",
    ],
    notes:
      "The most straightforward jurisdiction in the region for a foreign buyer: no restrictions, strong institutions, abundant water, and a functioning land market. The trade-off is that this is priced in — Uruguay is not cheap relative to its neighbours.",
    foreignOwnership: {
      regime: "unrestricted",
      summary:
        "Full national treatment. Foreigners buy rural land on the same terms as Uruguayans, with no approval, no residency requirement and no acreage cap.",
      ruralLandRule:
        "Unrestricted as to nationality, but the *vehicle* is restricted: rural land must be held by natural persons or by companies with nominative shares held by natural persons (Ley 18.092).",
      borderCoastalRule: null,
      waterRightsForeignRule: "Water permits attach to the land and pass with it to a foreign owner without additional consent.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "A Uruguayan tax number (RUT/cédula) is needed; there is no foreign investment screening.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "No exchange controls. Capital and profits move freely in and out, and USD accounts are normal.",
      notes:
        "The most stable rule-of-law environment in South America, with an unusually clean rural land registry and an established escribano (notary) practice for conveyancing.",
    },
  },

  AR: {
    code: "AR",
    name: "Argentina",
    country: "Argentina",
    region: "latin-america",
    subdivisionLabel: "Provincia / Partido",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Provincial water authorities (e.g. Departamento General de Irrigación, Mendoza)",
      short: "DGI / provincial",
      role: "Water is provincial property, so the granting authority differs by province. Mendoza's DGI is the oldest and most developed irrigation administration in the country.",
      url: "https://www.argentina.gob.ar/ambiente/agua",
    },
    adjudicationForum: "Provincial administrative bodies; provincial courts",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic and stock use is generally exempt; irrigation wells require a provincial concession.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Water is provincial, not federal",
        effect:
          "There is no national water law of general application. Mendoza, San Juan, Córdoba and Buenos Aires each run different regimes, so a national-level answer to any water question is the wrong answer.",
        appliesTo: "Nationwide",
        severity: "moderate",
      },
      {
        name: "Mendoza / San Juan irrigation rights",
        effect:
          "Rights are attached to specific irrigated hectares and administered by inspecciones de cauce with turno (rotation) delivery. The paper right and the water actually delivered in a dry season diverge substantially.",
        appliesTo: "Cuyo region",
        severity: "high",
      },
    ],
    keyStatutes: ["Ley 26.737 (Régimen de Protección al Dominio Nacional sobre la Propiedad de Tierras Rurales)", "Provincial water codes"],
    closedBasinRisk: "high",
    cautions: [
      "Ley 26.737 makes rural land acquisition by foreigners a regulated act requiring clearance from the Registro Nacional de Tierras Rurales. Closing without it risks nullity.",
      "The same law prohibits foreign acquisition of rural land that contains or borders permanent and significant bodies of water — the single provision most likely to defeat a water-motivated purchase.",
      "Macroeconomic regime changes fast. Confirm the current exchange and capital-control position at the time of transacting rather than relying on last year's answer.",
    ],
    notes:
      "Genuinely good land and irrigation infrastructure at prices depressed by country risk. The foreign ownership statute is the gating item and it is aimed squarely at exactly the kind of water-rich parcel a buyer here would want.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "Foreign acquisition of rural land is capped nationally and locally, requires clearance, and is barred outright where significant water bodies are involved.",
      ruralLandRule:
        "Ley 26.737 caps foreign ownership at 15% of national rural land, with no more than 30% of that quota held by any one nationality, and limits any single foreign owner to the equivalent of 1,000 hectares in the core productive zone.",
      borderCoastalRule:
        "Separate border security zone rules apply near frontiers, and the statute bars foreign acquisition of rural land containing or adjoining permanent and significant bodies of water.",
      waterRightsForeignRule:
        "Provincial water concessions attach to the land; the binding constraint is the land restriction, not the water right.",
      approvalBody: {
        name: "Registro Nacional de Tierras Rurales",
        short: "RNTR",
        role: "Issues the certificate of clearance without which a rural conveyance to a foreign buyer cannot be registered.",
        url: "https://www.argentina.gob.ar/justicia/registros-nacionales",
      },
      approvalTimelineDays: 90,
      caps: "15% national ceiling; 1,000 ha equivalent per foreign owner in the núcleo zone.",
      nomineeWarning:
        "The statute reaches through to Argentine companies under foreign control. Using a local company to disguise foreign ownership does not work and creates a nullity risk on the title.",
      reportingObligation: "Registration with the RNTR is mandatory and ongoing.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "deeds-registry",
      titleReliability: "moderate",
      customaryTenureRisk: "moderate",
      currencyControls:
        "Argentina has repeatedly imposed and relaxed exchange controls. Assume friction on moving capital in and profits out, and verify the regime in force at signing.",
      repatriationNote:
        "Historically the binding practical constraint on returns has been the gap between official and parallel exchange rates rather than the asset itself.",
      notes:
        "Strong agronomy, weak macro. Structure for the currency risk explicitly and do not assume the rules at purchase will be the rules at exit.",
    },
  },

  PY: {
    code: "PY",
    name: "Paraguay",
    country: "Paraguay",
    region: "latin-america",
    subdivisionLabel: "Departamento / Distrito",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Ministerio del Ambiente y Desarrollo Sostenible",
      short: "MADES",
      role: "Grants water use permits and concessions under the water resources law and issues environmental licences for irrigation works.",
      url: "https://www.mades.gov.py",
    },
    adjudicationForum: "MADES administrative process; civil courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Small domestic and stock abstraction is exempt; commercial irrigation requires a permit.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [
      {
        name: "Guaraní Aquifer",
        effect: "Substantial groundwater availability in the eastern region, at accessible depths and with good quality.",
        appliesTo: "Eastern Paraguay",
        severity: "low",
      },
      {
        name: "Chaco water scarcity",
        effect:
          "The western Chaco is semi-arid with saline groundwater over much of its extent. Cattle operations depend on tajamares (surface catchment ponds) rather than wells, and that changes the whole feasibility calculation.",
        appliesTo: "Boquerón, Alto Paraguay, Presidente Hayes",
        severity: "high",
      },
    ],
    keyStatutes: ["Ley 3239/2007 (De los Recursos Hídricos)", "Ley 2532/2005 (Zona de Seguridad Fronteriza)"],
    closedBasinRisk: "low",
    cautions: [
      "Title fraud is the defining risk. Overlapping titles, duplicated fincas and forged chains are common enough that an independent title study going back decades is mandatory, not optional.",
      "Check whether the land is subject to INDERT (agrarian reform) claims or occupation by campesino settlements — a very common source of dispute on larger holdings.",
      "In the Chaco, confirm water before anything else. Land is cheap there for a reason.",
    ],
    notes:
      "Among the cheapest productive land in the hemisphere, with low taxes and an open door to foreigners. The discount is real and so are the reasons for it: title quality and institutional depth.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "Open to foreigners generally, with one significant carve-out aimed at nationals of neighbouring countries near the border.",
      ruralLandRule: "No nationality cap on rural land outside the border security zone.",
      borderCoastalRule:
        "Ley 2532/2005 bars nationals of bordering countries (Brazil, Argentina, Bolivia) from owning rural land within 50 km of the frontier. Other nationalities are unaffected.",
      waterRightsForeignRule: "Water permits run with the land and transfer to a foreign owner without separate consent.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "A Paraguayan cédula or RUC is required to register title.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "deeds-registry",
      titleReliability: "high",
      customaryTenureRisk: "high",
      currencyControls: null,
      repatriationNote: "No exchange controls; the guaraní is convertible and USD is widely used in land transactions.",
      notes:
        "Low tax, low cost, low institutional capacity. Budget properly for title work and for a local partner you have independently verified.",
    },
  },

  BR: {
    code: "BR",
    name: "Brazil",
    country: "Brazil",
    region: "latin-america",
    subdivisionLabel: "Estado / Município",
    subnational: false,
    areaUnitNote: "Transacted in hectares; rural limits are expressed in módulos fiscais, which vary by município.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Agência Nacional de Águas e Saneamento Básico and state water agencies",
      short: "ANA",
      role: "Issues outorgas de direito de uso for federal waters; state agencies do the same for state waters. Determining which applies is the first question on any parcel.",
      url: "https://www.gov.br/ana",
    },
    adjudicationForum: "Administrative determination by ANA or the state agency; federal and state courts",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote: "Insignificant uses (usos insignificantes) are exempt, with thresholds set differently by each state.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Outorga is time-limited",
        effect:
          "Water use grants run for a defined term (commonly up to 35 years) and are revocable. They are not perpetual property rights and their renewal is not guaranteed.",
        appliesTo: "Nationwide",
        severity: "moderate",
      },
      {
        name: "Reserva Legal and CAR",
        effect:
          "The Forest Code requires a fixed share of every rural property to remain under native vegetation — 20% in most of the country, 35% in Cerrado within Legal Amazonia and 80% in Amazon forest. Registration in the CAR is mandatory and the deficit is the buyer's liability.",
        appliesTo: "All rural property",
        severity: "high",
      },
      {
        name: "MATOPIBA frontier",
        effect:
          "The Cerrado frontier across Maranhão, Tocantins, Piauí and Bahia is where the cheap-land-plus-water thesis lives, and also where land-grabbing (grilagem) and overlapping titles are most concentrated.",
        appliesTo: "Cerrado frontier states",
        severity: "high",
      },
    ],
    keyStatutes: ["Lei 9.433/1997 (Política Nacional de Recursos Hídricos)", "Lei 5.709/1971 (foreign acquisition of rural land)", "Lei 12.651/2012 (Código Florestal)"],
    closedBasinRisk: "moderate",
    cautions: [
      "The legal position on foreign ownership has genuinely oscillated. Lei 5.709/1971 was long read narrowly, then AGU Opinion LA-01/2010 extended it to Brazilian companies under foreign control, and the question has been litigated since. Get a current opinion before committing capital.",
      "Verify georeferencing and CAR registration, and reconcile the registered area against the surveyed area. Discrepancies are routine and block financing and transfer.",
      "Check the outorga's expiry date and renewal history. Buying a farm whose water grant expires in three years is buying a renewal application.",
    ],
    notes:
      "Extraordinary agronomic potential and real water in the Cerrado, wrapped in the most legally uncertain foreign-ownership regime in the region. The uncertainty itself is the risk — not a prohibition, but an unresolved question that can freeze an exit.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "Rural land acquisition by foreigners and by foreign-controlled Brazilian companies is capped and requires INCRA authorisation, with congressional approval above thresholds.",
      ruralLandRule:
        "Lei 5.709/1971 limits an individual foreign buyer to 50 módulos fiscais, caps foreign-held land at 25% of any município's area with no more than 40% of that held by a single nationality, and requires INCRA authorisation.",
      borderCoastalRule:
        "The 150 km border strip (faixa de fronteira) requires additional clearance from the national defence council for acquisitions by foreigners.",
      waterRightsForeignRule:
        "Outorgas attach to the use and the property; the binding constraint is the land restriction.",
      approvalBody: {
        name: "Instituto Nacional de Colonização e Reforma Agrária",
        short: "INCRA",
        role: "Authorises foreign acquisition of rural land and maintains the register of foreign-held rural property.",
        url: "https://www.gov.br/incra",
      },
      approvalTimelineDays: 180,
      caps: "50 módulos fiscais per foreign individual; 25% of each município in aggregate.",
      nomineeWarning:
        "The 2010 AGU opinion reaches Brazilian companies under foreign control, so a local SPV does not reliably sidestep the limits and may itself be void.",
      reportingObligation: "Foreign-held rural property must be registered with INCRA and reported quarterly by the notary.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "deeds-registry",
      titleReliability: "high",
      customaryTenureRisk: "high",
      currencyControls: null,
      repatriationNote:
        "Register the inbound investment with the Banco Central (RDE) at the time of entry — failing to do so is the classic way to trap capital that is otherwise freely repatriable.",
      notes:
        "Title fraud, indigenous and quilombola claims, and environmental liability that runs with the land (propter rem) are the three recurring ways Brazilian farmland deals go wrong after closing.",
    },
  },

  PE: {
    code: "PE",
    name: "Peru",
    country: "Peru",
    region: "latin-america",
    subdivisionLabel: "Región / Provincia",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Autoridad Nacional del Agua",
      short: "ANA",
      role: "Grants licencias de uso de agua, administers the Registro Administrativo de Derechos de Uso de Agua, and declares aquifer closures.",
      url: "https://www.gob.pe/ana",
    },
    adjudicationForum: "ANA administrative process through Autoridades Administrativas del Agua; Tribunal Nacional de Resolución de Controversias Hídricas",
    forfeitureYears: 2,
    permitRequiredForNewWells: true,
    exemptWellNote: "Primary (subsistence) use is exempt; all productive use requires a licence.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Aquifer vedas on the coast",
        effect:
          "The coastal desert valleys that grow Peru's export crops sit on aquifers that are formally closed to new abstraction and materially over-drafted. Ica is the emblematic case: an asparagus and blueberry boom on a falling water table.",
        appliesTo: "Ica, Villacurí, Lambayeque and most coastal valleys",
        severity: "severe",
      },
      {
        name: "Irrigation megaprojects",
        effect:
          "State schemes such as Olmos, Chavimochic and Majes-Siguas sell serviced, water-entitled desert land at auction. This is one of the few routes anywhere to acquire land with a contractually defined water supply attached from day one.",
        appliesTo: "North and south coast",
        severity: "moderate",
      },
    ],
    keyStatutes: ["Ley 29338 (Ley de Recursos Hídricos)", "Constitución art. 71 (border land)"],
    closedBasinRisk: "severe",
    cautions: [
      "Water licences are tied to a specific hectare count, crop and abstraction point. Changing any of them needs ANA approval, and on the coast the answer is frequently no.",
      "Confirm whether the land sits inside a formal irrigation scheme with a contractual water allotment or outside it relying on a private well in a closed aquifer. These are entirely different assets at similar prices.",
      "Community (comunidad campesina) land requires a qualified-majority assembly vote to transfer, and transfers done without it are void.",
    ],
    notes:
      "World-class coastal agronomy — light, heat and export logistics — undermined by aquifers that cannot support what is already planted. Buy inside a scheme with contracted water or do not buy.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "National treatment for foreigners generally, with an absolute constitutional bar within 50 km of the border.",
      ruralLandRule: "No nationality cap on agricultural land outside the border zone.",
      borderCoastalRule:
        "Constitution art. 71 prohibits foreigners from acquiring or holding land, water, mines, forests or energy sources within 50 km of the frontier, except by supreme decree declaring public necessity.",
      waterRightsForeignRule: "Licences may be held by foreign-owned Peruvian entities on the same terms as nationals.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning:
        "The border-zone prohibition is constitutional and cannot be cured by using a Peruvian company; acquisitions in breach are void and the property reverts to the state.",
      reportingObligation: "A Peruvian RUC and local representation are needed to transact.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "deeds-registry",
      titleReliability: "moderate",
      customaryTenureRisk: "high",
      currencyControls: null,
      repatriationNote: "No exchange controls; the sol is convertible and USD accounts are standard.",
      notes:
        "Political volatility is high but property rights have held up in practice. The real recurring problem is community land claims over formally titled rural property.",
    },
  },

  MX: {
    code: "MX",
    name: "Mexico",
    country: "Mexico",
    region: "latin-america",
    subdivisionLabel: "Estado / Municipio",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Comisión Nacional del Agua",
      short: "CONAGUA",
      role: "Grants water concessions, maintains the REPDA public registry of water rights, and declares aquifer closures and reserve zones.",
      url: "https://www.gob.mx/conagua",
    },
    adjudicationForum: "CONAGUA administrative process; federal administrative courts",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic and small stock use is exempt; everything productive requires a título de concesión.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "The water concession is a separate asset from the land",
        effect:
          "A Mexican farm's water is a CONAGUA concession recorded in REPDA under a title number. It does not pass automatically with the deed — the transmisión de derechos must be filed and approved. Buyers who skip this acquire dry land.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
      {
        name: "Aquifer vedas and overexploitation",
        effect:
          "A large share of Mexico's aquifers are formally closed or in documented overdraft, especially in the north and the Bajío. New concessions in those zones are effectively unobtainable.",
        appliesTo: "Chihuahua, Guanajuato, Querétaro, La Laguna, Baja California",
        severity: "severe",
      },
      {
        name: "Ejido and comunidad land",
        effect:
          "Roughly half the national territory is social property. An ejido parcel cannot be sold to an outsider until it has passed through dominio pleno conversion by assembly resolution and been registered. Purchases short of that are void, however convincing the paperwork looks.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Ley de Aguas Nacionales", "Constitución art. 27", "Ley Agraria"],
    closedBasinRisk: "severe",
    cautions: [
      "Pull the REPDA record for the concession title number and confirm volume, use, expiry and that the holder is the seller. This is a public search and it disqualifies a lot of listings.",
      "For any parcel that was ever ejidal, trace the dominio pleno resolution and its registration. This is the single most common defect in Mexican rural title.",
      "Inside the restricted zone, a fideicomiso is the normal and lawful route for individuals — but a Mexican corporation is usually better for productive agricultural land held at scale.",
    ],
    notes:
      "Excellent winter production, proximity to the US market, and a water regime where the entitlement is explicitly separable from the land — which rewards careful buyers and punishes casual ones severely.",
    foreignOwnership: {
      regime: "structure-required",
      summary:
        "Foreigners may own land directly outside the restricted zone with a permit; inside it they must use a bank trust or a Mexican company.",
      ruralLandRule:
        "Outside the restricted zone, foreigners may hold agricultural land directly after obtaining a permit from the Secretaría de Relaciones Exteriores and agreeing the Calvo clause.",
      borderCoastalRule:
        "Within 100 km of any land border and 50 km of any coastline, Article 27 bars direct foreign freehold. Individuals use a fideicomiso (renewable 50-year bank trust); a Mexican corporation with foreign shareholders may hold directly for non-residential use.",
      waterRightsForeignRule:
        "CONAGUA concessions may be held by Mexican companies with foreign shareholders; transfer requires CONAGUA approval regardless of nationality.",
      approvalBody: {
        name: "Secretaría de Relaciones Exteriores",
        short: "SRE",
        role: "Issues the permit for foreign acquisition and for incorporating a company with a foreigners-admission clause.",
        url: "https://www.gob.mx/sre",
      },
      approvalTimelineDays: 45,
      caps: null,
      nomineeWarning:
        "Holding through a Mexican friend or a prestanombre is unenforceable and the classic way foreign buyers lose coastal property outright.",
      reportingObligation: "Foreign-invested companies register with the Registro Nacional de Inversiones Extranjeras and file periodically.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "deeds-registry",
      titleReliability: "moderate",
      customaryTenureRisk: "severe",
      currencyControls: null,
      repatriationNote: "No exchange controls; the peso is freely convertible.",
      notes:
        "The dominant risk is not the state taking your land, it is discovering that the seller never had clean title to begin with because the chain runs back into ejido property.",
    },
  },

  // =========================================================================
  // North America
  // =========================================================================

  CA: {
    code: "CA",
    name: "Canada",
    country: "Canada",
    region: "canada",
    subdivisionLabel: "Province / Rural municipality",
    subnational: false,
    areaUnitNote: "Prairie farmland is transacted in acres; Quebec uses hectares.",
    surfaceDoctrine: "prior-appropriation",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Provincial water authorities (Alberta Environment, Saskatchewan WSA, BC Ministry of Water)",
      short: "Provincial",
      role: "Water is a provincial matter. The prairie provinces run first-in-time-first-in-right licensing that will feel familiar to a buyer from the western US.",
      url: "https://www.canada.ca/en/environment-climate-change.html",
    },
    adjudicationForum: "Provincial administrative tribunals; superior courts on appeal",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote:
      "Domestic and stock use is generally exempt or registered rather than licensed; thresholds differ by province.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Alberta's closed basins and licence transfers",
        effect:
          "The South Saskatchewan River Basin has been closed to new allocations since 2006. New water comes only from buying and transferring an existing licence, with a 10% conservation holdback on transfer.",
        appliesTo: "Bow, Oldman, South Saskatchewan sub-basins",
        severity: "severe",
      },
      {
        name: "BC groundwater licensing transition",
        effect:
          "The Water Sustainability Act brought groundwater into licensing, and existing users who failed to apply by the 2022 deadline lost their historical priority date. Verify a well's licence status and its priority date, not just that a well exists.",
        appliesTo: "British Columbia",
        severity: "high",
      },
    ],
    keyStatutes: ["Alberta Water Act", "Saskatchewan Water Security Agency Act", "BC Water Sustainability Act 2016", "Saskatchewan Farm Security Act"],
    closedBasinRisk: "high",
    cautions: [
      "Farmland ownership rules are provincial and some are strict enough to be prohibitive. Saskatchewan and Alberta in particular are close to closed for non-resident buyers.",
      "In Alberta the licence and the land are separate; confirm the licence transfers and whether the 10% holdback applies.",
      "The federal ban on foreign purchases of residential property does not generally cover farmland, but it does catch some acreages with dwellings near urban areas.",
    ],
    notes:
      "Water administration a US buyer will find legible, attached to a farmland ownership regime that varies from open to effectively closed depending on which province you land in.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "No federal bar on farmland, but several provinces cap non-resident holdings at levels that rule out commercial-scale acquisition.",
      ruralLandRule:
        "Saskatchewan limits non-Canadians to 10 acres of farmland; Alberta limits foreign persons to 2 parcels totalling 20 acres of controlled land; Manitoba caps non-residents at 40 acres; Quebec requires CPTAQ approval; PEI has aggregate ceilings. Ontario, Nova Scotia and New Brunswick are open.",
      borderCoastalRule: null,
      waterRightsForeignRule:
        "Provincial licences attach to the land or the works and transfer with them, subject to provincial approval.",
      approvalBody: {
        name: "Provincial farmland boards (e.g. Saskatchewan Farm Land Security Board)",
        short: "Provincial",
        role: "Reviews and approves or refuses acquisitions of farmland by non-residents and non-Canadian entities.",
        url: "https://www.saskatchewan.ca",
      },
      approvalTimelineDays: 90,
      caps: "Saskatchewan 10 acres; Alberta 20 acres; Manitoba 40 acres.",
      nomineeWarning:
        "Saskatchewan's board actively investigates beneficial ownership and has forced divestitures of land held through Canadian intermediaries for foreign principals.",
      reportingObligation: "Provincial declarations of residency and beneficial ownership are required on transfer.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "torrens",
      titleReliability: "low",
      customaryTenureRisk: "moderate",
      currencyControls: null,
      repatriationNote: "No controls; withholding applies to non-resident rental income and on disposition.",
      notes:
        "Torrens registration in the western provinces makes title about as reliable as it gets. Indigenous title and treaty land entitlement claims are a real consideration on some prairie and BC parcels.",
    },
  },

  // =========================================================================
  // Oceania
  // =========================================================================

  AU: {
    code: "AU",
    name: "Australia",
    country: "Australia",
    region: "oceania",
    subdivisionLabel: "State / Local government area",
    subnational: false,
    areaUnitNote: "Transacted in hectares; water in megalitres (1 ML = 0.81 acre-feet).",
    surfaceDoctrine: "tradable-entitlement",
    groundwaterRegime: "appropriation",
    agency: {
      name: "State water authorities and the Murray-Darling Basin Authority",
      short: "State / MDBA",
      role: "States issue and register water access entitlements and annual allocations; the MDBA sets the Basin Plan caps that constrain them.",
      url: "https://www.mdba.gov.au",
    },
    adjudicationForum: "State administrative tribunals; water registers are conclusive as to entitlement",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Stock and domestic bores are a basic right in most states and do not require an entitlement.",
    transferability: "severable-freely",
    specialRegimes: [
      {
        name: "Unbundled water entitlements",
        effect:
          "Water is fully separated from land title, registered on a state water register, and traded on a deep, screen-based market. This is the most mature water market in the world and prices are transparent — you can look up what a megalitre traded for last week.",
        appliesTo: "Murray-Darling Basin states",
        severity: "moderate",
      },
      {
        name: "Entitlement versus allocation",
        effect:
          "Holding a 1,000 ML high-security entitlement does not mean receiving 1,000 ML. Seasonal allocation is announced as a percentage and general-security allocations have opened at zero in drought years. Underwrite the ten-year allocation history, not the face value.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "Basin Plan recovery and carryover rules",
        effect:
          "Commonwealth buybacks and efficiency programmes have removed substantial volumes from consumptive use, and carryover rules differ by valley in ways that materially change the value of an entitlement.",
        appliesTo: "Murray-Darling Basin",
        severity: "moderate",
      },
    ],
    keyStatutes: ["Water Act 2007 (Cth)", "Basin Plan 2012", "Foreign Acquisitions and Takeovers Act 1975", "State water management Acts"],
    closedBasinRisk: "high",
    cautions: [
      "Buy the entitlement class deliberately. High security, general security, supplementary and groundwater entitlements in the same valley behave completely differently in a dry year.",
      "Foreign holdings of both agricultural land and water entitlements must be recorded on the ATO's register. Non-registration carries penalties and is easy to overlook.",
      "Check delivery capacity and channel access separately from the entitlement — owning water you cannot physically get to the paddock is a known failure mode.",
    ],
    notes:
      "The global reference case for water as a tradable asset class: transparent pricing, a reliable register, and genuine liquidity. Also a continent where allocations have gone to zero within living memory.",
    foreignOwnership: {
      regime: "approval-required",
      summary:
        "Open to foreign buyers but screened. Agricultural land and water entitlements both sit inside the foreign investment regime and both must be registered.",
      ruralLandRule:
        "FIRB approval is required for agricultural land acquisitions above a cumulative A$15m threshold, with higher thresholds for certain free-trade-agreement partners and a zero threshold for foreign government investors. Agricultural land must generally be offered to Australian bidders for at least 30 days first.",
      borderCoastalRule: null,
      waterRightsForeignRule:
        "Foreigners may hold water entitlements outright, including separately from land — but registrable interests in water must be reported to the ATO register.",
      approvalBody: {
        name: "Foreign Investment Review Board",
        short: "FIRB",
        role: "Screens foreign acquisitions of agricultural land and agribusiness against the national interest test.",
        url: "https://firb.gov.au",
      },
      approvalTimelineDays: 30,
      caps: "A$15m cumulative agricultural land threshold; nil for foreign government investors.",
      nomineeWarning: null,
      reportingObligation:
        "Register of Foreign Ownership of Australian Assets: agricultural land and water entitlements must both be registered with the ATO within 30 days.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "torrens",
      titleReliability: "low",
      customaryTenureRisk: "moderate",
      currencyControls: null,
      repatriationNote: "No controls. Withholding applies on disposal by non-residents.",
      notes:
        "Torrens title with a state guarantee, and a separate water register that is equally conclusive. Native title and Indigenous Land Use Agreements can affect pastoral leasehold — which is what most inland 'farmland' actually is.",
    },
  },

  NZ: {
    code: "NZ",
    name: "New Zealand",
    country: "New Zealand",
    region: "oceania",
    subdivisionLabel: "Region / District",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Regional councils (e.g. Environment Canterbury)",
      short: "Regional council",
      role: "Grant resource consents to take and use water under the Resource Management Act. Consents are time-limited and conditional.",
      url: "https://environment.govt.nz",
    },
    adjudicationForum: "Environment Court",
    forfeitureYears: 5,
    permitRequiredForNewWells: true,
    exemptWellNote: "Reasonable domestic and stock use is permitted as of right; everything else needs a consent.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Consents are time-limited and not property",
        effect:
          "A water take consent runs for a fixed term, commonly 15 to 35 years, and there is no guaranteed right of renewal. Value it as a depreciating licence, not as a perpetual entitlement.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "Over-allocated Canterbury aquifers",
        effect:
          "The dairy conversion boom fully allocated much of the Canterbury Plains, and nutrient limits under the National Policy Statement for Freshwater now constrain how consented water can be used.",
        appliesTo: "Canterbury, Otago, Hawke's Bay",
        severity: "severe",
      },
    ],
    keyStatutes: ["Resource Management Act 1991", "Overseas Investment Act 2005", "National Policy Statement for Freshwater Management"],
    closedBasinRisk: "severe",
    cautions: [
      "The Overseas Investment Act is the gate, and for rural land it is a high one. Assume a lengthy, expensive process with a genuine prospect of refusal.",
      "Nutrient allocation now binds as tightly as water allocation. A farm with water but no nitrogen headroom cannot intensify.",
      "Māori freehold land is governed by Te Ture Whenua Māori Act and is subject to alienation restrictions that make it effectively untradeable to outside buyers.",
    ],
    notes:
      "Superb pastoral agronomy and reliable rainfall, behind one of the most restrictive foreign investment screens in the developed world. Realistically closed to passive foreign buyers.",
    foreignOwnership: {
      regime: "approval-required",
      summary:
        "Consent from the Overseas Investment Office is required for essentially all rural land, and applicants must demonstrate substantial benefit to New Zealand.",
      ruralLandRule:
        "Non-urban land over 5 hectares is 'sensitive land' requiring consent. The benefit-to-New-Zealand test demands new investment, jobs or exports — passive land banking will not pass.",
      borderCoastalRule:
        "Land adjoining reserves, lakes and the foreshore is separately sensitive regardless of size.",
      waterRightsForeignRule:
        "Consents attach to the land and pass with it; there is no separate market in water entitlements.",
      approvalBody: {
        name: "Overseas Investment Office (Land Information New Zealand)",
        short: "OIO",
        role: "Assesses and grants or refuses consent for overseas investment in sensitive land.",
        url: "https://www.linz.govt.nz/overseas-investment",
      },
      approvalTimelineDays: 150,
      caps: null,
      nomineeWarning:
        "Consent conditions are monitored and enforced, and the OIO has ordered divestment where the benefit conditions were not met.",
      reportingObligation: "Ongoing compliance reporting against the conditions of consent.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "torrens",
      titleReliability: "low",
      customaryTenureRisk: "moderate",
      currencyControls: null,
      repatriationNote: "No controls.",
      notes: "Impeccable title and institutions; the constraint is entry, not security once you are in.",
    },
  },

  // =========================================================================
  // Europe
  // =========================================================================

  PT: {
    code: "PT",
    name: "Portugal",
    country: "Portugal",
    region: "europe",
    subdivisionLabel: "Distrito / Concelho",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Agência Portuguesa do Ambiente",
      short: "APA",
      role: "Issues the título de utilização de recursos hídricos required for any abstraction, and administers the river basin districts.",
      url: "https://apambiente.pt",
    },
    adjudicationForum: "Administrative determination by APA; administrative courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Small domestic abstraction is subject to a lighter registration regime rather than full licensing.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Alqueva irrigation scheme",
        effect:
          "Europe's largest artificial reservoir underwrites a contracted irrigation network across the Alentejo, turning historically dry land into reliably watered permanent-crop ground. Land inside the perimeter is a fundamentally different asset from land outside it.",
        appliesTo: "Alentejo",
        severity: "moderate",
      },
      {
        name: "Desertification and drought trend",
        effect:
          "Southern Portugal is drying measurably. Abstraction licences have been curtailed in drought years and the trend is not favourable.",
        appliesTo: "Algarve, southern Alentejo",
        severity: "high",
      },
    ],
    keyStatutes: ["Lei da Água (Lei 58/2005)", "Decreto-Lei 226-A/2007 (títulos de utilização)"],
    closedBasinRisk: "moderate",
    cautions: [
      "Establish whether the parcel is inside the Alqueva perimeter and holds a contracted allocation with EDIA. Outside it, you depend on a private borehole and a licence that can be curtailed.",
      "Rural properties frequently have undocumented boreholes. An unlicensed abstraction is a liability that transfers with the land.",
      "Check the Caderneta Predial and the Registo Predial against each other; rural boundary descriptions in the interior are often historic and imprecise.",
    ],
    notes:
      "The most accessible entry point in Western Europe: no ownership restrictions at all, low prices in the interior, and — inside the Alqueva perimeter — genuinely contracted water in a Mediterranean climate.",
    foreignOwnership: {
      regime: "unrestricted",
      summary:
        "Complete national treatment for EU and non-EU buyers alike. No approval, no residency requirement, no rural land cap.",
      ruralLandRule: "No nationality restriction on agricultural or forestry land.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Abstraction titles transfer with the property to a foreign owner without additional consent.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "A Portuguese NIF is required; there is no investment screening for agricultural land.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "Euro; free movement of capital.",
      notes:
        "EU legal framework, straightforward notarial conveyancing, and an unusually welcoming posture toward non-EU buyers of rural land.",
    },
  },

  ES: {
    code: "ES",
    name: "Spain",
    country: "Spain",
    region: "europe",
    subdivisionLabel: "Comunidad / Provincia",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Confederaciones Hidrográficas",
      short: "CHS",
      role: "Basin authorities grant concesiones, maintain the Registro de Aguas, and police unlawful abstraction.",
      url: "https://www.miteco.gob.es/es/agua.html",
    },
    adjudicationForum: "Basin authority administrative process; contentious-administrative courts",
    forfeitureYears: 3,
    permitRequiredForNewWells: true,
    exemptWellNote: "Abstraction under 7,000 m³/year from private land is a lighter-touch aprovechamiento rather than a full concession.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Contratos de cesión de derechos",
        effect:
          "Spain permits temporary transfers of water rights between holders within a basin, and has operated formal water banks in drought years. It is not a Chilean or Australian market, but it is not a closed system either.",
        appliesTo: "Segura, Júcar, Guadalquivir and Tagus basins",
        severity: "moderate",
      },
      {
        name: "Illegal wells and aquifer overdraft",
        effect:
          "Tens of thousands of unregistered boreholes operate nationally. Enforcement has intensified sharply, most visibly around Doñana, and closure of an unlawful well destroys the value of the land it irrigates.",
        appliesTo: "Doñana, Mancha Occidental, Almería, Murcia",
        severity: "severe",
      },
    ],
    keyStatutes: ["Real Decreto Legislativo 1/2001 (Texto Refundido de la Ley de Aguas)", "Ley 8/1975 (defence zones)"],
    closedBasinRisk: "severe",
    cautions: [
      "Verify the abstraction in the Registro de Aguas or the Catálogo de Aguas Privadas. If the seller cannot produce the inscription, treat the well as unlawful until proven otherwise.",
      "Reconcile the concession's authorised volume and irrigated hectares against what is actually planted. Over-planting relative to the concession is widespread and it is the buyer who inherits the exposure.",
      "The Segura and Almería regions depend on inter-basin transfers that are perennially contested politically.",
    ],
    notes:
      "Deep agricultural infrastructure and export logistics on top of some of Europe's most stressed aquifers, with an enforcement regime that has recently found its teeth. The water inscription is the whole diligence.",
    foreignOwnership: {
      regime: "unrestricted",
      summary: "National treatment for EU and non-EU buyers of agricultural land.",
      ruralLandRule: "No nationality restriction on farmland.",
      borderCoastalRule:
        "Ley 8/1975 still requires military authorisation for non-EU acquisition of land in a small number of designated defence-interest zones, chiefly border strips and parts of the islands.",
      waterRightsForeignRule: "Concessions transfer with the land subject to basin authority approval, irrespective of nationality.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "An NIE is required; substantial foreign investments are declared to the Registro de Inversiones.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "Euro; free movement of capital.",
      notes: "Reliable Registro de la Propiedad and notarial practice. The risk here is hydrological and regulatory, not legal.",
    },
  },

  RO: {
    code: "RO",
    name: "Romania",
    country: "Romania",
    region: "europe",
    subdivisionLabel: "Județ / Comună",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Administrația Națională Apele Române",
      short: "ANAR",
      role: "Issues water management permits and authorisations; ANIF operates the state irrigation infrastructure.",
      url: "https://rowater.ro",
    },
    adjudicationForum: "Administrative process; administrative courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Household wells are exempt; agricultural abstraction requires authorisation.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [
      {
        name: "Decayed irrigation infrastructure",
        effect:
          "Romania has extensive Communist-era irrigation works, much of it non-functional. Rehabilitation is subsidised in designated zones, so whether a parcel sits inside a functioning ANIF scheme matters more than its water rights on paper.",
        appliesTo: "Danube plain, Dobrogea",
        severity: "high",
      },
    ],
    keyStatutes: ["Legea apelor 107/1996", "Legea 17/2014 as amended by Legea 175/2020"],
    closedBasinRisk: "low",
    cautions: [
      "Law 17/2014 as amended imposes a pre-emption cascade — co-owners, tenants, neighbouring owners, young farmers, then the state — and each sale must be advertised at the town hall and cleared through it.",
      "The 2020 amendments added residency, qualification and activity conditions for buyers, plus an eight-year holding period enforced by an 80% tax on the gain from an earlier resale.",
      "Restitution claims from the post-Communist land returns still surface on rural titles. Insist on a full history rather than a current extract.",
    ],
    notes:
      "Some of Europe's best black soil at a fraction of Western European prices, gated by a pre-emption and eligibility regime that was deliberately designed to slow foreign acquisition.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "EU nationals have formal rights of establishment, but the 2020 amendments impose eligibility conditions that catch most fresh foreign buyers, and non-EU buyers face reciprocity requirements.",
      ruralLandRule:
        "Individuals must show residence in Romania for at least five years, agricultural qualifications and five years of agricultural activity; legal entities face parallel conditions and shareholder-residency tests.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Water authorisations follow the land.",
      approvalBody: {
        name: "Ministry of Agriculture and Rural Development",
        short: "MADR",
        role: "Issues the approval required to complete an agricultural land sale outside the built-up area.",
        url: "https://www.madr.ro",
      },
      approvalTimelineDays: 60,
      caps: null,
      nomineeWarning:
        "Buying through a Romanian company does not avoid the conditions; the amendments apply shareholder tests to entities.",
      reportingObligation: "Sales must be published at the local town hall and cleared through the pre-emption procedure.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "mixed",
      titleReliability: "moderate",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "EU member state; free movement of capital.",
      notes:
        "Cadastral coverage is incomplete in rural areas and fragmented ownership from restitution means a single field can have many co-owners, each with a pre-emption right.",
    },
  },

  FR: {
    code: "FR",
    name: "France",
    country: "France",
    region: "europe",
    subdivisionLabel: "Département / Commune",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Agences de l'eau and DDT prefectural services",
      short: "Agence de l'eau",
      role: "Authorise abstraction, levy water charges, and administer the volumetric allocations distributed through Organismes Uniques de Gestion Collective.",
      url: "https://www.eaufrance.fr",
    },
    adjudicationForum: "Prefectural administrative process; administrative courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic wells require declaration to the commune; agricultural abstraction requires authorisation.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "SAFER pre-emption",
        effect:
          "Regional land agencies hold a pre-emption right over farmland sales and can substitute themselves for the buyer at a price they may ask a court to revise. Every rural transaction must be notified to them.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
      {
        name: "Zones de répartition des eaux",
        effect:
          "In designated water-scarce zones, irrigation volumes are collectively capped and allocated annually by a single management body, and new abstraction is effectively unavailable.",
        appliesTo: "Poitou-Charentes, Beauce, south-west",
        severity: "high",
      },
    ],
    keyStatutes: ["Code rural (SAFER pre-emption)", "Loi Sempastous 2021 (share transfers)", "Code de l'environnement"],
    closedBasinRisk: "high",
    cautions: [
      "SAFER is the reason French farmland does not trade freely. Engage with the local SAFER early rather than discovering the pre-emption at signing.",
      "The Sempastous law closed the company-share route that buyers previously used to avoid pre-emption on large holdings.",
      "Vineyard purchases carry appellation rules that constrain planting rights independently of land and water.",
    ],
    notes:
      "No nationality bar at all, but a structural preference for local farmers that makes assembling a large holding as an outsider genuinely difficult. The obstacle is institutional, not legal.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "No nationality restriction, but SAFER pre-emption gives the state-sanctioned land agency a right to displace any buyer of farmland.",
      ruralLandRule:
        "Every agricultural land sale must be notified to SAFER, which may pre-empt in favour of a local farmer. Large acquisitions and share deals are additionally controlled under the Sempastous law.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Abstraction authorisations follow the holding and the collective allocation body.",
      approvalBody: {
        name: "Sociétés d'aménagement foncier et d'établissement rural",
        short: "SAFER",
        role: "Reviews every notified farmland sale and may exercise pre-emption to redirect the land to a local farmer.",
        url: "https://www.safer.fr",
      },
      approvalTimelineDays: 60,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "Mandatory notification of every rural conveyance.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "Euro; free movement of capital.",
      notes: "Excellent registers and notarial practice; the friction is the agrarian policy layer, which is deliberate.",
    },
  },

  GE: {
    code: "GE",
    name: "Georgia",
    country: "Georgia",
    region: "europe",
    subdivisionLabel: "Region / Municipality",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "appropriation",
    agency: {
      name: "Ministry of Environmental Protection and Agriculture",
      short: "MEPA",
      role: "Administers water use and abstraction licensing.",
      url: "https://mepa.gov.ge",
    },
    adjudicationForum: "Administrative process; common courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Household abstraction is unregulated in practice.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [
      {
        name: "Abundant water, cheap land",
        effect:
          "Georgia has genuine water surplus by regional standards, with substantial river flow from the Caucasus and an under-developed irrigation base.",
        appliesTo: "Nationwide",
        severity: "low",
      },
    ],
    keyStatutes: ["Law on Water", "Law on Ownership of Agricultural Land (2019)", "Constitution art. 19"],
    closedBasinRisk: "low",
    cautions: [
      "Agricultural land is constitutionally reserved to the state, Georgian citizens and Georgian legal entities owned by citizens. A foreign-owned Georgian company cannot hold it.",
      "Non-agricultural land is genuinely open, so the classification of the parcel is the entire question — and reclassification is discretionary.",
      "Verify the cadastral registration; the register is modern and efficient, which is one of the country's real strengths.",
    ],
    notes:
      "Water-rich, cheap and administratively efficient — and constitutionally closed to foreign buyers of farmland. Included so the wizard says so before anyone books a flight.",
    foreignOwnership: {
      regime: "prohibited",
      summary:
        "Foreign nationals and foreign-controlled entities may not own agricultural land. This is a constitutional bar, not a policy that flexes.",
      ruralLandRule:
        "Agricultural land may be owned only by the state, Georgian citizens, or Georgian legal entities wholly owned by Georgian citizens. Inherited holdings by foreigners must generally be disposed of.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Moot for agricultural land, since the land itself cannot be foreign-held.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning:
        "Holding farmland through a Georgian citizen nominee is void against the constitutional bar and offers no recoverable interest.",
      reportingObligation: null,
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "torrens",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "No controls; the lari is convertible.",
      notes:
        "The public registry is fast and reliable — the constraint is eligibility, not administration. Long-term leases of agricultural land remain available to foreigners in some circumstances.",
    },
  },

  // =========================================================================
  // Africa
  // =========================================================================

  ZA: {
    code: "ZA",
    name: "South Africa",
    country: "South Africa",
    region: "africa",
    subdivisionLabel: "Province / District",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Department of Water and Sanitation",
      short: "DWS",
      role: "Issues Water Use Licences, validates Existing Lawful Use, and is progressively introducing compulsory licensing in stressed catchments.",
      url: "https://www.dws.gov.za",
    },
    adjudicationForum: "DWS administrative process; Water Tribunal; High Court on review",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Schedule 1 use — reasonable domestic, stock watering and small gardens — is permitted without a licence.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "The 1998 Act abolished private water rights",
        effect:
          "All water became a national resource held in trust. Pre-1998 riparian rights survive only as Existing Lawful Use, which must be verified and can be reduced under compulsory licensing. Many farms trade on an ELU that has never been validated.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
      {
        name: "Land reform and expropriation policy",
        effect:
          "The Expropriation Act signed in 2024 permits expropriation with nil compensation in defined circumstances, and redistribution remains active policy. This is a live sovereign risk to price, not a theoretical one.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "Water use licence transfer",
        effect:
          "Entitlements can be transferred between users under section 25, which creates a limited market — but every transfer needs DWS authorisation and the department is slow.",
        appliesTo: "Nationwide",
        severity: "moderate",
      },
    ],
    keyStatutes: ["National Water Act 1998", "Expropriation Act 2024", "Restitution of Land Rights Act 1994"],
    closedBasinRisk: "high",
    cautions: [
      "Establish whether the farm's water is a validated Existing Lawful Use, a granted Water Use Licence, or an assumption. The third is common and worth nothing.",
      "Search the land claims register. An unresolved restitution claim over the property is a transfer-blocking encumbrance.",
      "Price the policy risk explicitly rather than assuming continuity. South African farmland is cheap in dollar terms for identifiable reasons.",
    ],
    notes:
      "Genuinely world-class production regions — Western Cape fruit and wine, Orange River irrigation — at prices that reflect real and unresolved questions about land tenure security.",
    foreignOwnership: {
      regime: "unrestricted",
      summary:
        "Foreigners may currently own farmland freehold with no approval requirement, but this has been under active policy review for over a decade.",
      ruralLandRule:
        "No statutory bar at present. A Land Holdings Bill proposing to limit foreign ownership to long leasehold has been repeatedly mooted and not enacted.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Water use entitlements are held by the land user regardless of nationality.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning: null,
      reportingObligation:
        "Non-resident purchases are recorded by the Reserve Bank; ensure funds are introduced through the banking system so the capital is repatriable.",
    },
    countryRisk: {
      expropriationRisk: "high",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "high",
      currencyControls:
        "Exchange controls apply. Introduce funds through an authorised dealer and have the transaction endorsed, or repatriating sale proceeds later becomes very difficult.",
      repatriationNote:
        "Capital introduced and properly recorded is repatriable; capital brought in informally is not. This trips up buyers routinely.",
      notes:
        "The deeds registry itself is excellent and the conveyancing profession is strong. The risk sits above the registry, in policy.",
    },
  },

  NA: {
    code: "NA",
    name: "Namibia",
    country: "Namibia",
    region: "africa",
    subdivisionLabel: "Region / Constituency",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Ministry of Agriculture, Water and Land Reform",
      short: "MAWLR",
      role: "Grants water abstraction permits and administers the water resources framework.",
      url: "https://www.mawlr.gov.na",
    },
    adjudicationForum: "Administrative process; High Court",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Stock and domestic boreholes are widespread; permitting is inconsistently enforced.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Extreme aridity",
        effect:
          "The driest country in sub-Saharan Africa. Commercial farming is almost entirely groundwater-dependent and stocking rates are set by borehole yield, not by grazing.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Water Resources Management Act 2013", "Agricultural (Commercial) Land Reform Act 1995"],
    closedBasinRisk: "high",
    cautions: [
      "The state holds a right of first refusal over every commercial farmland sale, and a waiver certificate must be obtained before transfer.",
      "Foreign nationals are barred from acquiring agricultural land; the practical route is a long lease or a Namibian entity, and the latter is scrutinised.",
      "Borehole yield and recharge, not hectares, determine what the property can carry.",
    ],
    notes:
      "Large, cheap ranch land in a country that is systematically closing it to foreign buyers, in a climate that punishes any error in the water assessment.",
    foreignOwnership: {
      regime: "prohibited",
      summary:
        "Foreign nationals may not acquire commercial agricultural land, and the state has a pre-emptive right over all such sales.",
      ruralLandRule:
        "The Agricultural (Commercial) Land Reform Act bars foreign nationals from acquiring agricultural land and requires a state waiver certificate before any commercial farm transfers.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Abstraction permits attach to the land holder.",
      approvalBody: {
        name: "Ministry of Agriculture, Water and Land Reform",
        short: "MAWLR",
        role: "Issues the waiver certificate confirming the state declines its right of first refusal.",
        url: "https://www.mawlr.gov.na",
      },
      approvalTimelineDays: 120,
      caps: null,
      nomineeWarning:
        "Holding farmland through a Namibian-fronted entity is precisely what the Act targets and has been challenged.",
      reportingObligation: null,
    },
    countryRisk: {
      expropriationRisk: "high",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "high",
      currencyControls: "Namibian dollar is pegged to the rand and the country sits within the Common Monetary Area, so South African-style exchange control applies.",
      repatriationNote: "Introduce capital through authorised channels and document it, or repatriation will be obstructed.",
      notes: "Sound registry, explicit land redistribution policy, and a climate that is the binding constraint on everything.",
    },
  },

  ZM: {
    code: "ZM",
    name: "Zambia",
    country: "Zambia",
    region: "africa",
    subdivisionLabel: "Province / District",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Water Resources Management Authority",
      short: "WARMA",
      role: "Issues water rights and groundwater permits and administers catchment allocation.",
      url: "https://www.warma.org.zm",
    },
    adjudicationForum: "WARMA administrative process; Water Tribunal",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Domestic and small-scale use is exempt from permitting.",
    transferability: "severable-with-approval",
    specialRegimes: [
      {
        name: "Genuine water abundance",
        effect:
          "Zambia holds a substantial share of southern Africa's fresh water, with the Zambezi, Kafue and Luangwa systems and reliable rainfall in the north. Among African options this is the standout on water.",
        appliesTo: "Nationwide, strongest in the north",
        severity: "low",
      },
      {
        name: "Customary land conversion",
        effect:
          "Around 90% of land is customary, administered by chiefs. Converting it to leasehold requires the chief's consent and Ministry approval, and consents obtained without genuine community agreement have been reversed.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Water Resources Management Act 2011", "Lands Act 1995"],
    closedBasinRisk: "low",
    cautions: [
      "All land is vested in the President; what you buy is a 99-year leasehold, not freehold. Confirm the unexpired term and the consent to assign.",
      "Established commercial farming blocks — Mkushi, Mpongwe, Chisamba — already sit on state leasehold with infrastructure, and are a very different proposition from converting customary land.",
      "Verify with the Ministry of Lands directly. Duplicate and fraudulent title deeds are a known problem.",
    ],
    notes:
      "The best water endowment among accessible African options, with functioning commercial farm blocks and a leasehold system that foreigners can use. Institutional capacity is the constraint.",
    foreignOwnership: {
      regime: "leasehold-only",
      summary:
        "No freehold exists for anyone. Foreigners may hold 99-year state leasehold, typically via a Zambian-registered company and an investment licence.",
      ruralLandRule:
        "Non-Zambians may hold land where they are investors under the Zambia Development Agency Act, permanent residents, or hold through a Zambian-registered company.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Water rights are granted to the land holder and transfer with WARMA consent.",
      approvalBody: {
        name: "Ministry of Lands and Natural Resources / Zambia Development Agency",
        short: "MLNR / ZDA",
        role: "Consents to assignment of state leasehold and issues investment licences that qualify foreigners to hold land.",
        url: "https://www.zda.org.zm",
      },
      approvalTimelineDays: 120,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "Investment licence conditions carry ongoing reporting.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "state-allocated",
      titleReliability: "high",
      customaryTenureRisk: "severe",
      currencyControls: "Periodic restrictions have been imposed and lifted; verify the current position.",
      repatriationNote: "Investment licences generally guarantee repatriation of profits and capital; document the inbound flows.",
      notes:
        "Buy an existing titled commercial farm rather than attempting a customary land conversion. The second route has produced most of the region's land-conflict cases.",
    },
  },

  MZ: {
    code: "MZ",
    name: "Mozambique",
    country: "Mozambique",
    region: "africa",
    subdivisionLabel: "Província / Distrito",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Administrações Regionais de Águas",
      short: "ARA",
      role: "Regional water administrations licence abstraction and manage the basins.",
      url: "https://www.dnaas.gov.mz",
    },
    adjudicationForum: "Administrative process",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Common use for domestic purposes requires no licence.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "All land is state-owned",
        effect:
          "Land cannot be bought or sold. What transfers is a DUAT — a land use and benefit right, typically 50 years and renewable. Improvements can be sold; the land beneath them cannot.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
      {
        name: "Community consultation requirement",
        effect:
          "A DUAT over land occupied by a community requires a documented consultation. Projects that skirted it have been the subject of sustained international dispute.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Lei de Terras 19/1997", "Lei de Águas 16/1991"],
    closedBasinRisk: "low",
    cautions: [
      "A DUAT lapses if the investment plan is not implemented within the stated period. You are buying an obligation as much as a right.",
      "Water is abundant in the Zambezi and Limpopo systems, but flood and cyclone exposure is severe and increasing.",
      "Security conditions in the north have been unstable; treat Cabo Delgado separately from the rest of the country.",
    ],
    notes:
      "Abundant land and water with a tenure system that gives you a renewable use right and never ownership. Workable for an operator with a real project; unsuitable for anyone wanting an asset to hold.",
    foreignOwnership: {
      regime: "leasehold-only",
      summary: "Nobody owns land in Mozambique. Foreign investors obtain DUAT use rights tied to an approved investment plan.",
      ruralLandRule:
        "Foreign natural persons need residency of at least five years; foreign entities need to be registered in Mozambique with an approved investment project.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Abstraction licences are granted to the DUAT holder.",
      approvalBody: {
        name: "Agência para Promoção de Investimento e Exportações",
        short: "APIEX",
        role: "Approves investment projects, which is the qualifying route to a DUAT for a foreign investor.",
        url: "https://www.apiex.gov.mz",
      },
      approvalTimelineDays: 180,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "Implementation of the approved investment plan is monitored and enforced.",
    },
    countryRisk: {
      expropriationRisk: "high",
      titleSystem: "state-allocated",
      titleReliability: "high",
      customaryTenureRisk: "severe",
      currencyControls: "Exchange controls apply; register foreign investment with the central bank to preserve repatriation rights.",
      repatriationNote: "Repatriation requires the original investment to have been properly registered.",
      notes: "Real agricultural potential; a tenure and governance environment that demands an operating partner and patience.",
    },
  },

  KE: {
    code: "KE",
    name: "Kenya",
    country: "Kenya",
    region: "africa",
    subdivisionLabel: "County / Sub-county",
    subnational: false,
    areaUnitNote: "Transacted in acres and hectares interchangeably.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Water Resources Authority",
      short: "WRA",
      role: "Issues water permits by abstraction class and administers catchment management strategies.",
      url: "https://wra.go.ke",
    },
    adjudicationForum: "WRA administrative process; Water Tribunal; Environment and Land Court",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Small domestic abstraction is exempt; anything commercial requires a permit.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "99-year leasehold ceiling for non-citizens",
        effect:
          "The 2010 Constitution converted all freehold held by non-citizens into 99-year leases and bars non-citizens from freehold entirely.",
        appliesTo: "Nationwide",
        severity: "high",
      },
      {
        name: "Over-abstraction in the horticultural belt",
        effect:
          "Lake Naivasha and the Ewaso Ng'iro system are heavily abstracted for cut flowers and vegetables, with permits exceeding sustainable yield.",
        appliesTo: "Naivasha, Laikipia, Mount Kenya foothills",
        severity: "high",
      },
    ],
    keyStatutes: ["Constitution 2010 art. 65", "Land Act 2012", "Water Act 2016", "Community Land Act 2016"],
    closedBasinRisk: "moderate",
    cautions: [
      "Land fraud is endemic and sophisticated. Conduct an official search at the relevant registry, confirm the green card history, and use a reputable advocate — not one introduced by the seller.",
      "Community land under the 2016 Act cannot be dealt with except through the registered community, and unregistered community land is held by the county in trust.",
      "Confirm the water permit class and whether the catchment is gazetted as over-abstracted.",
    ],
    notes:
      "Strong horticultural export economy and real infrastructure, in a land market where the dominant risk is straightforward fraud rather than policy.",
    foreignOwnership: {
      regime: "leasehold-only",
      summary: "Non-citizens may hold land only on leasehold, capped at 99 years.",
      ruralLandRule:
        "Freehold agricultural land cannot be held by non-citizens; a 99-year lease is the maximum interest. Companies with any foreign shareholding are treated as non-citizens for this purpose.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Water permits are issued to the occupier and are unaffected by nationality.",
      approvalBody: {
        name: "National Land Commission / Ministry of Lands",
        short: "NLC",
        role: "Consents to dealings in leasehold land and administers the registries.",
        url: "https://lands.go.ke",
      },
      approvalTimelineDays: 90,
      caps: "99-year maximum lease term for non-citizens.",
      nomineeWarning:
        "Because a single foreign shareholder makes a company non-citizen for land purposes, structures intended to preserve freehold generally fail.",
      reportingObligation: null,
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "mixed",
      titleReliability: "severe",
      customaryTenureRisk: "high",
      currencyControls: null,
      repatriationNote: "The shilling is convertible and profits are repatriable.",
      notes:
        "Title fraud is the single largest cause of loss for foreign buyers in Kenya. Budget for a genuinely independent, thorough title investigation.",
    },
  },

  MA: {
    code: "MA",
    name: "Morocco",
    country: "Morocco",
    region: "africa",
    subdivisionLabel: "Région / Province",
    subnational: false,
    areaUnitNote: "Transacted in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Agences de Bassin Hydraulique",
      short: "ABH",
      role: "Basin agencies licence abstraction, meter groundwater and administer the aquifer contracts.",
      url: "https://www.eau.gov.ma",
    },
    adjudicationForum: "Administrative process; administrative courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Shallow traditional wells for domestic use are tolerated; commercial boreholes require authorisation.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Severe aquifer overdraft",
        effect:
          "The export horticulture zones run on groundwater that is falling steeply, with thousands of unauthorised boreholes and periodic drilling moratoria.",
        appliesTo: "Souss-Massa, Saïss, Haouz",
        severity: "severe",
      },
    ],
    keyStatutes: ["Loi 36-15 sur l'eau", "Dahir on acquisition of agricultural land by foreigners"],
    closedBasinRisk: "severe",
    cautions: [
      "Foreigners cannot acquire agricultural land outside urban perimeters. The usual routes are a long lease of state land or reclassification of the parcel to non-agricultural vocation, which is discretionary.",
      "Distinguish melk (private titled), collective, guich and habous land. Only the first is straightforwardly transferable, and much rural land is not melk.",
      "Water is the binding constraint on the entire agricultural sector and is getting worse.",
    ],
    notes:
      "Excellent counter-seasonal production for the European market, on aquifers that are being mined, behind a bar on foreign ownership of farmland.",
    foreignOwnership: {
      regime: "prohibited",
      summary:
        "Foreigners may not acquire agricultural land. Long leases of state agricultural land are available through a public programme.",
      ruralLandRule:
        "Acquisition of agricultural land outside urban perimeters by foreign nationals is prohibited. Leases of up to 99 years on state land are offered under partnership programmes.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Abstraction authorisations attach to the operator of the land.",
      approvalBody: {
        name: "Ministry of Agriculture (Agence pour le Développement Agricole)",
        short: "ADA",
        role: "Administers long-term leases of state agricultural land to investors.",
        url: "https://www.ada.gov.ma",
      },
      approvalTimelineDays: 180,
      caps: null,
      nomineeWarning:
        "Purchases fronted by Moroccan nationals to circumvent the agricultural land bar are void and unrecoverable.",
      reportingObligation: "Foreign investment should be registered with the Office des Changes to preserve repatriation rights.",
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "mixed",
      titleReliability: "moderate",
      customaryTenureRisk: "high",
      currencyControls:
        "Exchange controls apply. Register the investment with the Office des Changes at the time of transfer or repatriation will be blocked.",
      repatriationNote: "Repatriation is guaranteed only for properly registered convertible-dirham investments.",
      notes: "The titled (immatriculé) portion of the land stock is reliable; the untitled portion is not.",
    },
  },

  // =========================================================================
  // Asia
  // =========================================================================

  JP: {
    code: "JP",
    name: "Japan",
    country: "Japan",
    region: "asia",
    subdivisionLabel: "Prefecture / Municipality",
    subnational: false,
    areaUnitNote: "Transacted in tsubo and hectares; forest land in hectares.",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "reasonable-use",
    agency: {
      name: "Ministry of Land, Infrastructure, Transport and Tourism",
      short: "MLIT",
      role: "Administers River Law water use permits; prefectures and land improvement districts handle irrigation allocation.",
      url: "https://www.mlit.go.jp",
    },
    adjudicationForum: "Administrative process; district courts",
    forfeitureYears: null,
    permitRequiredForNewWells: false,
    exemptWellNote:
      "Groundwater is largely treated as incidental to land ownership, with local ordinances rather than national permitting — one reason watershed land attracted foreign attention.",
    transferability: "appurtenant-transfers-with-land",
    specialRegimes: [
      {
        name: "No nationality restriction on land",
        effect:
          "Japan is unusual among developed economies in placing no general restriction on foreign land ownership, including forest and watershed land. Purchases of Hokkaido headwater forest drove a national debate and a wave of prefectural notification ordinances.",
        appliesTo: "Nationwide",
        severity: "low",
      },
      {
        name: "Agricultural Land Act permission",
        effect:
          "Farmland is different. Acquiring nōchi requires permission from the local agricultural committee, and the buyer must actually farm it, meet minimum area requirements and commit to continuous cultivation. Nationality is not the barrier; being a non-farmer is.",
        appliesTo: "All designated agricultural land",
        severity: "high",
      },
      {
        name: "2021 land use regulation near sensitive sites",
        effect:
          "Acquisitions near defence facilities, borders and remote islands are subject to notification and survey.",
        appliesTo: "Designated watch zones",
        severity: "moderate",
      },
    ],
    keyStatutes: ["River Law", "Agricultural Land Act (農地法)", "Act on Regulation of Land Use Surrounding Important Facilities 2021"],
    closedBasinRisk: "low",
    cautions: [
      "The distinction between agricultural land, forest land and other land is decisive. Forest and watershed land is open; farmland effectively is not unless you become a farmer.",
      "Depopulating rural Japan has genuinely cheap land and abundant water, alongside akiya (abandoned property) with unresolved inheritance chains and dozens of co-heirs.",
      "Water is abundant and rarely the constraint; the constraint is the agricultural committee.",
    ],
    notes:
      "Abundant water, no ownership bar, and cheap depopulating rural land — an unusual combination. The farmland permission regime is what stops it being an obvious arbitrage.",
    foreignOwnership: {
      regime: "restricted-rural",
      summary:
        "No nationality restriction on land generally, but agricultural land requires agricultural committee permission that turns on whether you will farm it.",
      ruralLandRule:
        "Agricultural Land Act permission requires the buyer to cultivate the land, meet a minimum area, and have the labour and capacity to do so. Corporate acquisition faces additional conditions.",
      borderCoastalRule:
        "Notification is required for land near defence installations, borders and designated remote islands under the 2021 Act.",
      waterRightsForeignRule: "Water permits and land improvement district membership follow the land occupier.",
      approvalBody: {
        name: "Municipal agricultural committees (農業委員会)",
        short: "Agricultural committee",
        role: "Grants or refuses permission for any transfer of designated agricultural land.",
        url: "https://www.maff.go.jp",
      },
      approvalTimelineDays: 60,
      caps: null,
      nomineeWarning: null,
      reportingObligation: "Some prefectures require notification of watershed and forest land acquisitions.",
    },
    countryRisk: {
      expropriationRisk: "low",
      titleSystem: "deeds-registry",
      titleReliability: "low",
      customaryTenureRisk: "low",
      currencyControls: null,
      repatriationNote: "No controls; certain acquisitions require post-transaction reporting under FEFTA.",
      notes:
        "Registry is reliable but not state-guaranteed, and rural parcels commonly have unregistered inheritance chains that must be resolved before transfer.",
    },
  },

  TH: {
    code: "TH",
    name: "Thailand",
    country: "Thailand",
    region: "asia",
    subdivisionLabel: "Province / District",
    subnational: false,
    areaUnitNote: "Transacted in rai (1 rai = 0.16 ha = 0.395 acres).",
    surfaceDoctrine: "administrative-concession",
    groundwaterRegime: "administrative-concession",
    agency: {
      name: "Royal Irrigation Department and Department of Groundwater Resources",
      short: "RID / DGR",
      role: "RID allocates surface irrigation water; DGR licences groundwater abstraction.",
      url: "https://www.rid.go.th",
    },
    adjudicationForum: "Administrative process; administrative courts",
    forfeitureYears: null,
    permitRequiredForNewWells: true,
    exemptWellNote: "Shallow domestic wells are exempt; commercial abstraction requires a DGR licence.",
    transferability: "limited",
    specialRegimes: [
      {
        name: "Foreigners cannot own land",
        effect:
          "The Land Code bars foreign land ownership almost entirely. The exceptions are narrow — certain BOI-promoted industrial cases and a rarely used large-investment provision — and none of them cover ordinary agricultural land.",
        appliesTo: "Nationwide",
        severity: "severe",
      },
    ],
    keyStatutes: ["Land Code Act", "Foreign Business Act 1999", "Groundwater Act 1977"],
    closedBasinRisk: "moderate",
    cautions: [
      "Thai company structures used to hold land for a foreign beneficial owner are unlawful under the Land Code and the Foreign Business Act, and enforcement has increased. This is not a grey area.",
      "Leases are capped at 30 years for most land, and pre-agreed renewals have repeatedly been held unenforceable against successors.",
      "Chanote (Nor Sor 4 Jor) is the only title type offering full registered rights; lesser documents such as Nor Sor 3 and Sor Por Kor carry real limitations, and Sor Por Kor land cannot be sold at all.",
    ],
    notes:
      "Included as a warning rather than an opportunity. Water and agronomy are workable; the ownership regime is not, and the workarounds people are sold are illegal.",
    foreignOwnership: {
      regime: "prohibited",
      summary: "Foreign nationals cannot own land. Long leases are the only realistic interest and they are weak.",
      ruralLandRule: "Agricultural land cannot be acquired by foreigners under any generally available route.",
      borderCoastalRule: null,
      waterRightsForeignRule: "Moot — the land cannot be foreign-held.",
      approvalBody: null,
      approvalTimelineDays: null,
      caps: null,
      nomineeWarning:
        "Nominee shareholding to hold land is a criminal offence for both the foreigner and the Thai nominees, and results in forced sale of the land.",
      reportingObligation: null,
    },
    countryRisk: {
      expropriationRisk: "moderate",
      titleSystem: "torrens",
      titleReliability: "moderate",
      customaryTenureRisk: "moderate",
      currencyControls: "Inbound funds for property must be remitted in foreign currency and documented on a Foreign Exchange Transaction form.",
      repatriationNote: "Repatriation depends on the original inbound remittance having been properly documented.",
      notes: "The registry is sound for chanote land; the problem is that a foreigner cannot be on it.",
    },
  },
};

export const INTERNATIONAL_LIST = Object.values(INTERNATIONAL).sort((a, b) => a.name.localeCompare(b.name));

export const REGION_LABELS: Record<string, string> = {
  "united-states": "United States",
  canada: "Canada",
  "latin-america": "Latin America",
  europe: "Europe",
  africa: "Africa",
  asia: "Asia",
  oceania: "Oceania",
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  unrestricted: "Open to foreign buyers",
  "restricted-rural": "Rural land restricted",
  "approval-required": "Screening approval required",
  "leasehold-only": "Leasehold only",
  "structure-required": "Structure required",
  prohibited: "Closed to foreign buyers",
};

export const TITLE_SYSTEM_LABELS: Record<string, string> = {
  torrens: "Torrens (state-guaranteed register)",
  "deeds-registry": "Deeds registry (title proved by chain)",
  mixed: "Mixed registry",
  "customary-overlay": "Formal register over customary rights",
  "state-allocated": "State-owned, use rights granted",
};
