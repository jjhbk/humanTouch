import * as React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    const baseStyles = "block text-sm font-medium text-gray-700";
    return (
      <label
        ref={ref}
        className={`${baseStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";
