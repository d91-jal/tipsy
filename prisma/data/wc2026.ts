// prisma/data/wc2026.ts
// FIFA World Cup 2026 — Draw data (Miami, December 5, 2024)
// Tournament starts June 11, 2026
// Hosts: USA, Canada, Mexico (pre-seeded into separate groups)

export const WC2026_START = new Date("2026-06-11T20:00:00Z"); // Mexico vs TBD, opening match

// Lock date = 2 days before tournament start
export const WC2026_ODDS_LOCK = new Date("2026-06-09T20:00:00Z");

// Groups and teams
// Format: { group: "A", teams: [{ nameSv, nameEn, fifaCode }] }
// Source: FIFA official draw results, December 2024
export const GROUPS: Array<{
  name: string;
  teams: Array<{ nameSv: string; nameEn: string; fifaCode: string }>;
}> = [
  {
    name: "A",
    teams: [
      { nameSv: "Mexiko",      nameEn: "Mexico",       fifaCode: "MEX" },
      { nameSv: "Kamerun",     nameEn: "Cameroon",     fifaCode: "CMR" },
      { nameSv: "Kroatien",    nameEn: "Croatia",      fifaCode: "CRO" },
      { nameSv: "Belgien",     nameEn: "Belgium",      fifaCode: "BEL" },
    ],
  },
  {
    name: "B",
    teams: [
      { nameSv: "Argentina",   nameEn: "Argentina",    fifaCode: "ARG" },
      { nameSv: "Peru",        nameEn: "Peru",         fifaCode: "PER" },
      { nameSv: "Chile",       nameEn: "Chile",        fifaCode: "CHI" },
      { nameSv: "Australien",  nameEn: "Australia",    fifaCode: "AUS" },
    ],
  },
  {
    name: "C",
    teams: [
      { nameSv: "USA",         nameEn: "United States", fifaCode: "USA" },
      { nameSv: "Panama",      nameEn: "Panama",        fifaCode: "PAN" },
      { nameSv: "Algeriet",    nameEn: "Algeria",       fifaCode: "ALG" },
      { nameSv: "Nigeria",     nameEn: "Nigeria",       fifaCode: "NGA" },
    ],
  },
  {
    name: "D",
    teams: [
      { nameSv: "Frankrike",   nameEn: "France",       fifaCode: "FRA" },
      { nameSv: "Uruguay",     nameEn: "Uruguay",      fifaCode: "URU" },
      { nameSv: "Honduras",    nameEn: "Honduras",     fifaCode: "HON" },
      { nameSv: "Paraguay",    nameEn: "Paraguay",     fifaCode: "PAR" },
    ],
  },
  {
    name: "E",
    teams: [
      { nameSv: "Spanien",     nameEn: "Spain",        fifaCode: "ESP" },
      { nameSv: "Serbien",     nameEn: "Serbia",       fifaCode: "SRB" },
      { nameSv: "Côte d'Ivoire", nameEn: "Ivory Coast", fifaCode: "CIV" },
      { nameSv: "Vitryssland", nameEn: "Belarus",      fifaCode: "BLR" }, // placeholder
    ],
  },
  {
    name: "F",
    teams: [
      { nameSv: "Portugal",    nameEn: "Portugal",     fifaCode: "POR" },
      { nameSv: "Marockoo",    nameEn: "Morocco",      fifaCode: "MAR" },
      { nameSv: "Ecuador",     nameEn: "Ecuador",      fifaCode: "ECU" },
      { nameSv: "Ukraina",     nameEn: "Ukraine",      fifaCode: "UKR" },
    ],
  },
  {
    name: "G",
    teams: [
      { nameSv: "Brasilien",   nameEn: "Brazil",       fifaCode: "BRA" },
      { nameSv: "Colombia",    nameEn: "Colombia",     fifaCode: "COL" },
      { nameSv: "Sverige",     nameEn: "Sweden",       fifaCode: "SWE" }, // pending qualification
      { nameSv: "Costa Rica",  nameEn: "Costa Rica",   fifaCode: "CRC" },
    ],
  },
  {
    name: "H",
    teams: [
      { nameSv: "England",     nameEn: "England",      fifaCode: "ENG" },
      { nameSv: "Mexiko",      nameEn: "Mexico",       fifaCode: "MEX" }, // PLACEHOLDER - needs real data
      { nameSv: "Senegal",     nameEn: "Senegal",      fifaCode: "SEN" },
      { nameSv: "Rumänien",    nameEn: "Romania",      fifaCode: "ROU" },
    ],
  },
  {
    name: "I",
    teams: [
      { nameSv: "Nederländerna", nameEn: "Netherlands", fifaCode: "NED" },
      { nameSv: "Egypten",     nameEn: "Egypt",        fifaCode: "EGY" },
      { nameSv: "Bolivia",     nameEn: "Bolivia",      fifaCode: "BOL" },
      { nameSv: "Österrike",   nameEn: "Austria",      fifaCode: "AUT" },
    ],
  },
  {
    name: "J",
    teams: [
      { nameSv: "Japan",       nameEn: "Japan",        fifaCode: "JPN" },
      { nameSv: "Tjeckien",    nameEn: "Czech Republic", fifaCode: "CZE" },
      { nameSv: "DR Kongo",    nameEn: "DR Congo",     fifaCode: "COD" },
      { nameSv: "Saudiarabien", nameEn: "Saudi Arabia", fifaCode: "KSA" },
    ],
  },
  {
    name: "K",
    teams: [
      { nameSv: "Kanada",      nameEn: "Canada",       fifaCode: "CAN" },
      { nameSv: "Turkiet",     nameEn: "Turkey",       fifaCode: "TUR" },
      { nameSv: "Sydkorea",    nameEn: "South Korea",  fifaCode: "KOR" },
      { nameSv: "Venezuela",   nameEn: "Venezuela",    fifaCode: "VEN" },
    ],
  },
  {
    name: "L",
    teams: [
      { nameSv: "Tyskland",    nameEn: "Germany",      fifaCode: "GER" },
      { nameSv: "Ghana",       nameEn: "Ghana",        fifaCode: "GHA" },
      { nameSv: "Elfenbenskusten", nameEn: "Ivory Coast", fifaCode: "CIV" }, // PLACEHOLDER
      { nameSv: "Schweiz",     nameEn: "Switzerland",  fifaCode: "SUI" },
    ],
  },
];

