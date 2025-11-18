"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="
          bg-white rounded-xl shadow-lg 
          w-full max-w-3xl relative 
          max-h-[90vh] overflow-y-auto 
          p-6
        "
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}
