import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { AdminAccountManagement } from "../../features/admin/AdminAccountManagement";
import { AdminBusinessManagement } from "../../features/admin/AdminBusinessManagement";
import { AdminPaymentQueue } from "../../features/admin/AdminPaymentQueue";
import { AdminUserManagement } from "../../features/admin/AdminUserManagement";
import { AdminUserSupportQueue } from "../../features/admin/AdminUserSupportQueue";
import { AdminSupportQueue } from "./AdminPlatformPage";

export function AdminUsersPage() {
  return <AdminModulePage eyebrow="İstifadəçi modulu" title="İstifadəçilər" description="İstifadəçiləri axtarın, coin balansını idarə edin və parol dəyişikliklərini təhlükəsiz şəkildə tamamlayın."><AdminUserManagement /></AdminModulePage>;
}

export function AdminBusinessesPage() {
  return <AdminModulePage eyebrow="Biznes modulu" title="Bizneslər" description="Biznesləri, otaq sayını və xüsusi limit artımlarını ayrıca idarə edin."><AdminBusinessManagement /></AdminModulePage>;
}

export function AdminAccountsPage() {
  return <AdminModulePage eyebrow="Giriş modulu" title="Admin hesabları" description="Administrator hesablarını yaradın və giriş icazələrini nəzarətdə saxlayın."><AdminAccountManagement /></AdminModulePage>;
}

export function AdminPaymentsPage() {
  return <AdminModulePage eyebrow="Balans modulu" title="Ödənişlər" description="Yüklənmiş çekləri yoxlayın, təsdiqləyin və ya əsaslandırılmış şəkildə rədd edin."><AdminPaymentQueue /></AdminModulePage>;
}

export function AdminRequestsPage() {
  return <AdminModulePage eyebrow="İstifadəçi dəstəyi" title="Müraciətlər" description="İstifadəçilərin problem və tövsiyələrini, cavablarını və əlavə fayllarını idarə edin."><AdminUserSupportQueue /></AdminModulePage>;
}

export function AdminSupportPage() {
  return <AdminModulePage eyebrow="Manual yoxlama" title="Yoxlama növbəsi" description="Sahiblik, telefon dəyişikliyi və hesab silinməsi müraciətlərini ayrıca nəzərdən keçirin."><AdminSupportQueue /></AdminModulePage>;
}

function AdminModulePage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <div className="admin-module-page">
      <header className="admin-module-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="button button--secondary" to="/platform">İcmala qayıt</Link>
      </header>
      {children}
    </div>
  );
}
