
import React from 'react';

export const Logo = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-xl shadow-sm flex-shrink-0">
        <rect width="100" height="100" rx="24" fill="#2563EB" />
        <path d="M36 28H52C66 28 74 36 74 48C74 58 66 62 56 62H36V28Z" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M36 62H56C70 62 78 70 78 82C78 94 70 98 56 98H36V62Z" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="36" y1="28" x2="36" y2="98" stroke="white" strokeWidth="10" strokeLinecap="round"/>
    </svg>
);
