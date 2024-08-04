import { Accessor, createContext, Setter, useContext } from 'solid-js'

const SidebarVisibilityContext =
  createContext<[Accessor<boolean>, Setter<boolean>]>()

export const SidebarVisibilityProvider = SidebarVisibilityContext.Provider
export const useSidebarVisibility = () => {
  const value = useContext(SidebarVisibilityContext)
  if (!value) {
    throw new Error(
      'useSidebarVisibility must be used within SidebarVisibilityContext',
    )
  }
  return value
}
