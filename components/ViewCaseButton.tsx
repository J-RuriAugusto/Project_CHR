"use client";

import { useState } from "react";
import DocketCaseModalCompleted from "@/components/DocketCaseModalCompleted";

interface ViewCaseButtonProps {
  caseId: string;
}

export default function ViewCaseButton({ caseId }: ViewCaseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-white text-xs font-semibold w-full h-full"
      >
        VIEW CASE
      </button>

      {isModalOpen && (
        <DocketCaseModalCompleted
          caseId={caseId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}