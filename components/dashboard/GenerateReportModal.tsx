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

// Mock data generator - Replace this with your actual data fetching logic
function generateMockCases(startYear: number, endYear: number) {
  const cases = [];
  const statuses = ['Pending', 'Under Investigation', 'Resolved', 'Closed'];
  
  for (let year = startYear; year <= endYear; year++) {
    const casesPerYear = Math.floor(Math.random() * 50) + 20;
    
    for (let i = 0; i < casesPerYear; i++) {
      const month = Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      
      cases.push({
        id: `CASE-${year}-${String(i + 1).padStart(4, '0')}`,
        date: new Date(year, month, day).toISOString(),
        category: VIOLATION_CATEGORIES[Math.floor(Math.random() * VIOLATION_CATEGORIES.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        location: `Location ${Math.floor(Math.random() * 10) + 1}`,
        description: 'Case description here'
      });
    }
  }
  
  return cases;
}

// PDF Generation Function
async function generatePDFReport(filters: { startYear: number; endYear: number; category: string }) {
  // @ts-ignore
  const { jsPDF } = window.jspdf;
  
  if (!jsPDF) {
    alert('PDF library not loaded. Please refresh the page.');
    return;
  }

  const doc = new jsPDF();
  
  // TODO: Replace this with actual data from your storage/API
  let allCases = generateMockCases(filters.startYear, filters.endYear);
  
  // Filter cases based on selected categories
  const selectedCategories = filters.category === 'All Categories' 
    ? VIOLATION_CATEGORIES 
    : filters.category.split(', ');
    
  const filteredCases = allCases.filter(c => {
    const caseYear = new Date(c.date).getFullYear();
    return caseYear >= filters.startYear && 
      caseYear <= filters.endYear &&
      selectedCategories.includes(c.category);
  });
  
  // Analyze data
  const analytics = analyzeData(filteredCases);
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 20;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper function to draw pie chart
  const drawPieChart = (doc: any, data: [string, number][], legendX: number, legendY: number, radius: number) => {
    const total = data.reduce((sum, [_, value]) => sum + value, 0);
    const colors = [
      [66, 135, 245],   // Blue
      [245, 135, 66],   // Orange
      [66, 245, 135],   // Green
      [245, 66, 135],   // Pink
      [135, 66, 245],   // Purple
      [245, 245, 66],   // Yellow
      [66, 245, 245],   // Cyan
      [245, 66, 66],    // Red
    ];
    
    // Position pie chart to the right of legend
    const chartCenterX = legendX + 110;
    const chartCenterY = legendY + 30;
    
    let currentAngle = 0;
    
    // Draw each slice
    data.forEach(([label, value], index) => {
      const sliceAngle = (value / total) * 360;
      const color = colors[index % colors.length];
      
      // Set fill color for this slice
      doc.setFillColor(color[0], color[1], color[2]);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      
      // Draw the slice using a polygon approach
      const startAngleRad = (currentAngle * Math.PI) / 180;
      const endAngleRad = ((currentAngle + sliceAngle) * Math.PI) / 180;
      
      // Create points for the slice
      const slicePoints: [number, number][] = [];
      slicePoints.push([chartCenterX, chartCenterY]); // Center point
      
      // Add points along the arc
      const steps = Math.max(2, Math.ceil(sliceAngle / 5)); // More steps for smoother arcs
      for (let i = 0; i <= steps; i++) {
        const angle = startAngleRad + (endAngleRad - startAngleRad) * (i / steps);
        slicePoints.push([
          chartCenterX + radius * Math.cos(angle),
          chartCenterY + radius * Math.sin(angle)
        ]);
      }
      
      // Draw filled polygon for the slice
      doc.setFillColor(color[0], color[1], color[2]);
      // @ts-ignore
      const path = slicePoints.map((point, i) => {
        if (i === 0) return `M ${point[0]} ${point[1]}`;
        return `L ${point[0]} ${point[1]}`;
      }).join(' ') + ' Z';
      
      // Use lines to create the slice
      doc.lines(
        slicePoints.slice(1).map((point, i) => {
          if (i === 0) {
            return [point[0] - slicePoints[0][0], point[1] - slicePoints[0][1]];
          }
          return [
            point[0] - slicePoints[i][0],
            point[1] - slicePoints[i][1]
          ];
        }),
        slicePoints[0][0],
        slicePoints[0][1],
        [1, 1],
        'FD',
        true
      );
      
      currentAngle += sliceAngle;
    });
    
    // Draw legend on the left
    data.forEach(([label, value], index) => {
      const color = colors[index % colors.length];
      const percentage = ((value / total) * 100).toFixed(1);
      const y = legendY + (index * 8);
      
      // Color box
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(legendX, y - 2, 3, 3, 'F');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const truncatedLabel = label.length > 20 ? label.substring(0, 20) + '...' : label;
      doc.text(`${truncatedLabel} (${percentage}%)`, legendX + 5, y);
    });
  };

  // ===== TITLE PAGE =====
  // Add logo
  const logoImg = new Image();
  logoImg.src = '/cmms-logo.png';
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = resolve; // Continue even if logo fails to load
  });
  
  // Draw logo (left aligned, 30x30)
  try {
    doc.addImage(logoImg, 'PNG', 20, yPosition, 60, 30);
  } catch (e) {
    console.log('Logo could not be loaded');
  }
  
  // Title aligned with logo
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Analytics Report', 100, yPosition + 20);
  yPosition += 40;

  // Horizontal line
  const lineY = yPosition;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, lineY, 190, lineY);

  // Move cursor below header
  yPosition = lineY + 10;

  // Report details box
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Report Period: ${filters.startYear} - ${filters.endYear}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Categories: ${filters.category}`, 20, yPosition, { maxWidth: 170 });
  yPosition += 30;

  // ===== EXECUTIVE SUMMARY =====
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Executive Summary', 20, yPosition);
  yPosition += 12;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const summaryLines = [
    `Total Cases Documented: ${analytics.totalCases}`,
    `Date Range: ${filters.startYear} - ${filters.endYear}`,
    `Most Common Violation: ${analytics.mostCommonCategory} (${analytics.mostCommonCount} cases)`,
    `Cases Pending Resolution: ${analytics.pendingCases}`,
    `Resolution Rate: ${analytics.resolutionRate}%`
  ];

  summaryLines.forEach(line => {
    checkPageBreak(7);
    doc.text(line, 25, yPosition);
    yPosition += 7;
  });
  yPosition += 15;

  // ===== STATISTICAL BREAKDOWN =====
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Statistical Breakdown', 20, yPosition);
  yPosition += 12;

  // Cases by Category - Single Column Bulleted List
  doc.setFontSize(14);
  doc.text('Cases by Category:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  const categoryEntries = Object.entries(analytics.byCategory).sort((a, b) => b[1] - a[1]);
  
  categoryEntries.forEach(([category, count]) => {
    checkPageBreak(7);
    const percentage = ((count / analytics.totalCases) * 100).toFixed(1);
    doc.text(`• ${category}: ${count} (${percentage}%)`, 25, yPosition, { maxWidth: 160 });
    yPosition += 7;
  });
  
  yPosition += 15;

  // Pie Chart - Cases by Category
  checkPageBreak(90);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Category Distribution', 20, yPosition);
  yPosition += 8;
  
  drawPieChart(doc, categoryEntries.slice(0, 8), 20, yPosition, 35);
  yPosition += 75;

  // Cases by Status
  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Status:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const statusEntries = Object.entries(analytics.byStatus);
  statusEntries.forEach(([status, count]) => {
    checkPageBreak(7);
    const percentage = ((count / analytics.totalCases) * 100).toFixed(1);
    doc.text(`• ${status}: ${count} cases (${percentage}%)`, 25, yPosition);
    yPosition += 7;
  });
  yPosition += 15;

  // Pie Chart - Cases by Status
  checkPageBreak(90);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Status Distribution', 20, yPosition);
  yPosition += 8;
  
  drawPieChart(doc, statusEntries, 20, yPosition, 35);
  yPosition += 75;

  checkPageBreak(40);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Cases by Year:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  Object.entries(analytics.byYear)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([year, count]) => {
      checkPageBreak(7);
      doc.text(`• ${year}: ${count} cases`, 25, yPosition);
      yPosition += 7;
    });
  yPosition += 20;

  // ===== KEY FINDINGS =====
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Key Findings', 20, yPosition);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const findings = generateFindings(analytics, filters);
  findings.forEach((finding, index) => {
    checkPageBreak(20);
    const lines = doc.splitTextToSize(`${index + 1}. ${finding}`, 160);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  });
  yPosition += 15;

  // ===== RECOMMENDATIONS =====
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Recommendations', 20, yPosition);
  yPosition += 12;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const recommendations = [
    'Increase monitoring and documentation efforts in high-incident categories',
    'Establish dedicated investigation units for pending cases',
    'Implement systematic follow-up procedures for unresolved violations',
    'Strengthen collaboration with international human rights organizations',
    'Develop victim support and witness protection programs'
  ];

  recommendations.forEach((rec, index) => {
    checkPageBreak(20);
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 160);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  });

  const finalPage = doc.internal.getNumberOfPages();
  doc.setPage(finalPage);
  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.text('This report is generated for documentation and advocacy purposes.', 105, pageHeight - 10, { align: 'center' });

  const fileName = `HR_Violations_Report_${filters.startYear}-${filters.endYear}_${Date.now()}.pdf`;
  doc.save(fileName);
}

function analyzeData(cases: any[]) {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  cases.forEach(caseItem => {
    byCategory[caseItem.category] = (byCategory[caseItem.category] || 0) + 1;
    byStatus[caseItem.status] = (byStatus[caseItem.status] || 0) + 1;
    const year = new Date(caseItem.date).getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  });

  let mostCommonCategory = '';
  let mostCommonCount = 0;
  Object.entries(byCategory).forEach(([category, count]) => {
    if (count > mostCommonCount) {
      mostCommonCategory = category;
      mostCommonCount = count;
    }
  });

  const resolvedCases = (byStatus['Resolved'] || 0) + (byStatus['Closed'] || 0);
  const resolutionRate = cases.length > 0 
    ? ((resolvedCases / cases.length) * 100).toFixed(1)
    : '0';

  return {
    totalCases: cases.length,
    byCategory,
    byStatus,
    byYear,
    mostCommonCategory,
    mostCommonCount,
    pendingCases: byStatus['Pending'] || 0,
    resolutionRate,
  };
}

function generateFindings(analytics: any, filters: any): string[] {
  const findings = [];

  if (analytics.totalCases === 0) {
    findings.push('No cases found matching the selected criteria.');
    return findings;
  }

  findings.push(
    `A total of ${analytics.totalCases} human rights violation cases were documented during ${filters.startYear}-${filters.endYear}.`
  );

  findings.push(
    `${analytics.mostCommonCategory} represents the highest category of violations with ${analytics.mostCommonCount} cases, accounting for ${((analytics.mostCommonCount / analytics.totalCases) * 100).toFixed(1)}% of all documented cases.`
  );

  if (analytics.pendingCases > 0) {
    findings.push(
      `${analytics.pendingCases} cases remain pending, representing ${((analytics.pendingCases / analytics.totalCases) * 100).toFixed(1)}% of total cases and requiring immediate attention.`
    );
  }

  findings.push(
    `The current resolution rate stands at ${analytics.resolutionRate}%, indicating ${Number(analytics.resolutionRate) > 50 ? 'moderate progress' : 'significant challenges'} in addressing documented violations.`
  );

  const years = Object.keys(analytics.byYear).map(Number).sort();
  if (years.length > 1) {
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const firstYearCount = analytics.byYear[firstYear];
    const lastYearCount = analytics.byYear[lastYear];
    const change = lastYearCount - firstYearCount;
    const changePercent = ((change / firstYearCount) * 100).toFixed(1);
    
    findings.push(
      `Cases ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)} (${Math.abs(Number(changePercent))}%) from ${firstYear} to ${lastYear}.`
    );
  }

  return findings;
}

export default function GenerateReportModal({ isOpen, onClose, onGenerate }: GenerateReportModalProps) {
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
      setError('Start year must be before or equal to end year');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const filters = {
        startYear,
        endYear,
        category: selectedCategories.length > 0 ? selectedCategories.join(', ') : 'All Categories'
      };
      
      // Generate and download PDF
      await generatePDFReport(filters);
      
      // Call parent onGenerate callback
      onGenerate(filters);
      
      // Close modal after successful generation
      handleClose();
    } catch (err) {
      setError('Failed to generate report. Please try again.');
      console.error('Report generation error:', err);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-md relative">
        <div className="bg-sky rounded-t-3xl p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-midnightNavy">
            Generate Report
          </h2>
          <button
            onClick={handleClose}
            className="text-royal hover:text-blue"
            disabled={isGenerating}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-snowWhite rounded-b-3xl">
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
                <img
                  src="/icon18.png"
                  alt="dropdown"
                  className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                />
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
                <img
                  src="/icon18.png"
                  alt="dropdown"
                  className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                />
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
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-coal placeholder-ash cursor-pointer disabled:opacity-50"
              />
              <img
                src="/icon16.png"
                alt="dropdown"
                className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
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

          <div className="flex justify-end gap-4 pt-4">
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