"use client";

import * as React from "react";
import {cn} from "@/components/ui/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    onClick?: () => void;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
    ({size = "md", className, onClick, ...props}, ref) => {
        const sizeClasses = {
            sm: "text-2xl",
            md: "text-3xl",
            lg: "text-4xl",
            xl: "text-5xl"
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "font-romantica text-foreground select-none",
                    sizeClasses[size],
                    onClick && "cursor-pointer hover:opacity-80 transition-opacity",
                    className
                )}
                onClick={onClick}
                style={{
                    fontFamily: 'Romantica, serif',
                    fontWeight: 'normal',
                    letterSpacing: '0.05em'
                }}
                {...props}
            >
                TxRay
            </div>
        );
    }
);

Logo.displayName = "Logo";

export {Logo};
