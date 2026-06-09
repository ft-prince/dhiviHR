"use client";

import { useState } from "react";
import { AssessmentInstructionsPopup } from "./assessment-instructions-popup";

export function Instructions() {
    const [showInstructions, setShowInstructions] = useState(true);

    return (
        <>
         {showInstructions && (
            <AssessmentInstructionsPopup onClose={() => setShowInstructions(false)} />
         )}
        </>
    )
}