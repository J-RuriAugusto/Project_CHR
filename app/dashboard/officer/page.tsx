import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import DashboardHeaderWrapper from '@/components/dashboard/DashboardHeaderWrapper';
import { headers } from "next/headers";
import Sidebar from '@/components/Sidebar';
import { signOut } from '../../../components/actions';
import LogoutButton from '@/components/LogoutButton';
import { getDashboardStats, getUrgentCases } from '@/lib/actions/dashboard-stats';
import UrgentCases from '@/components/dashboard/UrgentCases';
import { getAllDocketLookups } from '@/lib/actions/docket-lookups';
import { getCaseTypeBreakdown, getCaseAgeingOverview } from '@/lib/actions/analytics';
import { CaseTypeChart, CaseAgeingChart } from '@/components/dashboard/Analytics';
import GenerateReportButton from '@/components/dashboard/GenerateReportButton';

export default async function OfficerDashboard() {
    const supabase = await createClient();
    const currentPath = (await headers()).get("next-url") || "/";
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return redirect('/');
    }

    // Fetch user data from the users table
    const { data: userData, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, profile_picture_url')
        .eq('email', session.user.email)
        .single();

    if (error || !userData || userData.role !== 'officer') {
        // Middleware handles redirection
        return null;
    }

    const stats = await getDashboardStats(userData.id);
    const lookups = await getAllDocketLookups();

    // Fetch all users for the staff dropdown
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'officer');
    const urgentCases = await getUrgentCases(userData.id);
    const caseTypeData = await getCaseTypeBreakdown(userData.id);
    const ageingData = await getCaseAgeingOverview(userData.id);

    return (
        <div className="h-screen flex bg-gray-50">
            {/* LEFT COLUMN */}
            <aside className="w-60 bg-midnightNavy border-r shadow-sm flex flex-col justify-between p-4">
                <div className="flex justify-center mb-4">
                    <img
                        src="/cmms-logo2.png"
                        alt="Logo"
                        className="w-auto h-auto"
                    />
                </div>

                {/* Navigation Links */}
                <Sidebar currentPath={currentPath} role="officer" />

                {/* Logout button at bottom */}
                {/* Logout button at bottom */}
                <div className="pt-4 border-t">
                    <LogoutButton signOut={signOut} />
                </div>
            </aside>

            {/* MIDDLE COLUMN */}
            <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
                <DashboardHeaderWrapper userData={userData} users={allUsers || []} lookups={lookups} />

                <div className="px-6 mt-6 space-y-6">
                    {/* Dashboard main content */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-base text-midnightNavy font-semibold">My Progress</h2>

                        {/* Dashboard Cards */}
                        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <Link href="/dashboard/officer/docket?status=Active&status=Urgent&status=Due" className="block">
                                <div className="bg-softBlue p-4 rounded-lg shadow relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="absolute top-4 right-4 shadow-sm">
                                        <Image
                                            src="/icon1.png"
                                            alt="Active Cases Icon"
                                            width={45}
                                            height={45}
                                            className="object-contain"
                                        />
                                    </div>

                                    <div className="pt-10">
                                        <h6 className="text-6xl text-steelBlue font-semibold">{stats.activeCases.count}</h6>
                                        <h3 className="text-base text-steelBlue font-semibold">Total Active Cases</h3>
                                        <p className="text-xs text-steelBlue font-normal">(incl. Urgent and Due)</p>
                                        <p className="text-sm text-skyRoyal font-semibold">+{stats.activeCases.thisMonth} this month</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/officer/docket?status=Overdue" className="block">
                                <div className="bg-babyPink p-4 rounded-lg shadow relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="absolute top-4 right-4 shadow-sm">
                                        <Image
                                            src="/icon2.png"
                                            alt="Overdue Cases Icon"
                                            width={45}
                                            height={45}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="pt-10">
                                        <h6 className="text-6xl text-crimsonRose font-semibold">{stats.overdueCases.count}</h6>
                                        <h3 className="text-base text-crimsonRose font-semibold">Overdue Cases</h3>
                                        <p className="text-sm text-dustyCoral font-semibold">+{stats.overdueCases.thisMonth} this month</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/officer/docket?status=For%20Review" className="block">
                                <div className="bg-paleCream p-4 rounded-lg shadow relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="absolute top-4 right-4 shadow-sm">
                                        <Image
                                            src="/icon3.png"
                                            alt="Pending Review Icon"
                                            width={45}
                                            height={45}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="pt-10">
                                        <h6 className="text-6xl text-antiqueGold font-semibold">{stats.pendingReview.count}</h6>
                                        <h3 className="text-base text-antiqueGold font-semibold">Pending for Review/Approval</h3>
                                        <p className="text-sm text-mutedMustard font-semibold">+{stats.pendingReview.thisMonth} this month</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/officer/docket?status=Completed" className="block">
                                <div className="bg-mintGreen p-4 rounded-lg shadow relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <div className="absolute top-4 right-4 shadow-sm">
                                        <Image
                                            src="/icon4.png"
                                            alt="Completed Cases Icon"
                                            width={45}
                                            height={45}
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="pt-10">
                                        <h6 className="text-6xl text-emeraldGreen font-semibold">{stats.completedCases.count}</h6>
                                        <h3 className="text-base text-emeraldGreen font-semibold">Completed Cases</h3>
                                        {stats.completedCases.thisMonth > 0 && (
                                            <p className="text-sm text-mintyGreen font-semibold">+{stats.completedCases.thisMonth} this month</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Pending Approvals / Review + Case Analytics Section */}
                    <div className="bg-white shadow rounded-lg p-6 mt-6">
                        <div className="flex flex-col lg:flex-row justify-between">
                            {/* LEFT SIDE - Pending Approvals / Review */}
                            <UrgentCases
                                users={allUsers || []}
                                lookups={lookups}
                                currentUserRole={userData.role}
                                dueThisWeek={urgentCases.dueThisWeek}
                                dueLastWeek={urgentCases.dueLastWeek}
                                basePath="/dashboard/officer/docket"
                            />

                            {/* RIGHT SIDE - Case Analytics */}
                            <div className="w-full lg:w-1/3 mt-8 lg:mt-0 border-t lg:border-t-0 lg:border-l border-gray-200 pl-0 lg:pl-6 flex flex-col">
                                {/* Header row */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base text-midnightNavy font-semibold">
                                        Case Analytics
                                    </h2>
                                    <GenerateReportButton />
                                </div>

                                {/* Charts container */}
                                <div className="flex-1 flex flex-col justify-start items-center space-y-10 py-6">
                                    <CaseTypeChart data={caseTypeData} />
                                    <CaseAgeingChart data={ageingData} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
