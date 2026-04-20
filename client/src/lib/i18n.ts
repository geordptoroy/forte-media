import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    translation: {
      "minerador_title": "Minerador",
      "minerador_pro": "Pro",
      "minerador_subtitle": "Busca Avançada de Anúncios Meta",
      "search_placeholder": "Ex: Emagrecimento, Dropshipping...",
      "country": "País",
      "product_type": "Tipo de Produto",
      "funnel": "Funil",
      "minerar_btn": "Minerar",
      "scale_label": "Escala de Anúncios Repetidos",
      "duration_label": "Duração da Veiculação",
      "results_count": "{{count}} RESULTADOS",
      "no_ads_found": "Nenhum anúncio encontrado",
      "try_different_filters": "Tente mudar as palavras-chave ou filtros",
      "auto_loading": "Auto-carregando: {{current}} de {{total}} anúncios...",
      "stop": "Parar",
      "all": "Todos",
      "infoproduct": "Infoproduto",
      "nutra": "Suplementos/Nutra",
      "dropshipping": "Dropshipping",
      "local_business": "Comércio Local",
      "fashion": "Moda",
      "electronics": "Eletrônicos",
      "services": "Serviços",
      "others": "Outros",
      "low_scale": "Baixa Escala",
      "medium_scale": "Média Escala",
      "high_scale": "Alta Escala",
      "viral_scale": "Escala Viral",
      "ads_in_scale": "ADS EM ESCALA",
      "copies": "Cópias",
      "active_days": "dias ativos",
      "active_today": "Ativo hoje"
    }
  },
  en: {
    translation: {
      "minerador_title": "Miner",
      "minerador_pro": "Pro",
      "minerador_subtitle": "Advanced Meta Ads Search",
      "search_placeholder": "Ex: Weight loss, Dropshipping...",
      "country": "Country",
      "product_type": "Product Type",
      "funnel": "Funnel",
      "minerar_btn": "Mine",
      "scale_label": "Repeated Ads Scale",
      "duration_label": "Delivery Duration",
      "results_count": "{{count}} RESULTS",
      "no_ads_found": "No ads found",
      "try_different_filters": "Try changing keywords or filters",
      "auto_loading": "Auto-loading: {{current}} of {{total}} ads...",
      "stop": "Stop",
      "all": "All",
      "infoproduct": "Infoproduct",
      "nutra": "Supplements/Nutra",
      "dropshipping": "Dropshipping",
      "local_business": "Local Business",
      "fashion": "Fashion",
      "electronics": "Electronics",
      "services": "Services",
      "others": "Others",
      "low_scale": "Low Scale",
      "medium_scale": "Medium Scale",
      "high_scale": "High Scale",
      "viral_scale": "Viral Scale",
      "ads_in_scale": "ADS IN SCALE",
      "copies": "Copies",
      "active_days": "active days",
      "active_today": "Active today"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