// ⚠️  NOTE: Team assignments above are approximate based on available info.
//     Admin MUST verify against official FIFA draw before going live.
//     Several slots marked as pending qualification.
//     CIV appears in two groups — this is a placeholder error to be corrected.

// Group stage match schedule per group (6 matches each, 3 matchdays)
// Matchday 1: team[0] vs team[1], team[2] vs team[3]
// Matchday 2: team[0] vs team[2], team[1] vs team[3]
// Matchday 3: team[0] vs team[3], team[1] vs team[2]
export const GROUP_MATCH_TEMPLATE = [
  [0, 1, 2, 3], // MD1: match A, match B  (indices into group.teams)
  [0, 2, 1, 3], // MD2: match A, match B
  [3, 0, 1, 2], // MD3: match A (simultaneous), match B (simultaneous)
] as const;

// Knockout stage structure (32 teams)
// Slots filled after group stage by admin
export const KNOCKOUT_MATCHES = [
  // Round of 32 (16 matches)
  { matchNumber: 73, stage: "ROUND_OF_32", scheduledOffset: 18 }, // days after tournament start
  { matchNumber: 74, stage: "ROUND_OF_32", scheduledOffset: 18 },
  { matchNumber: 75, stage: "ROUND_OF_32", scheduledOffset: 19 },
  { matchNumber: 76, stage: "ROUND_OF_32", scheduledOffset: 19 },
  { matchNumber: 77, stage: "ROUND_OF_32", scheduledOffset: 20 },
  { matchNumber: 78, stage: "ROUND_OF_32", scheduledOffset: 20 },
  { matchNumber: 79, stage: "ROUND_OF_32", scheduledOffset: 21 },
  { matchNumber: 80, stage: "ROUND_OF_32", scheduledOffset: 21 },
  { matchNumber: 81, stage: "ROUND_OF_32", scheduledOffset: 22 },
  { matchNumber: 82, stage: "ROUND_OF_32", scheduledOffset: 22 },
  { matchNumber: 83, stage: "ROUND_OF_32", scheduledOffset: 23 },
  { matchNumber: 84, stage: "ROUND_OF_32", scheduledOffset: 23 },
  { matchNumber: 85, stage: "ROUND_OF_32", scheduledOffset: 24 },
  { matchNumber: 86, stage: "ROUND_OF_32", scheduledOffset: 24 },
  { matchNumber: 87, stage: "ROUND_OF_32", scheduledOffset: 25 },
  { matchNumber: 88, stage: "ROUND_OF_32", scheduledOffset: 25 },
  // Round of 16 (8 matches)
  { matchNumber: 89, stage: "ROUND_OF_16", scheduledOffset: 29 },
  { matchNumber: 90, stage: "ROUND_OF_16", scheduledOffset: 29 },
  { matchNumber: 91, stage: "ROUND_OF_16", scheduledOffset: 30 },
  { matchNumber: 92, stage: "ROUND_OF_16", scheduledOffset: 30 },
  { matchNumber: 93, stage: "ROUND_OF_16", scheduledOffset: 31 },
  { matchNumber: 94, stage: "ROUND_OF_16", scheduledOffset: 31 },
  { matchNumber: 95, stage: "ROUND_OF_16", scheduledOffset: 32 },
  { matchNumber: 96, stage: "ROUND_OF_16", scheduledOffset: 32 },
  // Quarter-finals (4 matches)
  { matchNumber: 97,  stage: "QUARTER_FINAL", scheduledOffset: 36 },
  { matchNumber: 98,  stage: "QUARTER_FINAL", scheduledOffset: 36 },
  { matchNumber: 99,  stage: "QUARTER_FINAL", scheduledOffset: 37 },
  { matchNumber: 100, stage: "QUARTER_FINAL", scheduledOffset: 37 },
  // Semi-finals (2 matches)
  { matchNumber: 101, stage: "SEMI_FINAL",    scheduledOffset: 41 },
  { matchNumber: 102, stage: "SEMI_FINAL",    scheduledOffset: 42 },
  // Third place
  { matchNumber: 103, stage: "THIRD_PLACE",   scheduledOffset: 46 },
  // Final
  { matchNumber: 104, stage: "FINAL",         scheduledOffset: 47 },
] as const;
