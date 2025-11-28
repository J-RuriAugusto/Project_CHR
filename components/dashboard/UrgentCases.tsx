import Link from 'next/link';

interface UrgentCasesProps {
    dueThisWeek: any[];
    dueLastWeek: any[];
    basePath: string; // e.g., '/dashboard/records_officer/docket'
}

export default function UrgentCases({ dueThisWeek, dueLastWeek, basePath }: UrgentCasesProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' })
        };
    };

    const getStatusBadge = (deadlineString: string, status: string) => {
        if (status === 'FOR REVIEW') {
            return (
                <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-transparent text-golden border border-golden font-semibold rounded-full">
                    FOR REVIEW
                </span>
            );
        }

        const deadline = new Date(deadlineString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadline.setHours(0, 0, 0, 0);

        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-babyPink text-crimsonRose font-semibold rounded-full">
                    OVERDUE
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-lightYellow text-olive font-semibold rounded-full">
                    DUE TODAY
                </span>
            );
        } else {
            return (
                <span className="text-xs px-3 py-1 w-[110px] flex justify-center items-center bg-lightYellow text-olive font-semibold rounded-full">
                    {diffDays + 1} Days Left
                </span>
            );
        }
    };

    const renderCard = (docket: any) => {
        const { day, month } = formatDate(docket.deadline);
        const requestType = docket.request_types?.name === 'Legal Assistance / OPS' ? 'LEGAL ASST.' : 'INVESTIGATION';
        const typeColorClass = requestType === 'INVESTIGATION'
            ? 'border border-royalAzure text-royalAzure'
            : 'border border-oceanBlue text-oceanBlue';

        return (
            <div key={docket.id} className="flex bg-snowWhite rounded-lg overflow-hidden shadow-sm mb-3">
                <div className="bg-midnightNavy w-20 flex flex-col items-center justify-center">
                    <p className="text-base font-semibold text-white">{day}</p>
                    <p className="text-sm font-semibold text-white">{month}</p>
                </div>

                <div className="flex-1 p-3 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-charcoalGray">
                            Case {docket.docket_number}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className={`text-xs px-3 py-1 w-[110px] flex justify-center items-center font-semibold rounded-full ${typeColorClass}`}>
                            {requestType}
                        </span>
                        {getStatusBadge(docket.deadline, docket.status)}
                    </div>
                </div>
                <div className="bg-royalBlue w-24 flex items-center justify-center hover:bg-highlight cursor-pointer">
                    <Link href={`${basePath}?id=${docket.id}`} className="text-white text-xs font-semibold w-full h-full flex items-center justify-center">
                        VIEW CASE
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 pr-0 lg:pr-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base text-midnightNavy font-semibold">
                    Urgent Cases
                </h2>
                <Link href={basePath} className="text-sm text-slateGray font-semibold">
                    View All
                </Link>
            </div>

            {/* This Week */}
            <h3 className="text-sm text-slateBlue font-semibold mb-2">Due This Week</h3>
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {dueThisWeek.length > 0 ? (
                    dueThisWeek.map(renderCard)
                ) : (
                    <p className="text-sm text-gray-500 italic">No cases due this week.</p>
                )}
            </div>

            {/* Last Week */}
            <h3 className="text-sm text-slateBlue font-semibold mb-2">Due Last Week</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {dueLastWeek.length > 0 ? (
                    dueLastWeek.map(renderCard)
                ) : (
                    <p className="text-sm text-gray-500 italic">No cases due last week.</p>
                )}
            </div>
        </div>
    );
}
