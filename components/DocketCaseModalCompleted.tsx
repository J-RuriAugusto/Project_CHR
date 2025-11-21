"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface DocketCaseModalCompletedProps {
  caseId?: string;
  onClose: () => void;
}

export default function DocketCaseModalCompleted({ caseId, onClose }: DocketCaseModalCompletedProps) {
  const [daysActive, setDaysActive] = useState(102);
  const [caseNumber, setCaseNumber] = useState('CHR-VII-2025-0050');
  const [status, setStatus] = useState('Active');
  const [dateReceived, setDateReceived] = useState('Oct 2, 2025');
  const [deadline, setDeadline] = useState('Feb 22, 2026');
  const [typeOfRequest, setTypeOfRequest] = useState('Legal Counseling');
  const [modeOfRequest, setModeOfRequest] = useState('With Complainant');
  const [categoryViolation, setCategoryViolation] = useState('Lorem Ipsum');
  const [complainantName, setComplainantName] = useState('Jane Doe');
  const [contactNumber, setContactNumber] = useState('+63 921 531 9987');
  const [rightsViolated, setRightsViolated] = useState(['Extrajudicial Killings']);
  const [victimName, setVictimName] = useState('');
  const [victimSector, setVictimSector] = useState('Child');
  const [respondentName, setRespondentName] = useState('');
  const [respondentSector, setRespondentSector] = useState('Worker');
  const [staffInCharge, setStaffInCharge] = useState('Atty. Reyes');
  const [emailAddress, setEmailAddress] = useState('reyes@chr.gov.ph');

  useEffect(() => {
    if (caseId) {
      setCaseNumber(caseId);
    }
  }, [caseId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCompleteCase = () => {
    console.log('Completing case...', { caseNumber, dateReceived });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-sky p-4 flex justify-between items-center border-b sticky top-0">
          <div className="flex items-center gap-6">
            <h1 id="modal-title" className="text-2xl font-bold text-midnightNavy">
              {caseNumber}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-base text-midnightNavy">
                🕐 {daysActive} days
              </span>
              <span className="bg-royalAzure text-white text-xs font-semibold px-3 py-1 rounded-full">
                {status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-royal hover:text-blue"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 bg-snow">
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <p className="text-graphite text-sm font-medium mb-1">Date Received</p>
                <p className="text-midnightNavy font-bold text-base">{dateReceived}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Deadline</p>
                <p className="text-midnightNavy font-bold text-base">{deadline}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Name of Complainant</p>
                <p className="text-midnightNavy font-bold text-base">{complainantName}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Staff-in-Charge</p>
                <p className="text-midnightNavy font-bold text-base">{staffInCharge}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Email Address</p>
                <p className="text-midnightNavy font-bold text-base underline">{emailAddress}</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <p className="text-graphite text-sm font-medium mb-1">Type of Request</p>
                <p className="text-midnightNavy font-bold text-base">{typeOfRequest}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Mode of Request</p>
                <p className="text-midnightNavy font-bold text-base">{modeOfRequest}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-1">Contact #</p>
                <p className="text-midnightNavy font-bold text-base">{contactNumber}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-2">Victims</p>
                <input
                  type="text"
                  placeholder="Name"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-ash text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2">
                  <p className="text-graphite text-sm font-medium">Sector</p>
                  <p className="text-midnightNavy font-bold text-base">{victimSector}</p>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div>
                <p className="text-graphite text-sm font-medium mb-1">Category of Alleged Violation</p>
                <p className="text-midnightNavy font-bold text-base">{categoryViolation}</p>
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-2">Right(s) Violated</p>
                <input
                  type="text"
                  placeholder="Extrajudicial Killings"
                  // value={rightsViolated}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-ash text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />

                  <input
                  type="text"
                  placeholder="Torture"
                  // value={rightsViolated}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-ash text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
                                <input
                  type="text"
                  placeholder="Suppression of Freedom of Speech"
                  // value={rightsViolated}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-ash text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              </div>

              <div>
                <p className="text-graphite text-sm font-medium mb-2">Respondents</p>
                <input
                  type="text"
                  placeholder="Name"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-ash text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2">
                  <p className="text-graphite text-sm font-medium">Sector</p>
                  <p className="text-midnightNavy font-bold text-base">{respondentSector}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCompleteCase}
              className="bg-royalAzure text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-base"
            >
              Complete Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}