import { ROLE_SUPER_ADMIN } from '@/constants/enums';
import { usePage } from '@inertiajs/react';

interface AuthProp {
    user: {
        id: number;
        username: string;
        email?: string | null;
        full_name: string;
        role: string;
        admin_role?: number | null;
        center_id?: number | null;
    } | null;
    role: string | null;
    permissions: string[];
}

export function usePermission() {
    const { auth } = usePage<{ auth?: AuthProp }>().props;

    const user = auth?.user;
    const isSuperAdmin = (auth?.role === 'admin' || user?.role === 'admin') && user?.admin_role === ROLE_SUPER_ADMIN;
    const permissions: string[] = auth?.permissions || [];

    const can = (permissionCode: string): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissions.includes(permissionCode);
    };

    const canAny = (permissionCodes: string[]): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissionCodes.some((code) => permissions.includes(code));
    };

    const canAll = (permissionCodes: string[]): boolean => {
        if (isSuperAdmin) {
            return true;
        }
        return permissionCodes.every((code) => permissions.includes(code));
    };

    return {
        permissions,
        isSuperAdmin,
        can,
        canAny,
        canAll,
    };
}
