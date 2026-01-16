'use client';

import { useState, useRef, useEffect } from 'react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (filters: { startYear: number; endYear: number; category: string }) => void;
}

const VIOLATION_CATEGORIES = [
  "Arbitrary Arrest and Detention",
  "Torture or Ill-Treatment",
  "Extrajudicial Killing",
  "Enforced Disappearance",
  "Excessive Use of Force",
  "Suppression of Freedom of Expression",
  "Restriction on Assembly and Association",
  "Denial of Fair Trial",
  "Discrimination",
  "Forced Eviction",
  "Denial of Education",
  "Denial of Health Services",
  "Labor Rights Violations",
  "Violation of Privacy",
  "Attacks on Human Rights Defenders / Journalists",
  "Failure to Investigate or Provide Remedy"
];

/* ===============================
   🔹 FETCH FROM API ROUTE
================================ */
async function fetchCasesFromAPI(
  startYear: number,
  endYear: number,
  categories: string[]
) {
  const params = new URLSearchParams({
    startYear: startYear.toString(),
    endYear: endYear.toString()
  });

  if (categories.length > 0) {
    params.append('categories', categories.join(','));
  }

  const res = await fetch(`/api/reports/cases?${params.toString()}`);

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch cases');
  }

  return await res.json();
}

/* ===============================
   📄 PDF GENERATION
================================ */
async function generatePDFReport(filters: {
  startYear: number;
  endYear: number;
  category: string;
}) {
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  
  if (!jsPDF) {
    throw new Error('PDF library not loaded. Please refresh the page.');
  }

  const selectedCategories =
    filters.category === 'All Categories'
      ? []
      : filters.category.split(', ');

  const cases = await fetchCasesFromAPI(
    filters.startYear,
    filters.endYear,
    selectedCategories
  );

  if (!cases || cases.length === 0) {
    throw new Error('No cases found for the selected criteria');
  }

  const analytics = analyzeData(cases);
  const doc = new jsPDF();

  let y = 20;
  const pageHeight = doc.internal.pageSize.height;

  const pageBreak = (space: number) => {
    if (y + space > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  /* ===== HEADER ===== */
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Human Rights Violations Report', 20, y);
  y += 14;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Report Period: ${filters.startYear}–${filters.endYear}`, 20, y);
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
  y += 6;
  doc.text(`Categories: ${filters.category}`, 20, y);
  y += 12;

  /* ===== EXEC SUMMARY ===== */
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.text('Executive Summary', 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  [
    `Total Cases: ${analytics.totalCases}`,
    `Most Common Violation: ${analytics.mostCommonCategory}`,
    `Pending Cases: ${analytics.pendingCases}`,
    `Resolution Rate: ${analytics.resolutionRate}%`
  ].forEach(line => {
    pageBreak(6);
    doc.text(`• ${line}`, 25, y);
    y += 6;
  });

  y += 10;

  /* ===== BY CATEGORY ===== */
  pageBreak(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Category', 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  Object.entries(analytics.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      pageBreak(6);
      const percentage = ((count / analytics.totalCases) * 100).toFixed(1);
      doc.text(`• ${cat}: ${count} (${percentage}%)`, 25, y);
      y += 6;
    });

  y += 10;

  /* ===== BY STATUS ===== */
  pageBreak(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Status', 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  Object.entries(analytics.byStatus).forEach(([status, count]) => {
    pageBreak(6);
    const percentage = ((count / analytics.totalCases) * 100).toFixed(1);
    doc.text(`• ${status}: ${count} (${percentage}%)`, 25, y);
    y += 6;
  });

  /* ===== BY YEAR ===== */
  y += 10;
  pageBreak(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Year', 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  Object.entries(analytics.byYear)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([year, count]) => {
      pageBreak(6);
      doc.text(`• ${year}: ${count} cases`, 25, y);
      y += 6;
    });

  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'This report is generated for documentation and advocacy purposes.',
    105,
    pageHeight - 10,
    { align: 'center' }
  );

  doc.save(`CHR_Report_${filters.startYear}-${filters.endYear}.pdf`);
}

/* ===============================
   📊 ANALYTICS
================================ */
function analyzeData(cases: any[]) {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  cases.forEach(c => {
    byCategory[c.violation_category] = (byCategory[c.violation_category] || 0) + 1;
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    const year = new Date(c.date_received).getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  });

  let mostCommonCategory = '';
  let mostCommonCount = 0;

  Object.entries(byCategory).forEach(([cat, count]) => {
    if (count > mostCommonCount) {
      mostCommonCategory = cat;
      mostCommonCount = count;
    }
  });

  const resolved =
    (byStatus['Resolved'] || 0) + (byStatus['Closed'] || 0);

  return {
    totalCases: cases.length,
    byCategory,
    byStatus,
    byYear,
    mostCommonCategory,
    mostCommonCount,
    pendingCases: byStatus['Pending'] || 0,
    resolutionRate:
      cases.length > 0 ? ((resolved / cases.length) * 100).toFixed(1) : '0'
  };
}

/* ===============================
   🧩 MODAL (UI UNCHANGED)
================================ */
export default function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate
}: GenerateReportModalProps) {
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === VIOLATION_CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...VIOLATION_CATEGORIES]);
    }
  };

  const handleGenerate = async () => {
    if (startYear > endYear) {
      setError('Start year must be before end year');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const filters = {
        startYear,
        endYear,
        category:
          selectedCategories.length > 0
            ? selectedCategories.join(', ')
            : 'All Categories'
      };

      await generatePDFReport(filters);
      onGenerate(filters);
      handleClose();
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setStartYear(currentYear);
    setEndYear(currentYear);
    setSelectedCategories([]);
    setSearchText('');
    setShowDropdown(false);
    setError('');
    setIsGenerating(false);
    onClose();
  };

  const filteredCategories = VIOLATION_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(searchText.toLowerCase())
  );

  const displayText = selectedCategories.length > 0 
    ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`
    : 'Select categories...';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="bg-sky rounded-t-3xl p-6 flex justify-between items-center sticky top-0">
          <h2 className="text-2xl font-bold text-midnightNavy">
            Generate Report
          </h2>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-royal hover:text-blue disabled:opacity-50"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-snowWhite">
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              Range of Year
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={startYear}
                  onChange={(e) => {
                    setStartYear(Number(e.target.value));
                    setError('');
                  }}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal appearance-none cursor-pointer disabled:opacity-50"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <span className="text-graphite font-medium">to</span>
              <div className="relative flex-1">
                <select
                  value={endYear}
                  onChange={(e) => {
                    setEndYear(Number(e.target.value));
                    setError('');
                  }}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal appearance-none cursor-pointer disabled:opacity-50"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-graphite font-semibold mb-2 text-lg">
              Category of Alleged Violation
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayText}
                onFocus={() => !isGenerating && setShowDropdown(true)}
                readOnly
                disabled={isGenerating}
                placeholder="Select categories..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal placeholder-ash cursor-pointer disabled:opacity-50"
              />
              <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            {showDropdown && !isGenerating && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div
                  onClick={handleSelectAll}
                  className="px-4 py-3 hover:bg-sky cursor-pointer border-b border-gray-200 flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === VIOLATION_CATEGORIES.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-coal font-semibold">Select All</span>
                </div>

                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className="px-4 py-3 hover:bg-sky cursor-pointer flex items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-coal">{cat}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-ash italic">
                    No matching categories
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="px-8 py-3 bg-gray-200 text-graphite rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-8 py-3 bg-royalAzure text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
