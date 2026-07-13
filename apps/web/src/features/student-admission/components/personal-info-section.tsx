"use client";

import { Controller } from "react-hook-form";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldWrapper } from "@/components/form/field-wrapper";
import { FormSection } from "./form-section";
import { PhotoUpload } from "./photo-upload";
import { GENDER_OPTIONS } from "../constants";
import type { AdmissionUseFormReturn } from "../client-schema";

export function PersonalInfoSection({ form }: { form: AdmissionUseFormReturn }) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const mobileNumber = watch("mobileNumber");
  const whatsappSameAsMobile = watch("whatsappNumber") === mobileNumber && mobileNumber !== "";

  return (
    <FormSection icon={User} title="Personal Information">
      <FieldWrapper label="Student photo" hint="Optional" error={errors.photo?.message}>
        <Controller
          name="photo"
          control={control}
          render={({ field }) => (
            <PhotoUpload
              value={field.value}
              onChange={field.onChange}
              error={errors.photo?.message}
            />
          )}
        />
      </FieldWrapper>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrapper htmlFor="firstName" label="First name" required error={errors.firstName?.message}>
          <Input id="firstName" placeholder="e.g. Anjali" autoComplete="given-name" {...register("firstName")} />
        </FieldWrapper>
        <FieldWrapper htmlFor="lastName" label="Last name" required error={errors.lastName?.message}>
          <Input id="lastName" placeholder="e.g. Deshmukh" autoComplete="family-name" {...register("lastName")} />
        </FieldWrapper>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrapper htmlFor="dob" label="Date of birth" hint="Optional" error={errors.dob?.message}>
          <Input id="dob" type="date" max={new Date().toISOString().split("T")[0]} {...register("dob")} />
        </FieldWrapper>

        <FieldWrapper label="Gender" hint="Optional" error={errors.gender?.message}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-3 gap-2"
              >
                {GENDER_OPTIONS.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`gender-${option.value}`}
                    className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-input text-sm font-normal has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:font-medium"
                  >
                    <RadioGroupItem id={`gender-${option.value}`} value={option.value} />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </FieldWrapper>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldWrapper htmlFor="mobileNumber" label="Mobile number" hint="Optional" error={errors.mobileNumber?.message}>
          <Input
            id="mobileNumber"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            autoComplete="tel"
            {...register("mobileNumber")}
          />
        </FieldWrapper>

        <FieldWrapper
          htmlFor="whatsappNumber"
          label="WhatsApp number"
          error={errors.whatsappNumber?.message}
          hint="Optional — leave blank if same as mobile"
        >
          <div className="flex flex-col gap-2">
            <Input
              id="whatsappNumber"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit WhatsApp number"
              disabled={whatsappSameAsMobile}
              {...register("whatsappNumber")}
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={whatsappSameAsMobile}
                onCheckedChange={(checked) => {
                  setValue("whatsappNumber", checked ? (mobileNumber as string) : "", { shouldValidate: true });
                }}
              />
              Same as mobile number
            </label>
          </div>
        </FieldWrapper>
      </div>
    </FormSection>
  );
}
