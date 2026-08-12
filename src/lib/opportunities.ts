/**
 * Curated cross-border acquisition theses.
 *
 * The registry answers "what are the rules here". This answers the question a
 * buyer actually asks first: given a target of a thousand water-secured acres,
 * where is that realistically achievable, and what is the specific play?
 *
 * Opinionated on purpose. Each entry names the mechanism that makes it work,
 * the thing most likely to kill it, and who it suits — because a thesis without
 * a failure mode is marketing.
 */

export type Accessibility = "open" | "friction" | "operator-only" | "closed";

export interface Opportunity {
  id: string;
  title: string;
  /** Jurisdiction codes this play touches, for linking into the registry. */
  jurisdictions: string[];
  accessibility: Accessibility;
  /** One line: what you are actually buying. */
  premise: string;
  /** Why the mechanism exists and why it works. */
  mechanism: string;
  /** The specific way this goes wrong. */
  killer: string;
  /** Who this is a fit for. */
  suits: string;
  /** Rough sense of scale for a 1,000-acre (405 ha) target. */
  scaleNote: string;
}

export const ACCESSIBILITY_LABELS: Record<Accessibility, string> = {
  open: "Open door",
  friction: "Worth the friction",
  "operator-only": "Operators only",
  closed: "Effectively closed",
};

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "chile-water-as-asset",
    title: "Buy the water, not the land",
    jurisdictions: ["CL"],
    accessibility: "open",
    premise:
      "Chilean water rights are registered property, separable from land, mortgageable and tradable. You can acquire the entitlement on its own and attach it to cheaper land later — or never.",
    mechanism:
      "The 1981 Water Code created the only fully-formed private market in water rights in the Americas, and foreign buyers get complete national treatment with no approval and no acreage cap. The 2022 reform tightened non-use and made new grants 30-year concessions, but existing perpetual rights were grandfathered — which, if anything, made the seasoned stock scarcer and more valuable.",
    killer:
      "Most productive basins are formally closed and physically over-allocated, and scarcity decrees let the regulator redistribute water regardless of what your title says. Buying a paper right in a basin that cannot deliver is the standard way to lose money here.",
    suits:
      "A buyer who wants water exposure as an asset class rather than a farming operation, and who can underwrite basin hydrology rather than just read a register.",
    scaleNote:
      "405 ha of irrigated Central Valley ground is a substantial holding. In the Atacama or Aysén the same acreage means something entirely different.",
  },
  {
    id: "australia-entitlement-market",
    title: "The world's only deep water market",
    jurisdictions: ["AU"],
    accessibility: "friction",
    premise:
      "Water entitlements in the Murray-Darling are fully unbundled from land, registered on state registers, and traded on a screen market with published prices. You can buy megalitres the way you buy a listed security.",
    mechanism:
      "Two decades of reform separated the entitlement, the allocation and the land into distinct instruments. That produced genuine price discovery — you can look up what a high-security megalitre traded for last week — and genuine liquidity, which exists nowhere else at this depth.",
    killer:
      "Entitlement is not water. General-security allocations have opened at zero in drought years, and the ten-year allocation history for the specific valley and class is the only number worth underwriting. FIRB screening and the ATO foreign-ownership register add cost and visibility that some buyers do not want.",
    suits:
      "A financially-minded buyer who wants a liquid, priced, exit-able water position and can tolerate a screening regime.",
    scaleNote:
      "Land and water are priced separately here, so a 405 ha target and a water target are two independent decisions — which is the point.",
  },
  {
    id: "uruguay-base",
    title: "The low-risk base for an accumulation programme",
    jurisdictions: ["UY"],
    accessibility: "open",
    premise:
      "Full national treatment for foreigners, no approval, no cap, reliable registry, abundant water over the Guaraní Aquifer, and a functioning market in productive land.",
    mechanism:
      "Uruguay simply never built the restrictions its neighbours did. The only structural rule that bites is that rural land must be held by natural persons or by companies with nominative shares — a disclosure requirement, not a barrier. Combined with the strongest rule of law in South America, it is the obvious place to put the first tranche of a multi-parcel programme.",
    killer:
      "It is priced accordingly. Uruguay is not the cheap option, and the yield you are buying is partly a risk premium you are declining to take. Drought years are real despite the aquifer, and reservoir construction is the practical constraint on summer cropping.",
    suits:
      "A buyer who wants the acreage to actually be theirs in twenty years and will pay for that certainty.",
    scaleNote:
      "405 ha is a mid-sized Uruguayan farm — large enough to matter, small enough to assemble in one or two transactions.",
  },
  {
    id: "portugal-alqueva",
    title: "Contracted water inside the Alqueva perimeter",
    jurisdictions: ["PT"],
    accessibility: "open",
    premise:
      "Land inside the Alqueva irrigation network comes with a contracted allocation from Europe's largest artificial reservoir. Land outside it, sometimes across the road, depends on a borehole and a curtailable licence.",
    mechanism:
      "A state megaproject converted a historically dry region into reliably irrigated ground, and Portugal places no restrictions whatsoever on foreign ownership of rural land — EU or not. That combination is rare in Western Europe.",
    killer:
      "Southern Portugal is drying measurably and the Algarve has already seen abstraction curtailed. Outside the perimeter you are exposed to exactly that trend; inside it you are exposed to the scheme's own long-run allocation politics.",
    suits:
      "A buyer who wants EU jurisdiction, permanent crops, and a water supply defined by contract rather than by hydrology.",
    scaleNote:
      "405 ha inside the perimeter is a serious olive or almond operation and a meaningful capital commitment.",
  },
  {
    id: "guarani-belt",
    title: "The Guaraní Aquifer belt, at three different price points",
    jurisdictions: ["UY", "PY", "BR", "AR"],
    accessibility: "friction",
    premise:
      "One of the largest freshwater aquifers on earth underlies parts of four countries whose land prices, title quality and ownership rules differ by an order of magnitude.",
    mechanism:
      "The same physical resource is available at Uruguayan institutional quality, Paraguayan prices, Brazilian scale, or Argentine agronomy. The arbitrage is not the water — it is choosing which country's risk you are being paid to take.",
    killer:
      "Each country prices its own weakness accurately. Paraguay's discount reflects genuine title fraud; Argentina's reflects currency and a statute that specifically bars foreign purchase of rural land bordering significant water; Brazil's reflects unresolved law on foreign-controlled companies.",
    suits:
      "A buyer assembling across borders who wants aquifer exposure and is deliberately diversifying jurisdiction risk rather than concentrating it.",
    scaleNote:
      "405 ha is unremarkable in Paraguay or Brazil and quite large in Uruguay — the same target means different things across the belt.",
  },
  {
    id: "peru-scheme-auctions",
    title: "Desert land sold with the water attached",
    jurisdictions: ["PE"],
    accessibility: "friction",
    premise:
      "State irrigation megaprojects — Olmos, Chavimochic, Majes-Siguas — auction serviced desert parcels that come with a contractual water allotment from day one.",
    mechanism:
      "Peru's coastal desert has world-class light and heat and no rain. The schemes solve the water problem by contract rather than by hydrogeology, which sidesteps the aquifer closures that make private wells in Ica a wasting asset.",
    killer:
      "Everything outside a scheme is drawing on aquifers that are formally closed and materially over-drafted. And the 50 km border exclusion is constitutional — a purchase in breach is void and reverts to the state, with no cure.",
    suits: "An export horticulture operator, not a passive holder. These parcels come with development obligations.",
    scaleNote: "Scheme lots are typically sold in blocks that make 405 ha reachable in a single auction.",
  },
  {
    id: "oklahoma-contiguity",
    title: "The domestic play where acreage literally buys water",
    jurisdictions: ["US-OK"],
    accessibility: "open",
    premise:
      "Oklahoma allocates groundwater as an annual quantity per acre of land owned over the basin. Every additional contiguous acre mechanically increases your permitted volume.",
    mechanism:
      "Most jurisdictions allocate water by priority date or by permit. Oklahoma allocates it by overlying acreage against the basin's maximum annual yield — which means an accumulation strategy compounds in a way it does not anywhere else, and contiguity is worth paying for.",
    killer:
      "Where a basin has no approved maximum annual yield the default temporary permit can be revised downward, and the Ogallala portions of the state face the same decline as Kansas and Texas.",
    suits:
      "Exactly the buyer this tool was built for: someone accumulating toward an acreage target who wants the water to scale with it.",
    scaleNote:
      "At a typical two acre-feet per acre allocation, 1,000 contiguous acres is roughly 2,000 acre-feet per year of permitted supply.",
  },
  {
    id: "japan-watershed",
    title: "No ownership bar, abundant water, depopulating countryside",
    jurisdictions: ["JP"],
    accessibility: "friction",
    premise:
      "Japan places no nationality restriction on land ownership, including forest and watershed land — an unusual position among developed economies, and one that caused a national debate when Hokkaido headwaters started selling.",
    mechanism:
      "Rural depopulation has produced genuinely cheap land in a country with abundant, high-quality water and complete legal security. Forest and watershed parcels are freely acquirable by foreigners.",
    killer:
      "Designated agricultural land is a different world: the local agricultural committee must approve, and it will only do so if you actually farm the land and meet minimum area and capacity tests. Being foreign is not the barrier — being a non-farmer is. Rural parcels also carry unresolved inheritance chains with many co-heirs.",
    suits:
      "A buyer interested in watershed, forestry or conservation holdings rather than row-crop agriculture.",
    scaleNote:
      "405 ha of Japanese forest land is achievable and cheap; 405 ha of nōchi farmland is a different and much harder proposition.",
  },
  {
    id: "africa-leasehold",
    title: "Where the water is best and the tenure is weakest",
    jurisdictions: ["ZM", "MZ"],
    accessibility: "operator-only",
    premise:
      "Zambia and Mozambique hold some of the best water endowments available to an outside buyer anywhere — and neither offers freehold to anyone, including their own citizens.",
    mechanism:
      "Zambia's 99-year state leasehold over established commercial farm blocks in Mkushi and Mpongwe is a workable, titled interest with existing infrastructure. Mozambique's DUAT is a renewable use right tied to an approved investment plan.",
    killer:
      "Converting customary land is where almost every land-conflict case in the region originates. Buy an existing titled commercial farm or do not go. Both countries also require the inbound investment to be formally registered, or the capital cannot come back out.",
    suits:
      "An operator with a real project, local partners and patience. Not a place to hold an asset passively.",
    scaleNote:
      "Commercial blocks here are large; 405 ha would be a small holding by local standards and may be below the scale that justifies the overhead.",
  },
  {
    id: "closed-list",
    title: "Where not to spend the diligence budget",
    jurisdictions: ["GE", "TH", "NZ", "NA", "MA", "KE"],
    accessibility: "closed",
    premise:
      "Six places that come up in conversation and are, for a foreign buyer of farmland, effectively closed. Knowing this early is worth more than any of the theses above.",
    mechanism:
      "Georgia bars foreign ownership of agricultural land constitutionally, and a Georgian company owned by foreigners is barred too. Thailand bars foreign land ownership almost entirely. Morocco bars foreign acquisition of agricultural land. Namibia bars foreign nationals from commercial farmland and gives the state first refusal. Kenya caps non-citizens at 99-year leasehold. New Zealand is legally open but the Overseas Investment Office test makes rural land practically unobtainable for a passive buyer.",
    killer:
      "In several of these the workaround being offered — a local nominee, a fronted company — is a criminal offence, void, or both. The structures that get sold to foreign buyers in Thailand in particular are illegal and have resulted in forced sales.",
    suits:
      "Nobody, for freehold farmland. Long leases and genuine operating joint ventures remain possible in some of them.",
    scaleNote: "Not applicable — the constraint is legal, not one of scale.",
  },
];

export function opportunitiesByAccessibility(): Array<{
  accessibility: Accessibility;
  label: string;
  items: Opportunity[];
}> {
  const order: Accessibility[] = ["open", "friction", "operator-only", "closed"];
  return order
    .map((accessibility) => ({
      accessibility,
      label: ACCESSIBILITY_LABELS[accessibility],
      items: OPPORTUNITIES.filter((o) => o.accessibility === accessibility),
    }))
    .filter((g) => g.items.length > 0);
}
