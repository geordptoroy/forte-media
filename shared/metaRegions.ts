/**
 * Meta Ads Library — Regiões Suportadas
 * ─────────────────────────────────────────────────────────────────────────────
 * Lista completa de países/regiões aceitos pelo parâmetro `ad_reached_countries`
 * da Meta Ads Archive API (Graph API v25.0).
 *
 * Fonte oficial: https://developers.facebook.com/docs/graph-api/reference/ads_archive/
 *
 * Cada entrada contém:
 *  - code: código ISO 3166-1 alpha-2 (ou "ALL" para qualquer região)
 *  - name: nome do país em português
 *  - nameEn: nome em inglês (para busca)
 *  - region: agrupamento geográfico
 *  - priority: países mais relevantes para o público-alvo (infoprodutores BR/LATAM)
 */

export interface MetaRegion {
  code: string;
  name: string;
  nameEn: string;
  region: string;
  priority?: boolean;
}

export const META_REGIONS: MetaRegion[] = [
  // ── Especial ────────────────────────────────────────────────────────────────
  { code: "ALL", name: "Qualquer lugar", nameEn: "Anywhere", region: "Especial", priority: true },

  // ── América do Sul (alta prioridade para infoprodutores LATAM) ──────────────
  { code: "BR", name: "Brasil", nameEn: "Brazil", region: "América do Sul", priority: true },
  { code: "AR", name: "Argentina", nameEn: "Argentina", region: "América do Sul", priority: true },
  { code: "CL", name: "Chile", nameEn: "Chile", region: "América do Sul", priority: true },
  { code: "CO", name: "Colômbia", nameEn: "Colombia", region: "América do Sul", priority: true },
  { code: "PE", name: "Peru", nameEn: "Peru", region: "América do Sul", priority: true },
  { code: "VE", name: "Venezuela", nameEn: "Venezuela", region: "América do Sul" },
  { code: "EC", name: "Equador", nameEn: "Ecuador", region: "América do Sul" },
  { code: "BO", name: "Bolívia", nameEn: "Bolivia", region: "América do Sul" },
  { code: "PY", name: "Paraguai", nameEn: "Paraguay", region: "América do Sul" },
  { code: "UY", name: "Uruguai", nameEn: "Uruguay", region: "América do Sul" },
  { code: "GY", name: "Guiana", nameEn: "Guyana", region: "América do Sul" },
  { code: "SR", name: "Suriname", nameEn: "Suriname", region: "América do Sul" },
  { code: "GF", name: "Guiana Francesa", nameEn: "French Guiana", region: "América do Sul" },
  { code: "FK", name: "Ilhas Malvinas", nameEn: "Falkland Islands", region: "América do Sul" },

  // ── América do Norte ────────────────────────────────────────────────────────
  { code: "US", name: "Estados Unidos", nameEn: "United States", region: "América do Norte", priority: true },
  { code: "CA", name: "Canadá", nameEn: "Canada", region: "América do Norte", priority: true },
  { code: "MX", name: "México", nameEn: "Mexico", region: "América do Norte", priority: true },
  { code: "PR", name: "Porto Rico", nameEn: "Puerto Rico", region: "América do Norte" },

  // ── América Central e Caribe ────────────────────────────────────────────────
  { code: "GT", name: "Guatemala", nameEn: "Guatemala", region: "América Central" },
  { code: "HN", name: "Honduras", nameEn: "Honduras", region: "América Central" },
  { code: "SV", name: "El Salvador", nameEn: "El Salvador", region: "América Central" },
  { code: "NI", name: "Nicarágua", nameEn: "Nicaragua", region: "América Central" },
  { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", region: "América Central" },
  { code: "PA", name: "Panamá", nameEn: "Panama", region: "América Central" },
  { code: "BZ", name: "Belize", nameEn: "Belize", region: "América Central" },
  { code: "DO", name: "República Dominicana", nameEn: "Dominican Republic", region: "Caribe" },
  { code: "CU", name: "Cuba", nameEn: "Cuba", region: "Caribe" },
  { code: "JM", name: "Jamaica", nameEn: "Jamaica", region: "Caribe" },
  { code: "TT", name: "Trinidad e Tobago", nameEn: "Trinidad and Tobago", region: "Caribe" },
  { code: "HT", name: "Haiti", nameEn: "Haiti", region: "Caribe" },
  { code: "BB", name: "Barbados", nameEn: "Barbados", region: "Caribe" },
  { code: "LC", name: "Santa Lúcia", nameEn: "St. Lucia", region: "Caribe" },
  { code: "VC", name: "São Vicente e Granadinas", nameEn: "Saint Vincent and the Grenadines", region: "Caribe" },
  { code: "GD", name: "Granada", nameEn: "Grenada", region: "Caribe" },
  { code: "AG", name: "Antígua e Barbuda", nameEn: "Antigua", region: "Caribe" },
  { code: "KN", name: "São Cristóvão e Névis", nameEn: "Saint Kitts and Nevis", region: "Caribe" },
  { code: "DM", name: "Dominica", nameEn: "Dominica", region: "Caribe" },
  { code: "BS", name: "Bahamas", nameEn: "The Bahamas", region: "Caribe" },
  { code: "AW", name: "Aruba", nameEn: "Aruba", region: "Caribe" },
  { code: "CW", name: "Curaçao", nameEn: "Curaçao", region: "Caribe" },
  { code: "BQ", name: "Bonaire, Sint Eustatius e Saba", nameEn: "Bonaire, Sint Eustatius and Saba", region: "Caribe" },
  { code: "SX", name: "Sint Maarten", nameEn: "Sint Maarten", region: "Caribe" },
  { code: "MQ", name: "Martinica", nameEn: "Martinique", region: "Caribe" },
  { code: "GP", name: "Guadalupe", nameEn: "Guadeloupe", region: "Caribe" },
  { code: "VI", name: "Ilhas Virgens Americanas", nameEn: "US Virgin Islands", region: "Caribe" },
  { code: "KY", name: "Ilhas Cayman", nameEn: "Cayman Islands", region: "Caribe" },
  { code: "TC", name: "Ilhas Turks e Caicos", nameEn: "Turks and Caicos Islands", region: "Caribe" },
  { code: "BM", name: "Bermudas", nameEn: "Bermuda", region: "Caribe" },
  { code: "AI", name: "Anguila", nameEn: "Anguilla", region: "Caribe" },
  { code: "MS", name: "Montserrat", nameEn: "Montserrat", region: "Caribe" },
  { code: "VG", name: "Ilhas Virgens Britânicas", nameEn: "British Virgin Islands", region: "Caribe" },

  // ── Europa Ocidental ─────────────────────────────────────────────────────────
  { code: "GB", name: "Reino Unido", nameEn: "United Kingdom", region: "Europa", priority: true },
  { code: "DE", name: "Alemanha", nameEn: "Germany", region: "Europa", priority: true },
  { code: "FR", name: "França", nameEn: "France", region: "Europa", priority: true },
  { code: "ES", name: "Espanha", nameEn: "Spain", region: "Europa", priority: true },
  { code: "PT", name: "Portugal", nameEn: "Portugal", region: "Europa", priority: true },
  { code: "IT", name: "Itália", nameEn: "Italy", region: "Europa" },
  { code: "NL", name: "Países Baixos", nameEn: "Netherlands", region: "Europa" },
  { code: "BE", name: "Bélgica", nameEn: "Belgium", region: "Europa" },
  { code: "AT", name: "Áustria", nameEn: "Austria", region: "Europa" },
  { code: "CH", name: "Suíça", nameEn: "Switzerland", region: "Europa" },
  { code: "SE", name: "Suécia", nameEn: "Sweden", region: "Europa" },
  { code: "NO", name: "Noruega", nameEn: "Norway", region: "Europa" },
  { code: "DK", name: "Dinamarca", nameEn: "Denmark", region: "Europa" },
  { code: "FI", name: "Finlândia", nameEn: "Finland", region: "Europa" },
  { code: "IE", name: "Irlanda", nameEn: "Ireland", region: "Europa" },
  { code: "LU", name: "Luxemburgo", nameEn: "Luxembourg", region: "Europa" },
  { code: "GR", name: "Grécia", nameEn: "Greece", region: "Europa" },
  { code: "PL", name: "Polônia", nameEn: "Poland", region: "Europa" },
  { code: "CZ", name: "República Tcheca", nameEn: "Czech Republic", region: "Europa" },
  { code: "HU", name: "Hungria", nameEn: "Hungary", region: "Europa" },
  { code: "RO", name: "Romênia", nameEn: "Romania", region: "Europa" },
  { code: "BG", name: "Bulgária", nameEn: "Bulgaria", region: "Europa" },
  { code: "HR", name: "Croácia", nameEn: "Croatia", region: "Europa" },
  { code: "SK", name: "Eslováquia", nameEn: "Slovakia", region: "Europa" },
  { code: "SI", name: "Eslovênia", nameEn: "Slovenia", region: "Europa" },
  { code: "LT", name: "Lituânia", nameEn: "Lithuania", region: "Europa" },
  { code: "LV", name: "Letônia", nameEn: "Latvia", region: "Europa" },
  { code: "EE", name: "Estônia", nameEn: "Estonia", region: "Europa" },
  { code: "CY", name: "Chipre", nameEn: "Cyprus", region: "Europa" },
  { code: "MT", name: "Malta", nameEn: "Malta", region: "Europa" },
  { code: "IS", name: "Islândia", nameEn: "Iceland", region: "Europa" },
  { code: "RS", name: "Sérvia", nameEn: "Serbia", region: "Europa" },
  { code: "BA", name: "Bósnia e Herzegovina", nameEn: "Bosnia and Herzegovina", region: "Europa" },
  { code: "ME", name: "Montenegro", nameEn: "Montenegro", region: "Europa" },
  { code: "MK", name: "Macedônia do Norte", nameEn: "Macedonia", region: "Europa" },
  { code: "AL", name: "Albânia", nameEn: "Albania", region: "Europa" },
  { code: "UA", name: "Ucrânia", nameEn: "Ukraine", region: "Europa" },
  { code: "MD", name: "Moldávia", nameEn: "Moldova", region: "Europa" },
  { code: "BY", name: "Bielorrússia", nameEn: "Belarus", region: "Europa" },
  { code: "RU", name: "Rússia", nameEn: "Russia", region: "Europa" },
  { code: "GE", name: "Geórgia", nameEn: "Georgia", region: "Europa" },
  { code: "AM", name: "Armênia", nameEn: "Armenia", region: "Europa" },
  { code: "AZ", name: "Azerbaijão", nameEn: "Azerbaijan", region: "Europa" },
  { code: "AD", name: "Andorra", nameEn: "Andorra", region: "Europa" },
  { code: "MC", name: "Mônaco", nameEn: "Monaco", region: "Europa" },
  { code: "SM", name: "San Marino", nameEn: "San Marino", region: "Europa" },
  { code: "VA", name: "Vaticano", nameEn: "Vatican City", region: "Europa" },
  { code: "LI", name: "Liechtenstein", nameEn: "Liechtenstein", region: "Europa" },
  { code: "XK", name: "Kosovo", nameEn: "Kosovo", region: "Europa" },
  { code: "FO", name: "Ilhas Faroé", nameEn: "Faroe Islands", region: "Europa" },
  { code: "GL", name: "Groenlândia", nameEn: "Greenland", region: "Europa" },
  { code: "GI", name: "Gibraltar", nameEn: "Gibraltar", region: "Europa" },
  { code: "JE", name: "Jersey", nameEn: "Jersey", region: "Europa" },
  { code: "GG", name: "Guernsey", nameEn: "Guernsey", region: "Europa" },
  { code: "IM", name: "Ilha de Man", nameEn: "Isle of Man", region: "Europa" },
  { code: "AX", name: "Ilhas Åland", nameEn: "Åland Islands", region: "Europa" },
  { code: "SJ", name: "Svalbard e Jan Mayen", nameEn: "Svalbard and Jan Mayen", region: "Europa" },

  // ── Oriente Médio e Norte da África ─────────────────────────────────────────
  { code: "AE", name: "Emirados Árabes Unidos", nameEn: "United Arab Emirates", region: "Oriente Médio" },
  { code: "SA", name: "Arábia Saudita", nameEn: "Saudi Arabia", region: "Oriente Médio" },
  { code: "QA", name: "Catar", nameEn: "Qatar", region: "Oriente Médio" },
  { code: "KW", name: "Kuwait", nameEn: "Kuwait", region: "Oriente Médio" },
  { code: "BH", name: "Bahrein", nameEn: "Bahrain", region: "Oriente Médio" },
  { code: "OM", name: "Omã", nameEn: "Oman", region: "Oriente Médio" },
  { code: "JO", name: "Jordânia", nameEn: "Jordan", region: "Oriente Médio" },
  { code: "LB", name: "Líbano", nameEn: "Lebanon", region: "Oriente Médio" },
  { code: "IL", name: "Israel", nameEn: "Israel", region: "Oriente Médio" },
  { code: "PS", name: "Palestina", nameEn: "Palestine", region: "Oriente Médio" },
  { code: "IQ", name: "Iraque", nameEn: "Iraq", region: "Oriente Médio" },
  { code: "YE", name: "Iêmen", nameEn: "Yemen", region: "Oriente Médio" },
  { code: "EG", name: "Egito", nameEn: "Egypt", region: "Oriente Médio" },
  { code: "MA", name: "Marrocos", nameEn: "Morocco", region: "Norte da África" },
  { code: "DZ", name: "Argélia", nameEn: "Algeria", region: "Norte da África" },
  { code: "TN", name: "Tunísia", nameEn: "Tunisia", region: "Norte da África" },
  { code: "LY", name: "Líbia", nameEn: "Libya", region: "Norte da África" },

  // ── África Subsaariana ───────────────────────────────────────────────────────
  { code: "ZA", name: "África do Sul", nameEn: "South Africa", region: "África" },
  { code: "NG", name: "Nigéria", nameEn: "Nigeria", region: "África" },
  { code: "KE", name: "Quênia", nameEn: "Kenya", region: "África" },
  { code: "GH", name: "Gana", nameEn: "Ghana", region: "África" },
  { code: "ET", name: "Etiópia", nameEn: "Ethiopia", region: "África" },
  { code: "TZ", name: "Tanzânia", nameEn: "Tanzania", region: "África" },
  { code: "UG", name: "Uganda", nameEn: "Uganda", region: "África" },
  { code: "RW", name: "Ruanda", nameEn: "Rwanda", region: "África" },
  { code: "CM", name: "Camarões", nameEn: "Cameroon", region: "África" },
  { code: "SN", name: "Senegal", nameEn: "Senegal", region: "África" },
  { code: "CI", name: "Costa do Marfim", nameEn: "Côte d'Ivoire", region: "África" },
  { code: "MG", name: "Madagascar", nameEn: "Madagascar", region: "África" },
  { code: "MZ", name: "Moçambique", nameEn: "Mozambique", region: "África" },
  { code: "AO", name: "Angola", nameEn: "Angola", region: "África" },
  { code: "ZM", name: "Zâmbia", nameEn: "Zambia", region: "África" },
  { code: "ZW", name: "Zimbábue", nameEn: "Zimbabwe", region: "África" },
  { code: "BW", name: "Botsuana", nameEn: "Botswana", region: "África" },
  { code: "NA", name: "Namíbia", nameEn: "Namibia", region: "África" },
  { code: "MW", name: "Malawi", nameEn: "Malawi", region: "África" },
  { code: "MU", name: "Maurício", nameEn: "Mauritius", region: "África" },
  { code: "SC", name: "Seicheles", nameEn: "Seychelles", region: "África" },
  { code: "GA", name: "Gabão", nameEn: "Gabon", region: "África" },
  { code: "CD", name: "Congo (RDC)", nameEn: "Democratic Republic of the Congo", region: "África" },
  { code: "CG", name: "Congo (Rep.)", nameEn: "Republic of the Congo", region: "África" },
  { code: "ML", name: "Mali", nameEn: "Mali", region: "África" },
  { code: "BF", name: "Burkina Faso", nameEn: "Burkina Faso", region: "África" },
  { code: "NE", name: "Níger", nameEn: "Niger", region: "África" },
  { code: "TD", name: "Chade", nameEn: "Chad", region: "África" },
  { code: "MR", name: "Mauritânia", nameEn: "Mauritania", region: "África" },
  { code: "GM", name: "Gâmbia", nameEn: "The Gambia", region: "África" },
  { code: "GN", name: "Guiné", nameEn: "Guinea", region: "África" },
  { code: "SL", name: "Serra Leoa", nameEn: "Sierra Leone", region: "África" },
  { code: "LR", name: "Libéria", nameEn: "Liberia", region: "África" },
  { code: "TG", name: "Togo", nameEn: "Togo", region: "África" },
  { code: "BJ", name: "Benin", nameEn: "Benin", region: "África" },
  { code: "GW", name: "Guiné-Bissau", nameEn: "Guinea-Bissau", region: "África" },
  { code: "CV", name: "Cabo Verde", nameEn: "Cape Verde", region: "África" },
  { code: "ST", name: "São Tomé e Príncipe", nameEn: "São Tomé and Príncipe", region: "África" },
  { code: "GQ", name: "Guiné Equatorial", nameEn: "Equatorial Guinea", region: "África" },
  { code: "CF", name: "República Centro-Africana", nameEn: "Central African Republic", region: "África" },
  { code: "SS", name: "Sudão do Sul", nameEn: "South Sudan", region: "África" },
  { code: "SO", name: "Somália", nameEn: "Somalia", region: "África" },
  { code: "ER", name: "Eritreia", nameEn: "Eritrea", region: "África" },
  { code: "DJ", name: "Djibuti", nameEn: "Djibouti", region: "África" },
  { code: "KM", name: "Comores", nameEn: "Comoros", region: "África" },
  { code: "BI", name: "Burundi", nameEn: "Burundi", region: "África" },
  { code: "SZ", name: "Essuatíni", nameEn: "Swaziland", region: "África" },
  { code: "LS", name: "Lesoto", nameEn: "Lesotho", region: "África" },
  { code: "YT", name: "Mayotte", nameEn: "Mayotte", region: "África" },
  { code: "RE", name: "Reunião", nameEn: "Réunion", region: "África" },

  // ── Ásia ─────────────────────────────────────────────────────────────────────
  { code: "IN", name: "Índia", nameEn: "India", region: "Ásia", priority: true },
  { code: "CN", name: "China", nameEn: "China", region: "Ásia" },
  { code: "JP", name: "Japão", nameEn: "Japan", region: "Ásia" },
  { code: "KR", name: "Coreia do Sul", nameEn: "South Korea", region: "Ásia" },
  { code: "ID", name: "Indonésia", nameEn: "Indonesia", region: "Ásia" },
  { code: "PH", name: "Filipinas", nameEn: "Philippines", region: "Ásia" },
  { code: "VN", name: "Vietnã", nameEn: "Vietnam", region: "Ásia" },
  { code: "TH", name: "Tailândia", nameEn: "Thailand", region: "Ásia" },
  { code: "MY", name: "Malásia", nameEn: "Malaysia", region: "Ásia" },
  { code: "SG", name: "Singapura", nameEn: "Singapore", region: "Ásia" },
  { code: "HK", name: "Hong Kong", nameEn: "Hong Kong", region: "Ásia" },
  { code: "TW", name: "Taiwan", nameEn: "Taiwan", region: "Ásia" },
  { code: "PK", name: "Paquistão", nameEn: "Pakistan", region: "Ásia" },
  { code: "BD", name: "Bangladesh", nameEn: "Bangladesh", region: "Ásia" },
  { code: "LK", name: "Sri Lanka", nameEn: "Sri Lanka", region: "Ásia" },
  { code: "NP", name: "Nepal", nameEn: "Nepal", region: "Ásia" },
  { code: "AF", name: "Afeganistão", nameEn: "Afghanistan", region: "Ásia" },
  { code: "KH", name: "Camboja", nameEn: "Cambodia", region: "Ásia" },
  { code: "MM", name: "Myanmar", nameEn: "Myanmar (Burma)", region: "Ásia" },
  { code: "LA", name: "Laos", nameEn: "Laos", region: "Ásia" },
  { code: "BN", name: "Brunei", nameEn: "Brunei", region: "Ásia" },
  { code: "MO", name: "Macau", nameEn: "Macau", region: "Ásia" },
  { code: "MN", name: "Mongólia", nameEn: "Mongolia", region: "Ásia" },
  { code: "BT", name: "Butão", nameEn: "Bhutan", region: "Ásia" },
  { code: "MV", name: "Maldivas", nameEn: "Maldives", region: "Ásia" },
  { code: "TL", name: "Timor-Leste", nameEn: "Timor-Leste", region: "Ásia" },
  { code: "KZ", name: "Cazaquistão", nameEn: "Kazakhstan", region: "Ásia Central" },
  { code: "UZ", name: "Uzbequistão", nameEn: "Uzbekistan", region: "Ásia Central" },
  { code: "TM", name: "Turcomenistão", nameEn: "Turkmenistan", region: "Ásia Central" },
  { code: "TJ", name: "Tajiquistão", nameEn: "Tajikistan", region: "Ásia Central" },
  { code: "KG", name: "Quirguistão", nameEn: "Kyrgyzstan", region: "Ásia Central" },
  { code: "TR", name: "Turquia", nameEn: "Turkey", region: "Ásia" },

  // ── Oceania ──────────────────────────────────────────────────────────────────
  { code: "AU", name: "Austrália", nameEn: "Australia", region: "Oceania", priority: true },
  { code: "NZ", name: "Nova Zelândia", nameEn: "New Zealand", region: "Oceania" },
  { code: "PG", name: "Papua Nova Guiné", nameEn: "Papua New Guinea", region: "Oceania" },
  { code: "FJ", name: "Fiji", nameEn: "Fiji", region: "Oceania" },
  { code: "SB", name: "Ilhas Salomão", nameEn: "Solomon Islands", region: "Oceania" },
  { code: "VU", name: "Vanuatu", nameEn: "Vanuatu", region: "Oceania" },
  { code: "WS", name: "Samoa", nameEn: "Samoa", region: "Oceania" },
  { code: "AS", name: "Samoa Americana", nameEn: "American Samoa", region: "Oceania" },
  { code: "TO", name: "Tonga", nameEn: "Tonga", region: "Oceania" },
  { code: "KI", name: "Kiribati", nameEn: "Kiribati", region: "Oceania" },
  { code: "FM", name: "Micronésia", nameEn: "Federated States of Micronesia", region: "Oceania" },
  { code: "PW", name: "Palau", nameEn: "Palau", region: "Oceania" },
  { code: "MH", name: "Ilhas Marshall", nameEn: "Marshall Islands", region: "Oceania" },
  { code: "TV", name: "Tuvalu", nameEn: "Tuvalu", region: "Oceania" },
  { code: "NR", name: "Nauru", nameEn: "Nauru", region: "Oceania" },
  { code: "NC", name: "Nova Caledônia", nameEn: "New Caledonia", region: "Oceania" },
  { code: "PF", name: "Polinésia Francesa", nameEn: "French Polynesia", region: "Oceania" },
  { code: "GU", name: "Guam", nameEn: "Guam", region: "Oceania" },
  { code: "MP", name: "Ilhas Marianas do Norte", nameEn: "Northern Mariana Islands", region: "Oceania" },
  { code: "CK", name: "Ilhas Cook", nameEn: "Cook Islands", region: "Oceania" },
  { code: "NU", name: "Niue", nameEn: "Niue", region: "Oceania" },
  { code: "NF", name: "Ilha Norfolk", nameEn: "Norfolk Island", region: "Oceania" },
  { code: "CX", name: "Ilha Christmas", nameEn: "Christmas Island", region: "Oceania" },
  { code: "CC", name: "Ilhas Cocos", nameEn: "Cocos (Keeling) Islands", region: "Oceania" },
];

/**
 * Retorna as regiões agrupadas por continente/área geográfica
 */
export function getRegionsByGroup(): Record<string, MetaRegion[]> {
  const groups: Record<string, MetaRegion[]> = {};
  for (const region of META_REGIONS) {
    if (!groups[region.region]) {
      groups[region.region] = [];
    }
    groups[region.region].push(region);
  }
  return groups;
}

/**
 * Retorna apenas os países prioritários (mais relevantes para o público-alvo)
 */
export function getPriorityRegions(): MetaRegion[] {
  return META_REGIONS.filter(r => r.priority);
}

/**
 * Busca uma região pelo código ISO
 */
export function getRegionByCode(code: string): MetaRegion | undefined {
  return META_REGIONS.find(r => r.code === code);
}

/**
 * Retorna o nome de exibição de uma região pelo código
 */
export function getRegionDisplayName(code: string): string {
  const region = getRegionByCode(code);
  return region ? region.name : code;
}

/**
 * Todos os códigos de países válidos para a API Meta
 */
export const META_REGION_CODES = META_REGIONS.map(r => r.code);
