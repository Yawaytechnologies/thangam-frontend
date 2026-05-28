import React, { useMemo } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useLogout } from '../../hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Branch Admin',
  DIRECTOR: 'Director',
  EXECUTIVE_DIRECTOR: 'Executive Director',
  DEPUTY_DIRECTOR: 'Deputy Director',
  SENIOR_MANAGER: 'Senior Manager',
  BUSINESS_MANAGER: 'Business Manager',
  AGENT: 'Agent',
};

function formatRole(role?: string | null) {
  if (!role) return 'Super Administrator';
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

function getInitials(name?: string | null) {
  return (name || 'Super Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function getDisplayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function formatStatus(status?: string | null) {
  if (!status) return 'Active';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function IconMail({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 9h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconPhone({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11.04 11.04 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
    </svg>
  );
}

function IconShield({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.62-4.02A11.95 11.95 0 0112 3.75 11.95 11.95 0 013.38 5.98C3.13 7.17 3 8.39 3 9.63c0 5.08 3.04 9.66 7.72 11.64a3.3 3.3 0 002.56 0C17.96 19.29 21 14.71 21 9.63c0-1.24-.13-2.46-.38-3.65z" />
    </svg>
  );
}

function IconUser({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}

function IconBuilding({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" />
    </svg>
  );
}

function IconLogout({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
    </svg>
  );
}

function InfoCard({
  label,
  value,
  icon,
  breakAll = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-[10px] border border-[#ececf1] bg-white p-4 shadow-[0_6px_18px_rgba(15,20,25,0.035)]">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#f5f0df] text-[#a47d05]">
        {icon}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.04em] text-[#70727a]">
        {label}
      </p>

      <p
        className={`mt-1 text-[13px] font-black leading-4 text-[#171a21] ${
          breakAll ? 'break-all' : 'break-words'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const SuperAdminProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const logout = useLogout();

  const profile = useMemo(() => {
    const member = user?.member;
    const admin = user?.admin;

    const fullName =
      member?.fullName ??
      admin?.fullName ??
      user?.email ??
      user?.phone ??
      'Super Admin';

    const email = user?.email ?? member?.email ?? admin?.email ?? '';
    const phone = user?.phone ?? member?.phone ?? admin?.phone ?? '';
    const role = formatRole(user?.role);
    const status = formatStatus(user?.status);
    const branch =
      member?.branch?.name ??
      admin?.branch?.name ??
      'Central Command';

    return {
      fullName,
      email,
      phone,
      role,
      status,
      branch,
      initials: getInitials(fullName),
    };
  }, [user]);

  return (
    <div className="min-h-full bg-[#f8f8fb] px-4 py-4 sm:px-6 lg:px-7">
      <div className="mx-auto w-full max-w-[900px] space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a47d05]">
              Account Center
            </p>

            <h1 className="mt-1 text-[24px] font-black leading-none text-[#11141a]">
              Profile
            </h1>

            <p className="mt-1 text-[13px] font-medium text-[#616570]">
              Super Admin account information and access status.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {profile.status}
          </span>
        </div>

        {/* Main profile card */}
        <section className="overflow-hidden rounded-[14px] border border-[#ececf1] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)]">
          <div
            className="relative min-h-[118px] px-5 py-5 sm:px-6"
            style={{
              background:
                'linear-gradient(135deg, var(--color-navy), var(--color-navy-mid))',
            }}
          >
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="h-full w-full bg-[radial-gradient(circle_at_18px_18px,#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />
            </div>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-[3px] border-white text-[26px] font-black text-navy shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))',
                  }}
                >
                  {profile.initials}
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-[21px] font-black leading-tight text-white">
                    {profile.fullName}
                  </h2>

                  <p className="mt-1 text-[13px] font-semibold text-white/70">
                    {profile.role}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/85 ring-1 ring-white/15">
                    <IconBuilding className="h-3.5 w-3.5" />
                    {profile.branch}
                  </div>
                </div>
              </div>

              <div className="w-fit rounded-[11px] border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white/55">
                  Access Level
                </p>
                <p className="mt-0.5 text-[15px] font-black">
                  Full Control
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Email"
              value={getDisplayValue(profile.email)}
              icon={<IconMail />}
              breakAll
            />

            <InfoCard
              label="Phone"
              value={getDisplayValue(profile.phone)}
              icon={<IconPhone />}
            />

            <InfoCard
              label="Role"
              value={profile.role}
              icon={<IconShield />}
            />

            <InfoCard
              label="Status"
              value={profile.status}
              icon={<IconUser />}
            />
          </div>
        </section>

        {/* Bottom details */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <section className="rounded-[13px] border border-[#ececf1] bg-white p-4 shadow-[0_6px_18px_rgba(15,20,25,0.035)]">
            <h3 className="text-[15px] font-black text-[#171a21]">
              Account Details
            </h3>

            <div className="mt-3 divide-y divide-[#eef0f4]">
              {[
                ['Name', profile.fullName],
                ['Email Address', getDisplayValue(profile.email)],
                ['Phone Number', getDisplayValue(profile.phone)],
                ['Assigned Role', profile.role],
                ['Branch Scope', profile.branch],
                ['Account Status', profile.status],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[145px_1fr] sm:gap-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.04em] text-[#777a83]">
                    {label}
                  </p>

                  <p className="break-words text-[12px] font-bold text-[#1f232c]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[13px] border border-[#ececf1] bg-white p-4 shadow-[0_6px_18px_rgba(15,20,25,0.035)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-red-50 text-red-600">
              <IconLogout />
            </div>

            <h3 className="mt-4 text-[15px] font-black text-[#171a21]">
              Session Control
            </h3>

            <p className="mt-1.5 text-[12px] font-medium leading-5 text-[#686c76]">
              Logout will end the current Super Admin session on this browser.
            </p>

            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-red-600 px-4 text-[12px] font-black text-white shadow-[0_8px_18px_rgba(220,38,38,0.18)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconLogout className="h-4 w-4" />
              {logout.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfilePage;