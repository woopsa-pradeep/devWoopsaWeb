import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getEmailModules,
  createEmailModuleConfig,
  updateEmailModuleConfig,
  testEmailModuleConfig,
} from "../../../redux/apis/distrubutor/settingApis";
import CommonTable from "../../../component/atoms/Table/CommonTable";
import CommonModal from "../../../component/atoms/CommonModal";
import CustomButton from "../../../component/atoms/CustomButton";
import TextInput from "../../../component/atoms/TextInput";
import SwitchInput from "../../../component/atoms/SwitchInput";
import { showSuccessToast, showErrorToast } from "../../../utils/toastUtils";
import { TableColumn } from "../../../component/atoms/Table/CommonTable";

const emailModuleConfigSchema = z.object({
  emailModuleId: z.number().min(1, "Please select an email module"),
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1, "Port is required"),
  secure: z.boolean(),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  fromEmail: z.string().min(1, "From email is required").email("Invalid email"),
  fromName: z.string().min(1, "From name is required"),
});

type EmailModuleConfigFormData = z.infer<typeof emailModuleConfigSchema>;

export interface EmailModuleConfigData {
  id: number;
  emailModuleId: number;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  [key: string]: any;
}

export interface EmailModule {
  id: number;
  name: string;
  isEmailSetup?: boolean;
  configuration: boolean;
  emailModuleConfig: EmailModuleConfigData | null;
  [key: string]: any;
}

