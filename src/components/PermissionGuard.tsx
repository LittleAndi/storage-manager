import React from "react";

export interface Permission {
  isOwner: boolean;
  canEdit: boolean;
  canView: boolean;
}

interface PermissionGuardProps {
  permission: Permission;
  require: "owner" | "edit" | "view";
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, require, children }) => {
  const allowed =
    (require === "owner" && permission.isOwner) ||
    (require === "edit" && permission.canEdit) ||
    (require === "view" && permission.canView);
  return allowed ? <>{children}</> : null;
};

export default PermissionGuard;
