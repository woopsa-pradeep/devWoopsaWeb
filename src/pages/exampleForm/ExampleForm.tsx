import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Grid, Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { submitForm } from "../../redux/thunks/formThunks";
import { selectForm } from "../../redux/slices/formSlice";
import { formSchema, FormData } from "./formSchema";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";

import TextInput from "../../component/atoms/TextInput";
import SelectInput from "../../component/atoms/SelectInput";
import CheckboxInput from "../../component/atoms/CheckboxInput";
import RadioGroupInput from "../../component/atoms/RadioGroupInput";
import FileUploadInput from "../../component/atoms/FileUploadInput";
import CustomButton from "../../component/atoms/CustomButton";
import { ArrowForward, Check, Delete } from "@mui/icons-material";

const ExampleForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { submitting, message, error } = useAppSelector(selectForm);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (message) showSuccessToast(message);
    if (error) showErrorToast(error);
  }, [message, error]);

  const onSubmit = (data: FormData) => {
    dispatch(submitForm(data)).then(() => reset());
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ p: { xs: 2, sm: 3 }, maxWidth: "800px", mx: "auto" }}
    >
      <Grid container spacing={1}>
        <Grid size={{ md: 12, lg: 6 }}>
          <TextInput
            label="Name"
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name")}
            fullWidth
          />
        </Grid>

        {/* Email */}
        <Grid size={{ md: 12, lg: 6 }}>
          <TextInput
            label="Email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
            fullWidth
          />
        </Grid>

        {/* Role */}
        <Grid size={{ md: 12, lg: 6 }}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <SelectInput
                label="Role"
                options={[
                  { label: "Customer", value: "customer" },
                  { label: "Driver", value: "driver" },
                  { label: "Sales", value: "sales" },
                  { label: "Epick", value: "epick" },
                ]}
                error={!!errors.role}
                helperText={errors.role?.message}
                {...field}
                fullWidth
              />
            )}
          />
        </Grid>
        {/* Resume */}
        <Grid size={{ md: 12, lg: 6 }}>
          <Controller
            name="resume"
            control={control}
            render={({ field }) => (
              <FileUploadInput
                label="Upload Resume"
                onChange={field.onChange}
                error={!!errors.resume}
                helperText={errors.resume?.message}
              />
            )}
          />
        </Grid>
        {/* Gender */}
        <Grid size={12}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioGroupInput
                label="Gender"
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                ]}
                errorText={errors.gender?.message}
                {...field}
              />
            )}
          />
        </Grid>
        <Controller
          name="ownedVehicles"
          control={control}
          render={({ field }) => (
            <CheckboxInput
              label="What do you have?"
              options={[
                { label: "Car", value: "car" },
                { label: "Bike", value: "bike" },
                { label: "Jeep", value: "jeep" },
                { label: "Truck", value: "truck" },
              ]}
              selectedValues={field.value || []}
              onChange={(value, checked) => {
                const newValue = checked
                  ? [...(field.value || []), value]
                  : (field.value || []).filter((v) => v !== value);
                field.onChange(newValue);
              }}
              direction="row" // ⬅️ for horizontal layout
              errorText={errors.ownedVehicles?.message}
            />
          )}
        />
        <Controller
          name="ownedVehiclesTurm"
          control={control}
          render={({ field }) => (
            <CheckboxInput
              label="What do you have?"
              options={[
                { label: "Insurance", value: "insurance" },
                { label: "RTO", value: "rto" },
                { label: "PUC", value: "puc" },
              ]}
              selectedValues={field.value || []}
              onChange={(value, checked) => {
                const newValue = checked
                  ? [...(field.value || []), value]
                  : (field.value || []).filter((v) => v !== value);
                field.onChange(newValue);
              }}
              direction="column" // ⬅️ for horizontal layout
              errorText={errors.ownedVehiclesTurm?.message}
            />
          )}
        />

        {/* Terms */}
        <Grid size={12}>
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <CheckboxInput
                singleLabel="I agree to the terms and conditions" // ✅ Use single label
                checked={field.value}
                onChange={(_: any, checked: boolean) => field.onChange(checked)}
                errorText={errors.acceptTerms?.message}
              />
            )}
          />
        </Grid>

        {/* Submit Button */}
        <Grid container spacing={2}>
        {/* PRIMARY */}
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton type="submit" loading={submitting}>
            Primary Filled
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton appearance="outlined">Primary Outlined</CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton icon={<Check />} iconPosition="left">
            Primary Filled + Icon Left
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton icon={<Check />} appearance="outlined" iconPosition="right">
            Primary Outlined + Icon Right
          </CustomButton>
        </Grid>

        {/* CANCEL */}
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="cancel">Cancel Filled</CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="cancel" appearance="outlined">
            Cancel Outlined
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="cancel" icon={<ArrowForward />} iconPosition="top">
            Cancel Filled + Icon Top
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton
            buttonType="cancel"
            appearance="outlined"
            icon={<ArrowForward />}
            iconPosition="bottom"
          >
            Cancel Outlined + Icon Bottom
          </CustomButton>
        </Grid>

        {/* DELETE */}
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="delete">Delete Filled</CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="delete" appearance="outlined">
            Delete Outlined
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="delete" icon={<Delete />} iconPosition="left">
            Delete Filled + Icon Left
          </CustomButton>
        </Grid>
        <Grid size={{ xs:12, sm: 6, md: 4 }}>
          <CustomButton buttonType="delete" icon={<Delete />} appearance="outlined" iconPosition="right">
            Delete Outlined + Icon Right
          </CustomButton>
        </Grid>
      </Grid>
      </Grid>
    </Box>
  );
};

export default ExampleForm;
