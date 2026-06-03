"use client";

import { downloadAssessmentReport } from "@/lib/report";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  assessmentId: string;
}

export default function DownloadButton({ assessmentId }: DownloadButtonProps) {
  return (
    <Button 
      onClick={() => downloadAssessmentReport(assessmentId)}
    >
      Download PDF Report
    </Button>
  );
}