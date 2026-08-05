import React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}
export declare function Button({ variant, className, ...props }: ButtonProps): any;
//# sourceMappingURL=button.d.ts.map