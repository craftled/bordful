export type LanguageDefinition = {
  code: string; // ISO 639-1 code (e.g., "fr")
  name: string; // Full English name (e.g., "French")
  displayName?: string; // Optional different display name if needed
};

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type LanguageName = (typeof LANGUAGES)[number]['name'];

// Primary language definitions sorted alphabetically by English name
export const LANGUAGES: LanguageDefinition[] = [
  { code: 'ab', name: 'Abkhazian' },
  { code: 'aa', name: 'Afar' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'ak', name: 'Akan' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'an', name: 'Aragonese' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'av', name: 'Avaric' },
  { code: 'ae', name: 'Avestan' },
  { code: 'ay', name: 'Aymara' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bm', name: 'Bambara' },
  { code: 'ba', name: 'Bashkir' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bi', name: 'Bislama' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'br', name: 'Breton' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'my', name: 'Burmese' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ch', name: 'Chamorro' },
  { code: 'ce', name: 'Chechen' },
  { code: 'zh', name: 'Chinese' },
  { code: 'cu', name: 'Church Slavic' },
  { code: 'cv', name: 'Chuvash' },
  { code: 'kw', name: 'Cornish' },
  { code: 'co', name: 'Corsican' },
  { code: 'cr', name: 'Cree' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'dv', name: 'Divehi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'dz', name: 'Dzongkha' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'ee', name: 'Ewe' },
  { code: 'fo', name: 'Faroese' },
  { code: 'fj', name: 'Fijian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'ff', name: 'Fulah' },
  { code: 'gl', name: 'Galician' },
  { code: 'lg', name: 'Ganda' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'kl', name: 'Greenlandic' },
  { code: 'gn', name: 'Guarani' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hz', name: 'Herero' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ho', name: 'Hiri Motu' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'io', name: 'Ido' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ia', name: 'Interlingua' },
  { code: 'ie', name: 'Interlingue' },
  { code: 'iu', name: 'Inuktitut' },
  { code: 'ik', name: 'Inupiaq' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kr', name: 'Kanuri' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'ki', name: 'Kikuyu' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'kv', name: 'Komi' },
  { code: 'kg', name: 'Kongo' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'kj', name: 'Kuanyama' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'li', name: 'Limburgish' },
  { code: 'ln', name: 'Lingala' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lu', name: 'Luba-Katanga' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'gv', name: 'Manx' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mh', name: 'Marshallese' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'na', name: 'Nauru' },
  { code: 'nv', name: 'Navajo' },
  { code: 'ne', name: 'Nepali' },
  { code: 'nd', name: 'North Ndebele' },
  { code: 'se', name: 'Northern Sami' },
  { code: 'no', name: 'Norwegian' },
  { code: 'nb', name: 'Norwegian Bokmål' },
  { code: 'nn', name: 'Norwegian Nynorsk' },
  { code: 'ng', name: 'Ndonga' },
  { code: 'ny', name: 'Nyanja' },
  { code: 'oc', name: 'Occitan' },
  { code: 'oj', name: 'Ojibwa' },
  { code: 'or', name: 'Oriya' },
  { code: 'om', name: 'Oromo' },
  { code: 'os', name: 'Ossetian' },
  { code: 'pi', name: 'Pali' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'qu', name: 'Quechua' },
  { code: 'ro', name: 'Romanian' },
  { code: 'rm', name: 'Romansh' },
  { code: 'rn', name: 'Rundi' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sg', name: 'Sango' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'sc', name: 'Sardinian' },
  { code: 'gd', name: 'Scottish Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'sn', name: 'Shona' },
  { code: 'ii', name: 'Sichuan Yi' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'nr', name: 'South Ndebele' },
  { code: 'st', name: 'Southern Sotho' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ss', name: 'Swati' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ty', name: 'Tahitian' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'to', name: 'Tongan' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'tn', name: 'Tswana' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'tw', name: 'Twi' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 've', name: 'Venda' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'vo', name: 'Volapük' },
  { code: 'wa', name: 'Walloon' },
  { code: 'cy', name: 'Welsh' },
  { code: 'wo', name: 'Wolof' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'za', name: 'Zhuang' },
  { code: 'zu', name: 'Zulu' },
] as const;

// Export language codes array for type checking and iteration
export const LANGUAGE_CODES = LANGUAGES.map((lang) => lang.code);

// Create mappings for quick lookups
export const CODE_TO_LANGUAGE: Record<LanguageCode, LanguageDefinition> =
  Object.fromEntries(LANGUAGES.map((lang) => [lang.code, lang])) as Record<
    LanguageCode,
    LanguageDefinition
  >;

export const NAME_TO_LANGUAGE: Record<LanguageName, LanguageDefinition> =
  Object.fromEntries(LANGUAGES.map((lang) => [lang.name, lang])) as Record<
    LanguageName,
    LanguageDefinition
  >;

// Utility functions for working with languages
export function getLanguageByCode(
  code: string
): LanguageDefinition | undefined {
  return CODE_TO_LANGUAGE[code as LanguageCode];
}

export function getLanguageByName(
  name: string
): LanguageDefinition | undefined {
  // Direct lookup by exact name match
  if (NAME_TO_LANGUAGE[name as LanguageName]) {
    return NAME_TO_LANGUAGE[name as LanguageName];
  }

  // Case-insensitive lookup by normalizing to lowercase
  const normalizedName = name.toLowerCase();
  const language = Object.values(NAME_TO_LANGUAGE).find(
    (lang) => lang.name.toLowerCase() === normalizedName
  );

  if (language) {
    return language;
  }

  // Try to match against the beginning of names
  // This might help with partial matches
  return Object.values(NAME_TO_LANGUAGE).find((lang) =>
    lang.name.toLowerCase().startsWith(normalizedName)
  );
}

export function getLanguageCode(name: string): string | undefined {
  const language = getLanguageByName(name);
  return language?.code;
}

export function getLanguageName(code: string): string | undefined {
  const language = getLanguageByCode(code);
  return language?.name;
}

export function getLanguageDisplayName(codeOrName: string): string | undefined {
  const byCode = getLanguageByCode(codeOrName);
  if (byCode) {
    return byCode.displayName || byCode.name;
  }

  const byName = getLanguageByName(codeOrName);
  if (byName) {
    return byName.displayName || byName.name;
  }

  return;
}

// For backward compatibility and simpler migration
export type Language = LanguageCode;
export const languages = LANGUAGE_CODES;

// UI helper functions
export function getDisplayNameFromCode(code: LanguageCode): string {
  const language = getLanguageByCode(code);
  return language?.displayName || language?.name || code;
}

export function getAllLanguageOptions() {
  return LANGUAGES.map((lang) => ({
    code: lang.code,
    name: lang.name,
    displayName: lang.displayName || lang.name,
  }));
}

// For API integration
export function getLanguagesFromExternalCodes(
  externalCodes: string[]
): LanguageCode[] {
  return externalCodes
    .map((code) => {
      // Try exact match first
      if (LANGUAGE_CODES.includes(code as LanguageCode)) {
        return code as LanguageCode;
      }

      // Try case-insensitive match
      const match = LANGUAGE_CODES.find(
        (langCode) => langCode.toLowerCase() === code.toLowerCase()
      );
      if (match) {
        return match;
      }

      return null;
    })
    .filter((code): code is LanguageCode => code !== null);
}

export function mapLanguageNamesToDisplayNames(
  languages: LanguageCode[]
): string[] {
  return languages.map(getDisplayNameFromCode);
}

// Functions for working with multiple language formats
export function createLanguageLookup<T>(
  transform: (lang: LanguageDefinition) => T
): Record<LanguageCode, T> {
  return Object.fromEntries(
    LANGUAGES.map((lang) => [lang.code, transform(lang)])
  ) as Record<LanguageCode, T>;
}

// Example of a specific lookup for UI display
export const LANGUAGE_DISPLAY_MAP = createLanguageLookup(
  (lang) => lang.displayName || lang.name
);
