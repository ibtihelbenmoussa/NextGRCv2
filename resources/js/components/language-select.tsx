import { useState, useRef, useEffect } from "react"
import i18n from "@/i18n"
import { Globe } from "lucide-react"

const LANGUAGES = [
  {
    code: "en",
    label: "English",
    flag: "https://flagcdn.com/w20/us.png"
  },
  {
    code: "fr",
    label: "Français",
    flag: "https://flagcdn.com/w20/fr.png"
  },
]

export default function LanguageDropdown() {

  // ✅ synchroniser avec la langue actuelle de i18n
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(() => i18n.language?.slice(0, 2) || "en")

  const ref = useRef<HTMLDivElement>(null)

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    setSelected(lang)
    setOpen(false)
  }

  // ✅ écouter les changements de langue depuis l'extérieur
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setSelected(lng.slice(0, 2))
    }
    i18n.on("languageChanged", handleLanguageChanged)
    return () => {
      i18n.off("languageChanged", handleLanguageChanged)
    }
  }, [])

  // close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // ✅ afficher le drapeau de la langue sélectionnée dans le bouton
  const currentLang = LANGUAGES.find(l => l.code === selected) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="lang-container">

      {/* bouton avec drapeau actif */}
      <div
        className="lang-icon"
        onClick={() => setOpen(!open)}
        title={currentLang.label}
      >
        <img
          src={currentLang.flag}
          alt={currentLang.label}
          className="flag"
        />
      </div>

      {open && (
        <div className="lang-menu">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`lang-item ${selected === lang.code ? "active" : ""}`}
            >
              <img
                src={lang.flag}
                alt={lang.label}
                className="flag"
              />
              {lang.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .lang-container {
          position: relative;
          display: inline-block;
        }

        .lang-icon {
          padding: 6px 8px;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }

        .lang-icon:hover {
          background: rgba(0,0,0,0.05);
        }

        .dark .lang-icon:hover {
          background: rgba(255,255,255,0.08);
        }

        .flag {
          width: 20px;
          height: 14px;
          object-fit: cover;
          border-radius: 2px;
        }

        .lang-menu {
          position: absolute;
          right: 0;
          top: 40px;
          width: 160px;
          border-radius: 8px;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          overflow: hidden;
        }

        .lang-item {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .lang-item:hover {
          background: #f5f5f5;
        }

        .lang-item.active {
          font-weight: bold;
          background: #e5e7eb;
        }

        /* dark mode */
        .dark .lang-menu {
          background: #1f2937;
          border: 1px solid #374151;
        }

        .dark .lang-item {
          color: #f3f4f6;
        }

        .dark .lang-item:hover {
          background: #374151;
        }

        .dark .lang-item.active {
          background: #4b5563;
        }
      `}</style>

    </div>
  )
}