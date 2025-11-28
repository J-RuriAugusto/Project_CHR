import { redirect } from 'next/navigation';
import Image from 'next/image';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { signOut } from '../../../components/actions';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default async function RecordsOfficerDashboard() {
  const supabase = await createClient();
  const currentPath = (await headers()).get("next-url") || "/";

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/');
  }

  // Fetch user data
  const { data: userData, error } = await supabase
    .from('users')
    .select('first_name, last_name, role')
    .eq('email', session.user.email)
    .single();

  if (error || !userData || userData.role !== 'records_officer') {
    await supabase.auth.signOut();
    return redirect('/login?message=You do not have the required permissions');
  }

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
        <Sidebar currentPath={currentPath} role="records_officer" />

        {/* Logout button at bottom */}
        <form action={signOut} className="pt-4 border-t">
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 w-full text-white hover:text-paleSky py-2 px-4 rounded-md text-lg font-semibold transition"
          >
            <img src="/icon8.png" alt="Logout" className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </form>
      </aside>

      {/* MIDDLE COLUMN */}
      <main className="bg-snowWhite flex-1 overflow-y-auto pb-6 relative custom-scrollbar">
        <DashboardHeader userData={userData} />

        <div className="px-6 mt-6 space-y-6">
          {/* Dashboard main content */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-base text-midnightNavy font-semibold">My Progress</h2>

            {/* Dashboard Cards */}
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-softBlue p-4 rounded-lg shadow relative overflow-hidden">
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
                  <h6 className="text-6xl text-steelBlue font-semibold">30</h6>
                  <h3 className="text-base text-steelBlue font-semibold">Total Active Cases</h3>
                  <p className="text-sm text-skyRoyal font-semibold">+5 this month</p>
                </div>
              </div>

              <div className="bg-babyPink p-4 rounded-lg shadow relative overflow-hidden">
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
                  <h6 className="text-6xl text-crimsonRose font-semibold">10</h6>
                  <h3 className="text-base text-crimsonRose font-semibold">Overdue Cases</h3>
                  <p className="text-sm text-dustyCoral font-semibold">+2 this month</p>
                </div>
              </div>

              <div className="bg-paleCream p-4 rounded-lg shadow relative overflow-hidden">
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
                  <h6 className="text-6xl text-antiqueGold font-semibold">10</h6>
                  <h3 className="text-base text-antiqueGold font-semibold">Pending for Review/Approval</h3>
                  <p className="text-sm text-mutedMustard font-semibold">+2 this month</p>
                </div>
              </div>

              <div className="bg-mintGreen p-4 rounded-lg shadow relative overflow-hidden">
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
                  <h6 className="text-6xl text-emeraldGreen font-semibold">10</h6>
                  <h3 className="text-base text-emeraldGreen font-semibold">Completed Cases</h3>
                  <p className="text-sm text-mintyGreen font-semibold">+3 this month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals / Review + Case Analytics Section */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <div className="flex flex-col lg:flex-row justify-between">
              {/* LEFT SIDE - Pending Approvals / Review */}
              <div className="flex-1 pr-0 lg:pr-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base text-midnightNavy font-semibold">
                    Urgent Cases
                  </h2>
                  <a href="/dashboard/records_officer/docket" className="text-sm text-slateGray font-semibold">
                    View All
                  </a>
                </div>

                {/* This Week */}
                <h3 className="text-sm text-slateBlue font-semibold mb-2">This Week</h3>
                <div className="space-y-3 mb-6">

                  {/* CARD 1 */}
                  <div className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                      <p className="text-base font-semibold text-white">25</p>
                      <p className="text-sm font-semibold text-white">Oct</p>
                    </div>

                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoalGray">
                          Case CHR-VII-2025-0042
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center border border-royalAzure text-royalAzure font-semibold rounded-full">
                          INVESTIGATION
                        </span>
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-lightYellow text-olive font-semibold rounded-full">
                          DUE IN 3 DAYS
                        </span>
                      </div>
                    </div>
                    <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                      <button className="text-white text-xs font-semibold">
                        VIEW CASE
                      </button>
                    </div>
                  </div>

                  {/* CARD 2 */}
                  <div className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                      <p className="text-base font-semibold text-white">25</p>
                      <p className="text-sm font-semibold text-white">Oct</p>
                    </div>

                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoalGray">
                          Case CHR-VII-2025-0042
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center border border-oceanBlue text-oceanBlue font-semibold rounded-full">
                          LEGAL ASST.
                        </span>
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-lightYellow text-olive font-semibold rounded-full">
                          DUE IN 10 DAYS
                        </span>
                      </div>
                    </div>
                    <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                      <button className="text-white text-xs font-semibold">
                        VIEW CASE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Last Week */}
                <h3 className="text-sm text-slateBlue font-semibold mb-2">Last Week</h3>
                <div className="space-y-3">

                  {/* CARD 3 */}
                  <div className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                      <p className="text-base font-semibold text-white">25</p>
                      <p className="text-sm font-semibold text-white">Oct</p>
                    </div>

                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-charcoalGray">
                          Case CHR-VII-2025-0042
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center border border-royalAzure text-royalAzure font-semibold rounded-full">
                          INVESTIGATION
                        </span>
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-babyPink text-crimsonRose font-semibold rounded-full">
                          OVERDUE
                        </span>
                      </div>
                    </div>
                    <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                      <button className="text-white text-xs font-semibold">
                        VIEW CASE
                      </button>
                    </div>
                  </div>

                  {/* CARD 4 */}
                  <div className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                      <p className="text-base font-semibold text-white">25</p>
                      <p className="text-sm font-semibold text-white">Oct</p>
                    </div>

                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoalGray">
                          Case CHR-VII-2025-0042
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center border border-oceanBlue text-oceanBlue font-semibold rounded-full">
                          LEGAL ASST.
                        </span>
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-softBlue text-steelBlue font-semibold rounded-full">
                          DUE IN 14 DAYS
                        </span>
                      </div>
                    </div>
                    <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                      <button className="text-white text-xs font-semibold">
                        VIEW CASE
                      </button>
                    </div>
                  </div>

                  {/* CARD 5 */}
                  <div className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                      <p className="text-base font-semibold text-white">25</p>
                      <p className="text-sm font-semibold text-white">Oct</p>
                    </div>

                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoalGray">
                          Case CHR-VII-2025-0042
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center border border-royalAzure text-royalAzure font-semibold rounded-full">
                          INVESTIGATION
                        </span>
                        <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-softBlue text-steelBlue font-semibold rounded-full">
                          DUE IN 24 DAYS
                        </span>
                      </div>
                    </div>
                    <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                      <button className="text-white text-xs font-semibold">
                        VIEW CASE
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Case Analytics */}
              <div className="w-full lg:w-1/3 mt-8 lg:mt-0 border-t lg:border-t-0 lg:border-l border-gray-200 pl-0 lg:pl-6 flex flex-col">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base text-midnightNavy font-semibold">
                    Case Analytics
                  </h2>
                  <a
                    href="#"
                    className="text-sm text-slateGray font-semibold hover:underline-slateGray"
                  >
                    Generate Report
                  </a>
                </div>

                {/* Charts container */}
                <div className="flex-1 flex flex-col justify-center items-center space-y-10 py-6">
                  {/* Chart 1 */}
                  <div className="w-full max-w-xs">
                    <h3 className="text-sm font-regular text-mutedSteelBlue mb-2 text-center">
                      Case Breakdown by Type
                    </h3>
                    <div className="flex items-center justify-center space-x-6 pt-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-full"></div>

                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-oceanBlue"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            Legal Counseling
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-royalAzure"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            Investigation
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-deepCobalt"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            Torture
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart 2 */}
                  <div className="w-full max-w-xs">
                    <h3 className="text-sm font-regular text-mutedSteelBlue mb-2 text-center">
                      Case Ageing Overview
                    </h3>
                    <div className="flex items-center justify-center space-x-6 pt-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-full"></div>

                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-paleGreen"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            0 - 30 days
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-tealBlue"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            31 - 60 days
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full bg-cobaltBlue"></span>
                          <span className="text-xs text-deepNavy font-regular">
                            61 - 120 days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}