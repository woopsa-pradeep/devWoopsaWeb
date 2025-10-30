import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SwitchInput from "../../atoms/SwitchInput";
import TextInput from "../../atoms/TextInput";
import PromotedItemsSelector from "./PromotedItemsSelector";
import * as z from "zod";
import { Typography, Box, Divider } from "@mui/material";

export function SettingsForm<T extends Record<string, any>>({
  schema,
  defaultValues,
  fields,
  onFieldChange,
  headerTitle,
  headerRight,
  // radioSwitchGroup = false,
}: {
  schema: z.ZodType<T>;
  defaultValues: T;
  fields: Array<{ name: keyof T; label: string; type: "switch" | "text" | "promotedItems"; controlledBy?: keyof T }>;
  onFieldChange: (data: Partial<T>) => void;
  headerTitle?: string;
  headerRight?: React.ReactNode;
  radioSwitchGroup?: boolean;
}) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as import("react-hook-form").DefaultValues<T>,
  });

  // Reset form when defaultValues change (crucial for API-driven forms)
  useEffect(() => {
    form.reset(defaultValues as any);
  }, [defaultValues]);

  // Helper to get the value of a field
  const getValue = (name: keyof T) => form.watch(name as any);

  // Helper to build the payload for onFieldChange
  const buildPayload = (changed: Partial<T>) => {
    const payload: Partial<T> = { ...changed };
    fields.forEach(field => {
      if (field.type === 'text' && field.controlledBy) {
        const controlling = getValue(field.controlledBy);
        if (!controlling) {
          payload[field.name] = undefined;
        } else {
          payload[field.name] = getValue(field.name);
        }
      }
    });
    return payload;
  };

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      {/* Header */}
      {(headerTitle || headerRight) && (
        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          borderRadius: "8px 8px 0 0",
          padding: "12px 20px",
          marginBottom: 2
        }}>
          <Typography sx={{ fontWeight: 500, fontSize: 16, color: "white" }}>{headerTitle}</Typography>
          {headerRight}
        </Box>
      )}
      {fields.map((field) => {
        // Only render text fields with controlledBy if their controlling switch is ON
        if (field.type === 'text' && field.controlledBy) {
          const controlling = getValue(field.controlledBy);
          if (!controlling) return null;
        }
        
        // Only render promotedItems field if showPromotedItems is true and maxPromotedItems > 0
        if (field.type === 'promotedItems') {
          const showPromotedItems = getValue('showPromotedItems' as keyof T);
          const maxPromotedItems = getValue('maxPromotedItems' as keyof T);
          if (!showPromotedItems || !maxPromotedItems || maxPromotedItems <= 0) return null;
        }

        return (
          <React.Fragment key={String(field.name)}>
            {field.type === 'switch' ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginY: 2, paddingX: 2 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, opacity: "70%" }}>{field.label}</Typography>
                  <Controller
                    name={field.name as any}
                    control={form.control}
                    render={({ field: { onChange, value } }) => (
                      <SwitchInput
                        checked={!!value}
                        onChange={(checked: boolean) => {
                          onChange(checked);
                          onFieldChange(buildPayload({ [field.name]: checked } as Partial<T>));
                        }}
                        sx={{ mb: 0 }}
                      />
                    )}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
              </>
            ) : field.type === 'text' ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1, paddingX: 2 }}>
                  <Controller
                    name={field.name as any}
                    control={form.control}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={field.label}
                        value={value ?? ""}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          onChange(val);
                          onFieldChange(buildPayload({ [field.name]: val } as Partial<T>));
                        }}
                        fullWidth={false}
                      />
                    )}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
              </>
            ) : field.type === 'promotedItems' ? (
              <>
                <Box sx={{ paddingX: 2, marginBottom: 1 }}>
                  <Controller
                    name={field.name as any}
                    control={form.control}
                    render={({ field: { onChange, value } }) => {
                      const maxPromotedItems = getValue('maxPromotedItems' as keyof T) as number;
                      return (
                        <PromotedItemsSelector
                          value={value || []}
                          onChange={(items) => {
                            onChange(items);
                            onFieldChange(buildPayload({ [field.name]: items } as Partial<T>));
                          }}
                          maxItems={maxPromotedItems || 0}
                          disabled={false}
                        />
                      );
                    }}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </Box>
  );
}
