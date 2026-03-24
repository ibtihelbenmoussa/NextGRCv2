import { Sun, Moon } from "lucide-react"
import { useState } from "react"

export default function ThemeSwitcher() {

  const [dark, setDark] = useState(false)

  const toggleTheme = () => {

    const root = document.documentElement

    if (dark) {
      root.classList.remove("dark")
    } else {
      root.classList.add("dark")
    }

    setDark(!dark)
  }

  return (

    <button onClick={toggleTheme}>

      {dark ? <Sun size={18}/> : <Moon size={18}/>}

    </button>

  )

}
