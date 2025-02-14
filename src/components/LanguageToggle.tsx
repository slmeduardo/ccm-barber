
import { Flag } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "pt-BR", label: "Português", flag: "🇧🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ]

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "pt-BR" | "es")}>
      <SelectTrigger className="w-[130px]">
        <SelectValue>
          <div className="flex items-center">
            <Flag className="w-4 h-4 mr-2" />
            {languages.find(lang => lang.code === language)?.label}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center">
              <span className="mr-2" role="img" aria-label={`${lang.label} flag`}>
                {lang.flag}
              </span>
              {lang.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
