import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en from "./i18n/en.json"
import fr from "./i18n/fr.json"
import ar from "./i18n/ar.json"

i18n
.use(LanguageDetector)
.use(initReactI18next)
.init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar }
  },

  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
})

export default i18n
