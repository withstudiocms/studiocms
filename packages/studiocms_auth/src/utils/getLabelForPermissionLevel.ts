import type { UserSessionData } from "studiocms:auth/lib/types";

// TODO: i18n 
const getLabelForPermissionLevel = (permissionLevel: UserSessionData['permissionLevel']) => {
  switch (permissionLevel) {
    case "admin":
      return "Administrator"
    case "editor":
      return "Editor"
    case "owner": 
      return "Owner"
    case "visitor":
      return "Visitor"
    default:
      return "Unknown"
  }
}

export { getLabelForPermissionLevel };
