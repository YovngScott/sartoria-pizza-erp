// ========================================== //
//           COMPONENTE: FORM (FORMULARIO)      //
// ========================================== //

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// ========================================== //
// PROVEEDOR DE FORMULARIO                    //
// ========================================== //
// Utiliza FormProvider de react-hook-form para proporcionar el contexto
// a todos los componentes hijos del formulario.

const Form = FormProvider;

// ========================================== //
// CONTEXTO DE CAMPO DE FORMULARIO            //
// ========================================== //

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

// ========================================== //
// COMPONENTE: FORM FIELD                     //
// ========================================== //
// Envuelve el controlador de react-hook-form y proporciona el nombre del campo vía contexto.

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// ========================================== //
// HOOK PERSONALIZADO: USE FORM FIELD         //
// ========================================== //
// Permite acceder fácilmente al estado del campo (error, id, etc.)
// dentro de los componentes del formulario.

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// ========================================== //
// CONTEXTO DE ITEM DE FORMULARIO             //
// ========================================== //

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

// ========================================== //
// COMPONENTE: FORM ITEM                      //
// ========================================== //
// Contenedor para un grupo de componentes de formulario (Label, Control, Message).

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

// ========================================== //
// COMPONENTE: FORM LABEL                     //
// ========================================== //
// Etiqueta del campo, cambia a color destructivo si hay un error.

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

// ========================================== //
// COMPONENTE: FORM CONTROL                   //
// ========================================== //
// Envoltura para el input del formulario, maneja atributos de accesibilidad.

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        {...props}
      />
    );
  },
);
FormControl.displayName = "FormControl";

// ========================================== //
// COMPONENTE: FORM DESCRIPTION               //
// ========================================== //
// Texto de ayuda o descripción para el campo de formulario.

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
  },
);
FormDescription.displayName = "FormDescription";

// ========================================== //
// COMPONENTE: FORM MESSAGE                   //
// ========================================== //
// Muestra el mensaje de error de validación del campo.

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

// ========================================== //
// EXPORTACIÓN DE COMPONENTES DEL FORMULARIO   //
// ========================================== //

export { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField };
