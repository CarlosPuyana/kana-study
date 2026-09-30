import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import countries from 'world-countries';
import isoCountries from 'i18n-iso-countries';
import ca from 'i18n-iso-countries/langs/ca.json' with { type: 'json' };
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };
import es from 'i18n-iso-countries/langs/es.json' with { type: 'json' };

isoCountries.registerLocale(ca);
isoCountries.registerLocale(en);
isoCountries.registerLocale(es);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ambiguousCapitalCodes = new Set([
  'BJ', 'BO', 'ID', 'IL', 'LK', 'MY', 'NL', 'PS', 'SZ', 'YE', 'ZA',
]);

const capitalTranslations = {
  Tokyo: ['Tokio', 'Tòquio'], Seoul: ['Seúl', 'Seül'], Beijing: ['Pekín', 'Pequín'],
  Athens: ['Atenas', 'Atenes'], London: ['Londres', 'Londres'], Rome: ['Roma', 'Roma'],
  Lisbon: ['Lisboa', 'Lisboa'], Moscow: ['Moscú', 'Moscou'], Cairo: ['El Cairo', 'el Caire'],
  Prague: ['Praga', 'Praga'], Vienna: ['Viena', 'Viena'], Brussels: ['Bruselas', 'Brussel·les'],
  Copenhagen: ['Copenhague', 'Copenhaguen'], Stockholm: ['Estocolmo', 'Estocolm'],
  Warsaw: ['Varsovia', 'Varsòvia'], Bucharest: ['Bucarest', 'Bucarest'],
  Belgrade: ['Belgrado', 'Belgrad'], Dublin: ['Dublín', 'Dublín'],
  Reykjavik: ['Reikiavik', 'Reykjavík'], Bern: ['Berna', 'Berna'],
  Ljubljana: ['Liubliana', 'Ljubljana'], Tallinn: ['Tallin', 'Tallinn'],
  'New Delhi': ['Nueva Delhi', 'Nova Delhi'], Bangkok: ['Bangkok', 'Bangkok'],
  'Hanoi': ['Hanói', 'Hanoi'], 'Phnom Penh': ['Nom Pen', 'Phnom Penh'],
  'Ulaanbaatar': ['Ulán Bator', 'Ulan Bator'], Manila: ['Manila', 'Manila'],
  'Singapore': ['Singapur', 'Singapur'], 'Riyadh': ['Riad', 'Riad'],
  'Damascus': ['Damasco', 'Damasc'], 'Baghdad': ['Bagdad', 'Bagdad'],
  'Tehran': ['Teherán', 'Teheran'], 'Tbilisi': ['Tiflis', 'Tbilissi'],
  'Yerevan': ['Ereván', 'Erevan'], 'Baku': ['Bakú', 'Bakú'],
  'Nicosia': ['Nicosia', 'Nicòsia'], 'Jerusalem': ['Jerusalén', 'Jerusalem'],
  'Washington, D.C.': ['Washington D. C.', 'Washington DC'],
  'Mexico City': ['Ciudad de México', 'Ciutat de Mèxic'],
  'Havana': ['La Habana', 'l’Havana'], 'Kingston': ['Kingston', 'Kingston'],
  'Panama City': ['Ciudad de Panamá', 'Ciutat de Panamà'],
  'Guatemala City': ['Ciudad de Guatemala', 'Ciutat de Guatemala'],
  'San José': ['San José', 'San José'], 'Santo Domingo': ['Santo Domingo', 'Santo Domingo'],
  'Port-au-Prince': ['Puerto Príncipe', 'Port-au-Prince'],
  'Buenos Aires': ['Buenos Aires', 'Buenos Aires'], 'Brasília': ['Brasilia', 'Brasília'],
  'Lima': ['Lima', 'Lima'], 'Quito': ['Quito', 'Quito'], 'Bogotá': ['Bogotá', 'Bogotà'],
  'Asunción': ['Asunción', 'Asunción'], 'Montevideo': ['Montevideo', 'Montevideo'],
  'Santiago': ['Santiago', 'Santiago'], 'Caracas': ['Caracas', 'Caracas'],
  'Canberra': ['Canberra', 'Canberra'], 'Wellington': ['Wellington', 'Wellington'],
  'Port Moresby': ['Puerto Moresby', 'Port Moresby'],
  'Addis Ababa': ['Adís Abeba', 'Addis Abeba'], 'Nairobi': ['Nairobi', 'Nairobi'],
  'Algiers': ['Argel', 'Alger'], 'Tunis': ['Túnez', 'Tunis'], 'Rabat': ['Rabat', 'Rabat'],
  'Tripoli': ['Trípoli', 'Trípoli'], 'Pretoria': ['Pretoria', 'Pretòria'],
  'Kinshasa': ['Kinsasa', 'Kinshasa'], 'Khartoum': ['Jartum', 'Khartum'],
  'Abuja': ['Abuya', 'Abuja'], 'Dakar': ['Dakar', 'Dakar'],
};

function regionOf(country) {
  if (country.region === 'Europe') return 'europe';
  if (country.region === 'Asia') return 'asia';
  if (country.region === 'Africa') return 'africa';
  if (country.region === 'Oceania') return 'oceania';
  return country.subregion === 'South America' ? 'south-america' : 'north-america';
}

function localizedCapital(value) {
  const translated = capitalTranslations[value];
  return { es: translated?.[0] ?? value, en: value, ca: translated?.[1] ?? value };
}

const selected = countries
  .filter(country => country.unMember || country.cca2 === 'VA' || country.cca2 === 'PS')
  .map(country => {
    const capitals = country.capital.map(localizedCapital);
    return {
      id: country.cca2.toLowerCase(), iso2: country.cca2, iso3: country.cca3,
      names: {
        es: isoCountries.getName(country.cca2, 'es') ?? country.translations.spa?.common ?? country.name.common,
        en: isoCountries.getName(country.cca2, 'en') ?? country.name.common,
        ca: isoCountries.getName(country.cca2, 'ca') ?? country.name.common,
      },
      studyRegion: regionOf(country), flagCode: country.cca2.toLowerCase(), capitals,
      capitalQuizEnabled: capitals.length === 1 && !ambiguousCapitalCodes.has(country.cca2),
      enabled: true,
    };
  })
  .sort((left, right) => left.names.en.localeCompare(right.names.en));

if (selected.length !== 195) throw new Error(`Expected 195 countries, found ${selected.length}`);
for (const country of selected) {
  const flag = path.join(root, 'node_modules', 'flag-icons', 'flags', '4x3', `${country.flagCode}.svg`);
  if (!fs.existsSync(flag)) throw new Error(`Missing flag SVG for ${country.iso2}`);
}

const source = `// Generated by scripts/generate-countries.mjs from world-countries,\n// i18n-iso-countries and flag-icons. Do not edit entries manually.\nimport { Country } from '../core/models/country.model';\n\nexport const COUNTRIES: readonly Country[] = ${JSON.stringify(selected, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'src', 'app', 'data', 'countries.generated.ts'), source);
console.log(`Generated ${selected.length} countries; ${selected.filter(item => item.capitalQuizEnabled).length} capital-quiz eligible.`);
