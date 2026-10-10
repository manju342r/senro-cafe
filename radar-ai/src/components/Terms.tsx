import React from 'react';

export const Terms = () => {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Terms and Conditions</h2>
        <p className="text-zinc-500 text-sm mt-1">Last updated: October 2026</p>
      </div>
      <div className="bg-[#121212] border border-zinc-800 rounded-xl p-6 text-zinc-300 space-y-4">
        <h3 className="text-lg font-semibold text-zinc-200">1. Acceptance of Terms</h3>
        <p className="text-sm leading-relaxed">
          By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. 
          In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
        </p>
        <h3 className="text-lg font-semibold text-zinc-200 mt-6">2. Provision of Services</h3>
        <p className="text-sm leading-relaxed">
          You agree and acknowledge that we are entitled to modify, improve or discontinue any of our services at its sole discretion and without notice to you even if it may result in you being prevented from accessing any information contained in it.
        </p>
      </div>
    </div>
  );
};
