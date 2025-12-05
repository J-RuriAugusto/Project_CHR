'use server';

export interface CaseTypeBreakdown {
    type: string;
    count: number;
    //   percentage: number;
    color: string;
}



export async function getCaseTypeBreakdown(): Promise<CaseTypeBreakdown[]> {
    // Static data - replace these numbers with your actual counts
    const caseTypeCounts = {
        'Legal Assistance / OPS': 14,
        'Investigation': 16,
    };

    const total = Object.values(caseTypeCounts).reduce((sum, count) => sum + count, 0);

    // Color mapping for the two case types
    const colorMap: Record<string, string> = {
        'Legal Assistance / OPS': '#3B82F6', // Mid Blue
        'Investigation': '#172554',          // Darkest Blue
    };

    const breakdown: CaseTypeBreakdown[] = Object.entries(caseTypeCounts).map(([type, count]) => ({
        type,
        count,
        // percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colorMap[type] || '#012453'
    }));

    return breakdown;
}

export interface CaseAgeingOverview {
    range: string;
    count: number;
    color: string;
}

export async function getCaseAgeingOverview(): Promise<CaseAgeingOverview[]> {
    // Static data - replace these numbers with your actual counts
    const ageingCounts = {
        '0 - 30 days': 12,
        '31 - 60 days': 8,
        '61 - 90 days': 5,
        '91 - 120 days': 4,
        '121 days and above': 6,
    };

    // Color mapping for different age ranges (Blue-Green Gradient)
    const colorMap: Record<string, string> = {
        '0 - 30 days': '#86EFAC',        // Light Green
        '31 - 60 days': '#34D399',       // Medium Green
        '61 - 90 days': '#2DD4BF',       // Teal
        '91 - 120 days': '#3B82F6',      // Blue
        '121 days and above': '#1E3A8A', // Dark Blue
    };

    const breakdown: CaseAgeingOverview[] = Object.entries(ageingCounts).map(([range, count]) => ({
        range,
        count,
        color: colorMap[range]
    }));

    return breakdown;
}
