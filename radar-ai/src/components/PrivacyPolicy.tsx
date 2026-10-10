import React from 'react';

export const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Privacy Policy</h2>
        <p className="text-zinc-500 text-sm mt-1">Last updated: October 2026</p>
      </div>
      <div className="bg-[#121212] border border-zinc-800 rounded-xl p-6 text-zinc-300 space-y-4">
        <h3 className="text-lg font-semibold text-zinc-200">1. Information We Collect</h3>
        <p className="text-sm leading-relaxed">
          We collect information you provide directly to us, such as when you create or modify your account, 
          request on-demand services, contact customer support, or otherwise communicate with us.
        </p>
        <h3 className="text-lg font-semibold text-zinc-200 mt-6">2. Use of Information</h3>
        <p className="text-sm leading-relaxed">
          We may use the information we collect about you to provide, maintain, and improve our services, 
          such as to facilitate payments, send receipts, provide products and services you request (and send related information), 
          develop new features, provide customer support, and authenticate users.
        </p>
      </div>
    </div>
  );
};
