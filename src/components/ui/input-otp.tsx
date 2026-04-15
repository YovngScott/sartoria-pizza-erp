// ========================================== //
//           COMPONENTE: INPUT OTP              //
// ========================================== //

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: INPUT OTP (RAÍZ)               //
// ========================================== //
// Implementación de entrada para códigos de un solo uso (OTP).
// Utiliza la librería 'input-otp' para el manejo de la lógica de entrada.

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  ),
);
InputOTP.displayName = "InputOTP";

// ========================================== //
// COMPONENTE: INPUT OTP GROUP                //
// ========================================== //
// Agrupa varios slots de OTP para una mejor organización visual.

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />,
);
InputOTPGroup.displayName = "InputOTPGroup";

// ========================================== //
// COMPONENTE: INPUT OTP SLOT                 //
// ========================================== //
// Representa un carácter individual dentro del campo OTP.
// Maneja el estado activo, el cursor parpadeante y la visualización del carácter.

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

// ========================================== //
// COMPONENTE: INPUT OTP SEPARATOR            //
// ========================================== //
// Elemento visual para separar grupos de slots de OTP (ej. un guion o punto).

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

// ========================================== //
// EXPORTACIÓN DE COMPONENTES DEL OTP          //
// ========================================== //

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
