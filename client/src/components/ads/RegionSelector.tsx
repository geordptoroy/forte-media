/**
 * RegionSelector — Seletor de Regiões da Meta Ads Library
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente que exibe todos os países/regiões suportados pela Meta Ads Library API,
 * com busca, agrupamento por continente e seleção múltipla — igual à plataforma
 * padrão da Meta Ads Library.
 *
 * Fonte: shared/metaRegions.ts (lista completa de ~240 países)
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, X, Globe, ChevronDown, ChevronUp, Check } from "lucide-react";

// ── Dados inline (espelho do shared/metaRegions.ts para uso no frontend) ─────
// Mantemos aqui para não precisar de import cross-boundary complexo

interface Region {
  code: string;
  name: string;
  nameEn: string;
  region: string;
  priority?: boolean;
}

const META_REGIONS: Region[] = [
  // Especial
  { code: "ALL", name: "Qualquer lugar", nameEn: "Anywhere", region: "Especial", priority: true },
  // América do Sul
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
  // América do Norte
  { code: "US", name: "Estados Unidos", nameEn: "United States", region: "América do Norte", priority: true },
  { code: "CA", name: "Canadá", nameEn: "Canada", region: "América do Norte", priority: true },
  { code: "MX", name: "México", nameEn: "Mexico", region: "América do Norte", priority: true },
  { code: "PR", name: "Porto Rico", nameEn: "Puerto Rico", region: "América do Norte" },
  // América Central
  { code: "GT", name: "Guatemala", nameEn: "Guatemala", region: "América Central" },
  { code: "HN", name: "Honduras", nameEn: "Honduras", region: "América Central" },
  { code: "SV", name: "El Salvador", nameEn: "El Salvador", region: "América Central" },
  { code: "NI", name: "Nicarágua", nameEn: "Nicaragua", region: "América Central" },
  { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", region: "América Central" },
  { code: "PA", name: "Panamá", nameEn: "Panama", region: "América Central" },
  { code: "BZ", name: "Belize", nameEn: "Belize", region: "América Central" },
  // Caribe
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
  { code: "BM", name: "Bermudas", nameEn: "Bermuda", region: "Caribe" },
  // Europa
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
  { code: "LI", name: "Liechtenstein", nameEn: "Liechtenstein", region: "Europa" },
  { code: "XK", name: "Kosovo", nameEn: "Kosovo", region: "Europa" },
  // Oriente Médio
  { code: "AE", name: "Emirados Árabes Unidos", nameEn: "United Arab Emirates", region: "Oriente Médio" },
  { code: "SA", name: "Arábia Saudita", nameEn: "Saudi Arabia", region: "Oriente Médio" },
  { code: "QA", name: "Catar", nameEn: "Qatar", region: "Oriente Médio" },
  { code: "KW", name: "Kuwait", nameEn: "Kuwait", region: "Oriente Médio" },
  { code: "BH", name: "Bahrein", nameEn: "Bahrain", region: "Oriente Médio" },
  { code: "OM", name: "Omã", nameEn: "Oman", region: "Oriente Médio" },
  { code: "JO", name: "Jordânia", nameEn: "Jordan", region: "Oriente Médio" },
  { code: "LB", name: "Líbano", nameEn: "Lebanon", region: "Oriente Médio" },
  { code: "IL", name: "Israel", nameEn: "Israel", region: "Oriente Médio" },
  { code: "IQ", name: "Iraque", nameEn: "Iraq", region: "Oriente Médio" },
  { code: "YE", name: "Iêmen", nameEn: "Yemen", region: "Oriente Médio" },
  { code: "EG", name: "Egito", nameEn: "Egypt", region: "Oriente Médio" },
  // Norte da África
  { code: "MA", name: "Marrocos", nameEn: "Morocco", region: "Norte da África" },
  { code: "DZ", name: "Argélia", nameEn: "Algeria", region: "Norte da África" },
  { code: "TN", name: "Tunísia", nameEn: "Tunisia", region: "Norte da África" },
  { code: "LY", name: "Líbia", nameEn: "Libya", region: "Norte da África" },
  // África
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
  { code: "AO", name: "Angola", nameEn: "Angola", region: "África" },
  { code: "MZ", name: "Moçambique", nameEn: "Mozambique", region: "África" },
  { code: "ZM", name: "Zâmbia", nameEn: "Zambia", region: "África" },
  { code: "ZW", name: "Zimbábue", nameEn: "Zimbabwe", region: "África" },
  { code: "BW", name: "Botsuana", nameEn: "Botswana", region: "África" },
  { code: "NA", name: "Namíbia", nameEn: "Namibia", region: "África" },
  { code: "MU", name: "Maurício", nameEn: "Mauritius", region: "África" },
  { code: "CV", name: "Cabo Verde", nameEn: "Cape Verde", region: "África" },
  // Ásia
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
  { code: "KH", name: "Camboja", nameEn: "Cambodia", region: "Ásia" },
  { code: "MM", name: "Myanmar", nameEn: "Myanmar", region: "Ásia" },
  { code: "BN", name: "Brunei", nameEn: "Brunei", region: "Ásia" },
  { code: "MN", name: "Mongólia", nameEn: "Mongolia", region: "Ásia" },
  { code: "TR", name: "Turquia", nameEn: "Turkey", region: "Ásia" },
  { code: "KZ", name: "Cazaquistão", nameEn: "Kazakhstan", region: "Ásia Central" },
  { code: "UZ", name: "Uzbequistão", nameEn: "Uzbekistan", region: "Ásia Central" },
  { code: "TM", name: "Turcomenistão", nameEn: "Turkmenistan", region: "Ásia Central" },
  { code: "TJ", name: "Tajiquistão", nameEn: "Tajikistan", region: "Ásia Central" },
  { code: "KG", name: "Quirguistão", nameEn: "Kyrgyzstan", region: "Ásia Central" },
  // Oceania
  { code: "AU", name: "Austrália", nameEn: "Australia", region: "Oceania", priority: true },
  { code: "NZ", name: "Nova Zelândia", nameEn: "New Zealand", region: "Oceania" },
  { code: "PG", name: "Papua Nova Guiné", nameEn: "Papua New Guinea", region: "Oceania" },
  { code: "FJ", name: "Fiji", nameEn: "Fiji", region: "Oceania" },
  { code: "WS", name: "Samoa", nameEn: "Samoa", region: "Oceania" },
  { code: "TO", name: "Tonga", nameEn: "Tonga", region: "Oceania" },
  { code: "SB", name: "Ilhas Salomão", nameEn: "Solomon Islands", region: "Oceania" },
  { code: "VU", name: "Vanuatu", nameEn: "Vanuatu", region: "Oceania" },
  { code: "PF", name: "Polinésia Francesa", nameEn: "French Polynesia", region: "Oceania" },
  { code: "NC", name: "Nova Caledônia", nameEn: "New Caledonia", region: "Oceania" },
  { code: "GU", name: "Guam", nameEn: "Guam", region: "Oceania" },
];

// Ordem de exibição dos grupos
const REGION_ORDER = [
  "Especial",
  "América do Sul",
  "América do Norte",
  "América Central",
  "Caribe",
  "Europa",
  "Oriente Médio",
  "Norte da África",
  "África",
  "Ásia",
  "Ásia Central",
  "Oceania",
];

interface RegionSelectorProps {
  selected: string[];
  onChange: (countries: string[]) => void;
  className?: string;
}

export function RegionSelector({ selected, onChange, className }: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Especial", "América do Sul", "América do Norte"])
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCountry = (code: string) => {
    if (code === "ALL") {
      // "Qualquer lugar" é exclusivo
      onChange(["ALL"]);
      return;
    }
    const newSelected = selected.filter(c => c !== "ALL"); // remove ALL se existia
    if (newSelected.includes(code)) {
      const result = newSelected.filter(c => c !== code);
      onChange(result.length === 0 ? ["BR"] : result); // mínimo 1 país
    } else {
      onChange([...newSelected, code]);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const selectAll = () => onChange(["ALL"]);
  const clearAll = () => onChange(["BR"]);

  // Filtrar regiões pela busca
  const filteredRegions = useMemo(() => {
    if (!search.trim()) return META_REGIONS;
    const q = search.toLowerCase().trim();
    return META_REGIONS.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.nameEn.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Agrupar por região
  const groupedRegions = useMemo(() => {
    const groups: Record<string, Region[]> = {};
    for (const r of filteredRegions) {
      if (!groups[r.region]) groups[r.region] = [];
      groups[r.region].push(r);
    }
    return groups;
  }, [filteredRegions]);

  // Label do botão trigger
  const triggerLabel = useMemo(() => {
    if (selected.includes("ALL")) return "Qualquer lugar";
    if (selected.length === 0) return "Selecionar países";
    if (selected.length === 1) {
      const region = META_REGIONS.find(r => r.code === selected[0]);
      return region ? `${region.name} (${region.code})` : selected[0];
    }
    return `${selected.length} países selecionados`;
  }, [selected]);

  const orderedGroups = REGION_ORDER.filter(g => groupedRegions[g]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.08] text-xs text-white hover:border-white/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="truncate">{triggerLabel}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        )}
      </button>

      {/* Tags de países selecionados */}
      {selected.length > 0 && !selected.includes("ALL") && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(code => {
            const region = META_REGIONS.find(r => r.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.08] border border-white/[0.12] text-[9px] font-black text-white"
              >
                {code}
                <button
                  type="button"
                  onClick={() => toggleCountry(code)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-black border border-white/[0.12] shadow-2xl max-h-[420px] flex flex-col">
          {/* Busca */}
          <div className="p-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08]">
              <Search className="w-3 h-3 text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-600 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex gap-1 px-2 py-1.5 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 py-1 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white border border-white/[0.06] hover:border-white/20 transition-all"
            >
              Qualquer lugar
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 py-1 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white border border-white/[0.06] hover:border-white/20 transition-all"
            >
              Limpar
            </button>
          </div>

          {/* Lista de países agrupados */}
          <div className="overflow-y-auto flex-1">
            {orderedGroups.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-600">
                Nenhum país encontrado para "{search}"
              </div>
            ) : (
              orderedGroups.map(groupName => {
                const regions = groupedRegions[groupName];
                const isExpanded = expandedGroups.has(groupName) || !!search;
                const selectedInGroup = regions.filter(r => selected.includes(r.code)).length;

                return (
                  <div key={groupName} className="border-b border-white/[0.04] last:border-0">
                    {/* Cabeçalho do grupo */}
                    {!search && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupName)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                            {groupName}
                          </span>
                          {selectedInGroup > 0 && (
                            <span className="px-1.5 py-0.5 bg-white/[0.08] text-[8px] font-black text-white">
                              {selectedInGroup}
                            </span>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-600" />
                        )}
                      </button>
                    )}

                    {/* Países do grupo */}
                    {isExpanded && (
                      <div className="px-2 pb-1.5">
                        {regions.map(region => {
                          const isSelected = selected.includes(region.code);
                          return (
                            <button
                              key={region.code}
                              type="button"
                              onClick={() => toggleCountry(region.code)}
                              className={cn(
                                "w-full flex items-center justify-between px-2 py-1.5 text-left transition-colors",
                                isSelected
                                  ? "bg-white/[0.08] text-white"
                                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[9px] font-black text-gray-600 w-6 shrink-0 font-mono">
                                  {region.code}
                                </span>
                                <span className="text-[11px] truncate">{region.name}</span>
                                {region.priority && (
                                  <span className="text-[8px] text-gray-700 shrink-0">★</span>
                                )}
                              </div>
                              {isSelected && (
                                <Check className="w-3 h-3 text-white shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer com contagem */}
          <div className="px-3 py-2 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[9px] text-gray-600">
              {selected.includes("ALL")
                ? "Todos os países selecionados"
                : `${selected.length} país(es) selecionado(s)`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[9px] font-black uppercase tracking-widest text-white hover:text-gray-300 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
