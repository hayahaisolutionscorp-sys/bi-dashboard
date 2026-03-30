"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface AreaGraphProps {
    title: string;
    trendLabel: string;
    description: string;
}

export function AreaGraph({ title, trendLabel, description }: AreaGraphProps) {
    return (
        <Card className="col-span-1 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{title}</h3>
                <div className="flex items-center gap-1 text-primary text-xs font-bold">
                    <span>{trendLabel}</span>
                    <TrendingUp className="size-4" />
                </div>
            </div>
            <p className="text-xs text-muted-foreground mb-6">{description}</p>
            <div className="relative h-48">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path 
                        d="M0 80 Q 10 70, 20 75 T 40 60 T 60 65 T 80 40 T 100 30 V 100 H 0 Z" 
                        fill="url(#area-gradient)" 
                        opacity="0.2"
                    ></path>
                    <path 
                        d="M0 80 Q 10 70, 20 75 T 40 60 T 60 65 T 80 40 T 100 30" 
                        fill="none" 
                        stroke="var(--primary)" 
                        strokeWidth="2"
                    ></path>
                </svg>
                <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
                    <span>May 01</span>
                    <span>May 08</span>
                    <span>May 15</span>
                    <span>May 22</span>
                    <span>May 29</span>
                </div>
            </div>
        </Card>
    );
}
