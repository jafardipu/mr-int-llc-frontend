"use client";

import { useRouter } from "next/navigation";
import { Heart, LogIn } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  title?: string;
  subtitle?: string;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  callbackUrl = "/products",
  title = "Sign in to Save Favorites",
  subtitle = "Please log in to your account to add items to your wishlist and keep track of products you love.",
}: LoginPromptModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md text-center sm:text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-1">
          <Heart className="size-7 fill-rose-500 text-rose-500" />
        </div>

        <AlertDialogHeader className="text-center sm:text-center items-center">
          <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed text-center">
            {subtitle}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:justify-center sm:gap-3">
          <AlertDialogAction
            onClick={handleLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-secondary-color px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7d391b]"
          >
            <LogIn className="size-4" />
            Sign In
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onClose}
            className="w-full sm:w-auto rounded-full border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-2.5 text-sm"
          >
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
