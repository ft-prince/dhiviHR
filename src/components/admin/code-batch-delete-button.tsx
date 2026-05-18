"use client";

import { deleteCodeBatchAction } from "@/lib/admin/actions";
import { DeleteButton } from "@/components/admin/delete-button";

export function CodeBatchDeleteButton({ batchId }: { batchId: string }) {
  return (
    <DeleteButton
      label="Delete"
      confirmText="Delete this batch? Only batches with no redeemed codes can be deleted."
      onDelete={() => deleteCodeBatchAction(batchId)}
    />
  );
}
