/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteUserAlertProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinished: () => Promise<void>;
}

export default function DeleteUserAlert({
  userId,
  open,
  onOpenChange,
  onFinished,
}: DeleteUserAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('Identity removed from registry');
      onOpenChange(false);
      await onFinished();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Integrity Error: User is still linked to active classes.');
      } else {
        toast.error('Failed to delete user. Active system link detected.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <Trash2 className="text-rose-600" size={24} />
          </div>
          <AlertDialogTitle className="text-xl font-black tracking-tight">
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 font-medium">
            This action will permanently remove this identity from the AMF registry.
            Historical records may be preserved in archive, but the account will no longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="rounded-xl border-slate-200 font-bold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-rose-100"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Deletion'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
