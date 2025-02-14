
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("en")}
        className="w-14"
      >
        EN
      </Button>
      <Button
        variant={language === "pt-BR" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("pt-BR")}
        className="w-14"
      >
        PT
      </Button>
      <Button
        variant={language === "es" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("es")}
        className="w-14"
      >
        ES
      </Button>
    </div>
  )
}
