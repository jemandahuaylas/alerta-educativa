import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('useIsMobile - onChange:', newIsMobile, 'width:', window.innerWidth);
      setIsMobile(newIsMobile);
    }
    mql.addEventListener("change", onChange)
    const initialIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    console.log('useIsMobile - initial:', initialIsMobile, 'width:', window.innerWidth);
    setIsMobile(initialIsMobile);
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
