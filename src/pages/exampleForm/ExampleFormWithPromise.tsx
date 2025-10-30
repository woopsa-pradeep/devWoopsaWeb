import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useAppDispatch } from "../../hooks/hooks";
import { submitForm } from "../../redux/thunks/formThunks";
import { formSchema, FormData } from "./formSchema";
import { showPromiseToast } from "../../utils/toastUtils";

const ExampleFormWithPromise: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    // Create a promise from the dispatch
    const formPromise = dispatch(submitForm(data)).unwrap();
    
    // Show a promise toast that tracks the form submission
    showPromiseToast(
      formPromise,
      {
        loading: "Submitting form...",
        success: "Form submitted successfully!",
        error: "Failed to submit form. Please try again.",
      }
    ).then(() => {
      // Reset the form on success
      reset();
    }).catch(() => {
      // Handle any errors that weren't caught by the toast
      console.error("Form submission failed");
    });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Example Form with Promise Toast
      </Typography>
      
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          label="Email"
          fullWidth
          margin="normal"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Submit
        </Button>
      </form>
    </Box>
  );
};

export default ExampleFormWithPromise; 