const formatModuleName = (name: string) => {
  if (!name) return name;
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const EmailConfigurationTab = () => {
  const [modules, setModules] = useState<EmailModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailModuleConfigData | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [testToEmail, setTestToEmail] = useState("");
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);

  const form = useForm<EmailModuleConfigFormData>({
    resolver: zodResolver(emailModuleConfigSchema),
    defaultValues: {
      emailModuleId: 0,
      host: "",
      port: 587,
      secure: true,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const fetchModules = async () => {
    setLoading(true);
    try {
      const list = await getEmailModules();
      setModules(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch email modules:", error);
      showErrorToast("Failed to load email modules");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const openAdd = (module: EmailModule) => {
    setEditingConfig(null);
    setTestEmailModalOpen(false);
    form.reset({
      emailModuleId: module.id,
      host: "",
      port: 587,
      secure: true,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    });
    setModalOpen(true);
  };

  const openEdit = (module: EmailModule) => {
    const config = module.emailModuleConfig;
    if (!config) return;
    setEditingConfig(config);
    setTestEmailModalOpen(false);
    form.reset({
      emailModuleId: module.id,
      host: config.host ?? "",
      port: config.port ?? 587,
      secure: config.secure ?? true,
      username: config.username ?? "",
      password: config.password ?? "",
      fromEmail: config.fromEmail ?? "",
      fromName: config.fromName ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingConfig(null);
    setTestEmailModalOpen(false);
    form.reset({
      emailModuleId: 0,
      host: "",
      port: 587,
      secure: true,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    });
  };

  const onSubmit = async (data: EmailModuleConfigFormData) => {
    if (!editingConfig && !data.password) {
      showErrorToast("Password is required when creating a new config");
      return;
    }
    setFormLoading(true);
    try {
      const payload: Record<string, any> = {
        emailModuleId: data.emailModuleId,
        host: data.host,
        port: data.port,
        secure: data.secure,
        username: data.username,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }

      if (editingConfig?.id) {
        await updateEmailModuleConfig(editingConfig.id, payload);
        showSuccessToast("Email config updated successfully");
      } else {
        await createEmailModuleConfig(payload);
        showSuccessToast("Email config created successfully");
      }
      await fetchModules();
      closeModal();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? error?.message ?? "Failed to save email config";
      showErrorToast(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const openTestEmailModal = () => {
    setTestToEmail("");
    setTestEmailModalOpen(true);
  };

  const closeTestEmailModal = () => {
    setTestEmailModalOpen(false);
    setTestToEmail("");
  };

  const handleTestEmail = async () => {
    const host = form.getValues("host");
    const port = form.getValues("port");
    const secure = form.getValues("secure");
    const username = form.getValues("username");
    const password = form.getValues("password");
    const fromEmail = form.getValues("fromEmail");
    const fromName = form.getValues("fromName");
    if (!host || !port || !username || !password || !fromEmail || !fromName) {
      showErrorToast("Fill all config details first");
      return;
    }
    if (!testToEmail?.trim()) {
      showErrorToast("Enter To email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testToEmail.trim())) {
      showErrorToast("Please enter a valid To email address");
      return;
    }
    setTestEmailLoading(true);
    try {
      await testEmailModuleConfig({
        to: testToEmail.trim(),
        subject: "Email Module Config Test",
        html: "<!DOCTYPE html><html><body><h2>Test Email</h2><p>This email is sent to test the email module configuration.</p><p>If you receive this, the configuration is working correctly.</p></body></html>",
        emailConfig: {
          host,
          port,
          username,
          secure,
          password,
          fromEmail,
          fromName,
        },
      });
      showSuccessToast("Test email sent successfully. Check the inbox.");
      closeTestEmailModal();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? error?.message ?? "Failed to send test email";
      showErrorToast(msg);
    } finally {
      setTestEmailLoading(false);
    }
  };

  const isTestEnabled =
    !!form.watch("host")?.trim() &&
    !!form.watch("port") &&
    !!form.watch("username")?.trim() &&
    !!form.watch("password")?.trim() &&
    !!form.watch("fromEmail")?.trim() &&
    !!form.watch("fromName")?.trim();

  const columns: TableColumn<EmailModule>[] = [
    {
      id: "name",
      label: "Module",
      minWidth: 180,
      render: (row) => (
        <Typography variant="body2">{formatModuleName(row.name ?? "")}</Typography>
      ),
    },
    {
      id: "configuration",
      label: "Configuration",
      minWidth: 120,
      render: (row) => (
        <Typography variant="body2">
          {row.configuration && row.emailModuleConfig ? "Yes" : "No"}
        </Typography>
      ),
    },
    {
      id: "host",
      label: "Host",
      minWidth: 160,
      render: (row) => (
        <Typography variant="body2">
          {row.emailModuleConfig?.host ?? "—"}
        </Typography>
      ),
    },
    {
      id: "port",
      label: "Port",
      minWidth: 70,
      render: (row) => (
        <Typography variant="body2">
          {row.emailModuleConfig?.port ?? "—"}
        </Typography>
      ),
    },
    {
      id: "fromEmail",
      label: "From Email",
      minWidth: 200,
      render: (row) => (
        <Typography variant="body2">
          {row.emailModuleConfig?.fromEmail ?? "—"}
        </Typography>
      ),
    },
    {
      id: "fromName",
      label: "From Name",
      minWidth: 140,
      render: (row) => (
        <Typography variant="body2">
          {row.emailModuleConfig?.fromName ?? "—"}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      minWidth: 90,
      align: "right",
      render: (row) =>
        row.configuration && row.emailModuleConfig ? (
          <IconButton
            size="small"
            onClick={() => openEdit(row)}
            sx={{ color: "primary.main" }}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            onClick={() => openAdd(row)}
            sx={{ color: "primary.main" }}
            title="Add config"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        ),
    },
  ];

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "grey" }}>
          Email Configs
        </Typography>
      </Box>
      <CommonTable
        data={modules}
        columns={columns}
        currentPage={1}
        totalPages={1}
        totalItems={modules.length}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        showPageSizeSelector={false}
        showTotalItems={false}
        showPageNumbers={false}
        loading={loading}
        isPagination={false}
        containerHeight="calc(100vh - 350px)"
        emptyStateComponent={<Typography>No email modules found.</Typography>}
        stickyLastColumn
      />

      <CommonModal
        open={modalOpen}
        onClose={closeModal}
        title={editingConfig ? "Edit Email Config" : "Add Email Config"}
        size="md"
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControl fullWidth size="small" error={!!form.formState.errors.emailModuleId}>
              <InputLabel>Email Module</InputLabel>
              <Select
                value={form.watch("emailModuleId") || ""}
                onChange={(e) => form.setValue("emailModuleId", Number(e.target.value))}
                label="Email Module"
                disabled
              >
                {modules.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {formatModuleName(m.name ?? "")}
                  </MenuItem>
                ))}
              </Select>
              {form.formState.errors.emailModuleId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {form.formState.errors.emailModuleId.message}
                </Typography>
              )}
            </FormControl>

            <TextInput
              label="Host"
              {...form.register("host")}
              error={!!form.formState.errors.host}
              helperText={form.formState.errors.host?.message}
              placeholder="e.g. smtp.office365.com"
            />

            <TextInput
              label="Port"
              type="number"
              {...form.register("port", { valueAsNumber: true })}
              error={!!form.formState.errors.port}
              helperText={form.formState.errors.port?.message}
            />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 14 }}>Secure (SSL/TLS)</Typography>
              <SwitchInput
                checked={form.watch("secure")}
                onChange={(checked) => form.setValue("secure", checked)}
                sx={{ mb: 0 }}
                isShowLabel={false}
              />
            </Box>

            <TextInput
              label="Username"
              type="email"
              {...form.register("username")}
              error={!!form.formState.errors.username}
              helperText={form.formState.errors.username?.message}
            />

            <TextInput
              label="Password"
              type="password"
              {...form.register("password")}
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
              placeholder={editingConfig ? "Leave blank to keep current" : undefined}
            />

            <TextInput
              label="From Email"
              type="email"
              {...form.register("fromEmail")}
              error={!!form.formState.errors.fromEmail}
              helperText={form.formState.errors.fromEmail?.message}
            />

            <TextInput
              label="From Name"
              {...form.register("fromName")}
              error={!!form.formState.errors.fromName}
              helperText={form.formState.errors.fromName?.message}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1, flexWrap: "wrap" }}>
              <CustomButton
                appearance="outlined"
                type="button"
                size="small"
                fullWidth={false}
                onClick={openTestEmailModal}
                disabled={!isTestEnabled}
              >
                Test
              </CustomButton>
              <CustomButton appearance="outlined" onClick={closeModal} type="button" size="small" fullWidth={false}>
                Cancel
              </CustomButton>
              <CustomButton
                appearance="filled"
                type="submit"
                size="small"
                fullWidth={false}
                loading={formLoading}
              >
                {editingConfig ? "Update" : "Save"}
              </CustomButton>
            </Box>
          </Box>
        </form>
      </CommonModal>

      <CommonModal
        open={testEmailModalOpen}
        onClose={closeTestEmailModal}
        title="Send Test Email"
        size="sm"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <TextInput
            label="To (Test Email)"
            type="email"
            value={testToEmail}
            onChange={(e) => setTestToEmail(e.target.value)}
            placeholder="Email address to send test to"
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <CustomButton appearance="outlined" onClick={closeTestEmailModal} type="button" size="small" fullWidth={false}>
              Cancel
            </CustomButton>
            <CustomButton
              appearance="filled"
              type="button"
              size="small"
              fullWidth={false}
              loading={testEmailLoading}
              onClick={handleTestEmail}
              disabled={!testToEmail?.trim()}
            >
              Send
            </CustomButton>
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
};

export default EmailConfigurationTab;
