import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Paper,
    useMediaQuery,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    Campaign as CampaignIcon,
    Article as StoriesIcon,
    Inventory as ProductCatalogIcon,
    Web as WebViewIcon,
    Link as LinksIcon,
    Email as EmailMarketingIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Send as SendIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import CommonModal from '../../atoms/CommonModal';
import TextEditor from '../../atoms/TextEditor';
import { MultiSearchableDropdown } from '../../atoms/SearchableDropdown';
import CommonTable, { TableColumn } from '../../atoms/Table/CommonTable';
import CustomButton from '../../atoms/CustomButton';
import PromoForm from '../../molecules/PromoForm';
import PromoViewModal from '../../molecules/PromoViewModal';
import SwitchInput from '../../atoms/SwitchInput';
import DeleteModal from '../../atoms/DeleteModal';
import { createPromo, updatePromo, getPromoList, deletePromo, createEmailMarketing, getAllEmailMarketing, getEmailForCampaign, getCustomerRouteList, uploadAttachment, sendDraftEmail } from '../../../redux/apis/distrubutor/promoApis';
import { toast } from 'react-hot-toast';
import Links from '../../../pages/admin/links/Links';
import ProductCatalog from './ProductCatalog';
import Stories from './Stories';
import WebView from './WebView';

interface Promo {
    id: number;
    bannerTitle: string;
    bannerDescription: string;
    inventors: string[];
    inventoryItems: any[];
    startDate: string;
    endDate: string;
    hasForWeb: boolean;
    image_url?: string;
    status?: boolean;
}

interface EmailCampaign {
    id: number;
    to: string[];
    cc?: string | null;
    status: 'sent' | 'queued' | 'draft' | 'failed';
    subject: string;
    body: string;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
}

interface EmailOption {
    value: string;
    label: string;
}

interface RouteOption {
    value: string;
    label: string;
}

interface DayOption {
    value: string;
    label: string;
}

const tabConfigs = [
    {
        label: 'Active Promos',
        icon: <CampaignIcon />,
        value: 'active',
        filter: (promo: Promo) => {
            const endDate = dayjs(promo.endDate);
            const currentDate = dayjs();
            const isValid = endDate.isAfter(currentDate);
            return isValid;
        },
        description: 'Manage currently active promotional campaigns'
    },
    {
        label: 'Stories',
        icon: <StoriesIcon />,
        value: 'stories',
        filter: () => false,
    },
    {
        label: 'Product Catalog',
        icon: <ProductCatalogIcon />,
        value: 'productCatalog',
        filter: () => false,
        description: 'Manage product catalog and inventory'
    },
    {
        label: 'WebView',
        icon: <WebViewIcon />,
        value: 'webView',
        filter: () => false,
        description: 'Web view configuration and settings'
    },
    {
        label: 'Links',
        icon: <LinksIcon />,
        value: 'links',
        filter: () => false,
        description: 'Manage promotional links and URLs'
    },
    {
        label: 'Email Marketing',
        icon: <EmailMarketingIcon />,
        value: 'emailMarketing',
        filter: () => false,
        description: 'Manage email marketing campaigns and templates'
    }
];

const PromoTabs = () => {
    const theme = useTheme();
    const [tab, setTab] = useState(0);
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedActionPromo, setSelectedActionPromo] = useState<Promo | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const isMobile = useMediaQuery("(max-width: 899px)");

    // Email Marketing states
    const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailViewModalOpen, setEmailViewModalOpen] = useState(false);
    const [selectedEmailCampaign, setSelectedEmailCampaign] = useState<EmailCampaign | null>(null);
    const [emailFormData, setEmailFormData] = useState({
        to: [] as string[],
        subject: '',
        body: '',
        attachments: [] as string[]
    });
    const [emailFormLoading, setEmailFormLoading] = useState(false);
    const [emailOptions, setEmailOptions] = useState<EmailOption[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<EmailOption[]>([]);
    const [emailOptionsLoading, setEmailOptionsLoading] = useState(false);
    const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
    const [selectedRoutes, setSelectedRoutes] = useState<RouteOption[]>([]);
    const [routeOptionsLoading, setRouteOptionsLoading] = useState(false);
    const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
    const [selectedDays, setSelectedDays] = useState<DayOption[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [attachmentLoading, setAttachmentLoading] = useState(false);
    const [sendDraftModalOpen, setSendDraftModalOpen] = useState(false);
    const [selectedDraftCampaign, setSelectedDraftCampaign] = useState<EmailCampaign | null>(null);
    const [sendDraftLoading, setSendDraftLoading] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    const fetchPromos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getPromoList({
                page: currentPage,
                limit: pageSize
            });
            
            const data = (response as any)?.data || {};
            
            setPromos(data?.data?.bannerList || []);
            setTotalItems(data?.data?.totalCount|| 0);
            setTotalPages(Math.ceil((data?.data?.totalCount || 0) / pageSize));
        } catch (error) {
            console.error('Error fetching promos:', error);
            toast.error('Failed to load promos');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    const fetchEmailCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAllEmailMarketing();
            console.log('Email campaigns API response:', response);
            
            const data = (response as any) || [];
            const campaigns = data?.data || [];
            const pagination = data?.pagination || {};
            
            console.log('Processed campaigns:', campaigns);
            console.log('Pagination:', pagination);
            
            setEmailCampaigns(campaigns);
            
            // Update pagination if needed
            if (pagination.total) {
                setTotalItems(pagination.total);
                setTotalPages(pagination.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching email campaigns:', error);
            toast.error('Failed to load email campaigns');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEmailOptions = useCallback(async () => {
        setEmailOptionsLoading(true);
        try {
            const response = await getEmailForCampaign({ routes: [], days: [] });
            console.log('Email options API response:', response);
            
            // Filter out entries without C_Email and transform the response data
            const options: EmailOption[] = response
                .filter((item: any) => {
                    // Keep plain strings (email addresses)
                    if (typeof item === 'string') return true;
                    // For objects, only keep if C_Email exists and is not empty
                    if (typeof item === 'object' && item !== null) {
                        return item.C_Email && item.C_Email.trim() !== '';
                    }
                    return false;
                })
                .map((item: any) => ({
                    value: item.C_Email || item,
                    label: item.C_Name || item
                }));
            
            setEmailOptions(options);
        } catch (error) {
            console.error('Error fetching email options:', error);
            toast.error('Failed to load email options');
        } finally {
            setEmailOptionsLoading(false);
        }
    }, []);

    const fetchRouteOptions = useCallback(async () => {
        setRouteOptionsLoading(true);
        try {
            const response = await getCustomerRouteList();
            console.log('Route options API response:', response);
            
            // Transform the response data to match RouteOption interface
            const options: RouteOption[] = response.route.map((item: any) => ({
                value: String(item.Route_Number || item.Route_Number),
                label: item.Route_Number || item.Route_Number || `Route ${item.Route_Number || item.Route_Number}`
            }));
            
            setRouteOptions(options);
        } catch (error) {
            console.error('Error fetching route options:', error);
            toast.error('Failed to load route options');
        } finally {
            setRouteOptionsLoading(false);
        }
    }, []);

    const initializeDayOptions = useCallback(() => {
        const days: DayOption[] = [
            { value: '1', label: 'Monday' },
            { value: '2', label: 'Tuesday' },
            { value: '3', label: 'Wednesday' },
            { value: '4', label: 'Thursday' },
            { value: '5', label: 'Friday' },
            { value: '6', label: 'Saturday' },
            { value: '7', label: 'Sunday' }
        ];
        setDayOptions(days);
    }, []);
    
    useEffect(() => {
        if (tabConfigs[tab].value === 'active') {
            fetchPromos();
        } else if (tabConfigs[tab].value === 'emailMarketing') {
            fetchEmailCampaigns();
        }
    }, [currentPage, pageSize, tab, fetchPromos, fetchEmailCampaigns]);

    const handleStatusChange = async (promo: Promo) => {
        try {
            const form = new FormData();
            form.append('status', (!promo.status).toString());

            await updatePromo(promo.id.toString(), form);
            fetchPromos();

            toast.success('Status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleStatusWebChange = async (promo: Promo) => {
        try {
            const form = new FormData();
            form.append('hasForWeb', (!promo.hasForWeb).toString());

            await updatePromo(promo.id.toString(), form);
            fetchPromos();

            toast.success('Status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    const handleAddPromo = () => {
        setSelectedPromo(null);
        setModalOpen(true);
    };

    const handleEditPromo = (promo: Promo) => {
        setSelectedPromo(promo);
        setModalOpen(true);
    };

    const handleViewPromo = (promo: Promo) => {
        setSelectedPromo(promo);
        setViewModalOpen(true);
    };

    const handleDeletePromo = async (promo: Promo) => {
        setSelectedActionPromo(promo);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedActionPromo) return;

        setDeleteLoading(true);
        try {
            await deletePromo(selectedActionPromo.id.toString());
            await fetchPromos();
            toast.success('Promo deleted successfully');
            setDeleteModalOpen(false);
            setSelectedActionPromo(null);
        } catch (error) {
            console.error('Error deleting promo:', error);
            toast.error('Failed to delete promo');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, promo: Promo) => {
        setAnchorEl(event.currentTarget);
        setSelectedActionPromo(promo);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedActionPromo(null);
    };

    const handleMenuAction = (action: 'view' | 'edit' | 'delete') => {
        if (!selectedActionPromo) return;

        handleMenuClose();

        switch (action) {
            case 'view':
                handleViewPromo(selectedActionPromo);
                break;
            case 'edit':
                handleEditPromo(selectedActionPromo);
                break;
            case 'delete':
                handleDeletePromo(selectedActionPromo);
                break;
        }
    };

    const handleFormSubmit = async (formData: any) => {
        setFormLoading(true);

        try {
            const form = new FormData();
            form.append('bannerTitle', formData.bannerTitle);
            form.append('bannerDescription', formData.bannerDescription);
            form.append('startDate', formData.startDate || '');
            form.append('endDate', formData.endDate || '');
            form.append('status', formData.status ? 'true' : 'false');
            form.append('hasForWeb', formData.hasForWeb ? 'true' : 'false');
            if (formData.image_url instanceof File) {
                form.append('image_url', formData.image_url);
            } else if (formData.imagePreview) {
                form.append('image_url', formData.imagePreview);
            }

            formData.inventors.forEach((itemNumber: string, index: number) => {
                form.append(`inventors[${index}]`, itemNumber);
            });

            if (selectedPromo) {
                await updatePromo(selectedPromo.id.toString(), form);
                toast.success('Promo updated successfully');
            } else {
                await createPromo(form);
                toast.success('Promo created successfully');
            }

            fetchPromos();
            setModalOpen(false);
            setSelectedPromo(null);
        } catch (error) {
            console.error('Error saving promo:', error);
            toast.error(selectedPromo ? 'Failed to update promo' : 'Failed to create promo');
        } finally {
            setFormLoading(false);
        }
    };

    // Email Marketing handlers
    const handleAddEmailCampaign = async () => {
        setEmailFormData({
            to: [],
            subject: '',
            body: '',
            attachments: []
        });
        setSelectedRecipients([]);
        setSelectedRoutes([]);
        setSelectedDays([]);
        setAttachments([]);
        setEmailModalOpen(true);
        
        // Initialize day options and fetch route options and email options when modal opens
        initializeDayOptions();
        await Promise.all([fetchRouteOptions(), fetchEmailOptions()]);
    };


    const handleRecipientsChange = (selectedOptions: EmailOption[]) => {
        // Check if "select all" option is selected
        const hasSelectAll = selectedOptions.some(option => option.value === 'select-all');
        
        if (hasSelectAll) {
            // If "Select All" is selected, select all available email options
            // Use current emailOptions (which may be filtered based on routes/days)
            const allEmailOptions = emailOptions.map(option => ({
                label: option.label,
                value: option.value
            }));
            setSelectedRecipients(allEmailOptions);
            const emails = allEmailOptions.map(option => option.value);
            setEmailFormData(prev => ({
                ...prev,
                to: emails
            }));
        } else {
            // Filter out "select all" option and set regular selection
            const filteredOptions = selectedOptions.filter(option => option.value !== 'select-all');
            setSelectedRecipients(filteredOptions);
            const emails = filteredOptions.map(option => option.value);
            setEmailFormData(prev => ({
                ...prev,
                to: emails
            }));
        }
    };

    const handleRoutesChange = async (selectedOptions: RouteOption[]) => {
        setSelectedRoutes(selectedOptions);
        await fetchFilteredEmails(selectedOptions, selectedDays);
    };

    const handleDaysChange = async (selectedOptions: DayOption[]) => {
        setSelectedDays(selectedOptions);
        await fetchFilteredEmails(selectedRoutes, selectedOptions);
    };

    const fetchFilteredEmails = async (routes: RouteOption[], days: DayOption[]) => {
        // If routes or days are selected, fetch filtered email options
        if (routes.length > 0 || days.length > 0) {
            setEmailOptionsLoading(true);
            try {
                const routeIds = routes.map(option => parseInt(option.value));
                const dayIds = days.map(option => parseInt(option.value));
                const payload = {
                    routes: routeIds,
                    days: dayIds
                };
                
                console.log('Fetching emails for filters:', payload);
                const response = await getEmailForCampaign(payload);
                
                // Filter out entries without C_Email and transform the response data
                const options: EmailOption[] = response
                    .filter((item: any) => {
                        // Keep plain strings (email addresses)
                        if (typeof item === 'string') return true;
                        // For objects, only keep if C_Email exists and is not empty
                        if (typeof item === 'object' && item !== null) {
                            return item.C_Email && item.C_Email.trim() !== '';
                        }
                        return false;
                    })
                    .map((item: any) => ({
                        value: item.C_Email || item,
                        label: item.C_Name || item
                    }));
                
                setEmailOptions(options);
                // Clear selected recipients when filters change
                setSelectedRecipients([]);
                setEmailFormData(prev => ({
                    ...prev,
                    to: []
                }));
            } catch (error) {
                console.error('Error fetching filtered email options:', error);
                toast.error('Failed to load filtered email options');
            } finally {
                setEmailOptionsLoading(false);
            }
        } else {
            // If no filters selected, fetch all email options
            await fetchEmailOptions();
        }
    };

    const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // File size validation (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setAttachmentLoading(true);
        try {
            const response = await uploadAttachment({ attachment: file });
            console.log('Attachment upload response:', response);
            
            // Assuming the API returns the URL in response.data.url or similar
            const attachmentUrl = (response as any)?.data?.url || (response as any)?.data?.data?.url || (response as any)?.data;
            
            if (attachmentUrl) {
                setAttachments(prev => [...prev, attachmentUrl]);
                setEmailFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, attachmentUrl]
                }));
                toast.success('Attachment uploaded successfully!');
            } else {
                toast.error('Failed to get attachment URL');
            }
        } catch (error) {
            console.error('Error uploading attachment:', error);
            toast.error('Failed to upload attachment');
        } finally {
            setAttachmentLoading(false);
        }
    };

    const handleRemoveAttachment = (attachmentUrl: string) => {
        setAttachments(prev => prev.filter(url => url !== attachmentUrl));
        setEmailFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter(url => url !== attachmentUrl)
        }));
    };

    const handleViewEmailCampaign = (campaign: EmailCampaign) => {
        setSelectedEmailCampaign(campaign);
        setEmailViewModalOpen(true);
    };

    const handleSendDraft = (campaign: EmailCampaign) => {
        setSelectedDraftCampaign(campaign);
        setSendDraftModalOpen(true);
    };

    const confirmSendDraft = async () => {
        if (!selectedDraftCampaign) return;

        setSendDraftLoading(true);
        try {
            await sendDraftEmail(selectedDraftCampaign.id.toString());
            toast.success('Draft email sent successfully!');
            setSendDraftModalOpen(false);
            setSelectedDraftCampaign(null);
            await fetchEmailCampaigns(); // Refresh the list
        } catch (error) {
            console.error('Error sending draft email:', error);
            toast.error('Failed to send draft email');
        } finally {
            setSendDraftLoading(false);
        }
    };

    const handleEmailFormSubmit = async () => {
        if (emailFormData.to.length === 0) {
            toast.error('Please add at least one recipient');
            return;
        }
        if (!emailFormData.subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }
        if (!emailFormData.body.trim()) {
            toast.error('Please enter email content');
            return;
        }

        setEmailFormLoading(true);
        try {
            const payload = {
                to: emailFormData.to,
                subject: emailFormData.subject,
                body: emailFormData.body,
                attachments: emailFormData.attachments
            };

            console.log('Email campaign payload:', payload);
            
            // Call the actual API
            await createEmailMarketing(payload);
            
            toast.success('Email campaign sent successfully!');
            setEmailModalOpen(false);
            
            // Refresh the email campaigns list
            await fetchEmailCampaigns();
            
        } catch (error) {
            console.error('Error sending email campaign:', error);
            toast.error('Failed to send email campaign');
        } finally {
            setEmailFormLoading(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (!emailFormData.subject.trim()) {
            toast.error('Please enter a subject');
            return;
        }
        if (!emailFormData.body.trim()) {
            toast.error('Please enter email content');
            return;
        }

        setEmailFormLoading(true);
        try {
            const payload = {
                to: emailFormData.to,
                subject: emailFormData.subject,
                body: emailFormData.body,
                attachments: emailFormData.attachments,
                status: 'draft'
            };

            console.log('Email campaign draft payload:', payload);
            
            // Call the actual API with draft status
            await createEmailMarketing(payload);
            
            toast.success('Email campaign saved as draft!');
            setEmailModalOpen(false);
            
            // Refresh the email campaigns list
            await fetchEmailCampaigns();
            
        } catch (error) {
            console.error('Error saving email campaign as draft:', error);
            toast.error('Failed to save email campaign as draft');
        } finally {
            setEmailFormLoading(false);
        }
    };

    const columns: TableColumn<Promo>[] = [
        {
            id: 'image',
            label: 'Banner',
            render: (row) => (
                <Avatar
                    src={row.image_url}
                    alt={row.bannerTitle}
                    sx={{ width: 50, height: 35, borderRadius: 1 }}
                    variant="rounded"
                />
            ),
        },
        {
            id: 'bannerTitle',
            label: 'Title',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {row.bannerTitle || "-"}
                </Typography>
            ),
        },
        {
            id: 'bannerDescription',
            label: 'Description',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 180,
                    lineHeight: 1.2
                }}>
                    {row.bannerDescription || "-"}
                </Typography>
            ),
        },
        {
            id: 'inventors',
            label: 'Products',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {row.inventors?.length || "-"}
                </Typography>
            ),
        },
        {
            id: 'startDate',
            label: 'Start Date',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {dayjs(row.startDate).format('MMM DD, YYYY') || "-"}
                </Typography>
            ),
        },
        {
            id: 'endDate',
            label: 'End Date',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {dayjs(row.endDate).format('MMM DD, YYYY') || "-"}
                </Typography>
            ),
        },
        {
            id: 'status',
            label: 'Status',
            render: (row) => (
                <SwitchInput
                    checked={row.status}
                    onChange={() => handleStatusChange(row)}
                    isShowLabel={false}
                    sx={{ mb: 0 }}
                />
            ),
        },
        {
            id: 'hasForWeb',
            label: 'Allow Web',
            render: (row) => (
                <SwitchInput
                    checked={row.hasForWeb}
                    onChange={() => handleStatusWebChange(row)}
                    isShowLabel={false}
                    sx={{ mb: 0 }}
                />
            ),
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            render: (row) => (
                <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, row)}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        }
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            ),
        },
    ];

    const emailCampaignColumns: TableColumn<EmailCampaign>[] = [
        {
            id: 'subject',
            label: 'Subject',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {row.subject || "-"}
                </Typography>
            ),
        },
        {
            id: 'recipients',
            label: 'Recipients',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {row.to?.length || 0} recipients
                </Typography>
            ),
        },
        {
            id: 'status',
            label: 'Status',
            render: (row) => (
                <Chip
                    label={row.status}
                    size="small"
                    color={
                        row.status === 'sent' ? 'success' :
                        row.status === 'queued' ? 'warning' :
                        row.status === 'failed' ? 'error' :
                        row.status === 'draft' ? 'info' : 'default'
                    }
                    sx={{ fontSize: 12 }}
                />
            ),
        },
        {
            id: 'createdAt',
            label: 'Created',
            render: (row) => (
                <Typography fontSize={14} color="text.secondary" sx={{ lineHeight: 1.2 }}>
                    {dayjs(row.createdAt).format('YYYY/MM/DD') || "-"}
                </Typography>
            ),
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            render: (row) => (
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        onClick={() => handleViewEmailCampaign(row)}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        <ViewIcon fontSize="small" />
                    </IconButton>
                    {row.status === 'draft' && (
                        <IconButton
                            size="small"
                            onClick={() => handleSendDraft(row)}
                            sx={{
                                color: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'primary.50',
                                }
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            ),
        },
        
    ];

    // Filter promos based on active tab
    const getFilteredPromos = () => {
        const currentTabConfig = tabConfigs[tab];
        
        if (currentTabConfig.value === 'active') {
            const filtered = promos.filter(currentTabConfig.filter);
            return filtered;
        }
        return [];
    };

    // Render content based on active tab
    const renderTabContent = () => {
        const currentTab = tabConfigs[tab];

        switch (currentTab.value) {
            case 'active':
                const filteredPromos = getFilteredPromos();
                // console.log(filteredPromos,'filteredPromoss')
                return (
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Add Promo Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px:2 }}>
                            <Typography fontSize={16} color="text.primary">Promo Management</Typography>
                            <CustomButton
                                sx={{mt:0}}
                                fullWidth={false}
                                appearance="filled"
                                onClick={handleAddPromo}
                                icon={<AddIcon fontSize='small' sx={{fontSize:16}}/>}
                                size="small"
                            >
                                Add
                            </CustomButton>
                        </Box>

                        {/* Table */}
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <CommonTable
                                data={filteredPromos}
                                columns={columns}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                loading={loading}
                            />
                        </Box>
                    </Box>
                );

            case 'stories':
                return (
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <Stories />
                        </Box>
                    </Box>
                );

            case 'productCatalog':
                return (
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <ProductCatalog />
                        </Box>
                    </Box>
                );

            case 'webView':
                return (
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <WebView />
                        </Box>
                    </Box>
                );

            case 'links':
                return (
                    <Box sx={{ P:2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <Links />
                        </Box>
                    </Box>
                );

            case 'emailMarketing':
                return (
                    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontSize={16} color="text.primary">Email Marketing</Typography>
                            <CustomButton
                                sx={{ mt: 0 }}
                                fullWidth={false}
                                appearance="filled"
                                onClick={handleAddEmailCampaign}
                                icon={<AddIcon fontSize='small' sx={{ fontSize: 16 }} />}
                                size="small"
                            >
                                Add Campaign
                            </CustomButton>
                        </Box>
                        
                        {/* Email Campaigns Table */}
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <CommonTable
                                data={emailCampaigns}
                                columns={emailCampaignColumns}
                                currentPage={1}
                                totalPages={1}
                                totalItems={emailCampaigns.length}
                                pageSize={10}
                                onPageChange={() => {}}
                                onPageSizeChange={() => {}}
                                loading={loading}
                            />
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    if (loading && promos.length === 0 && tabConfigs[tab].value === 'active') {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography>Loading promos...</Typography>
            </Box>
        );
    }

    return (
        <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            mt={2}
            gap={3}
            sx={{
                height: { xs: 'auto', md: 'calc(100vh - 200px)' }
            }}
        >
            {/* Left Sidebar - Tabs */}
            <Paper sx={{
                width: { xs: "100%", md: 250 },
                minWidth: { xs: "100%", md: 250 },
                maxWidth: { xs: "100%", md: 250 },
                borderRadius: 3,
                boxShadow: "none",
                height: { xs: "auto", md: '100%' },
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                <Tabs
                    orientation={isMobile ? "horizontal" : "vertical"}
                    variant={isMobile ? "scrollable" : "standard"}
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        py: { xs: 1, md: 2 },
                        flexGrow: 1,
                        height: isMobile ? 'auto' : '100%'
                    }}
                    TabIndicatorProps={{ style: { display: "none" } }}
                >
                    {tabConfigs.map((t, i) => (
                        <Tab
                            key={i}
                            label={t.label}
                            icon={t.icon}
                            iconPosition="start"
                            sx={{
                                alignItems: "center",
                                justifyContent: "flex-start",
                                textTransform: "none",
                                minHeight: { xs: 35, md: 48 },
                                fontWeight: 400,
                                gap: { xs: 0.3, md: 1 },
                                margin: '4px 8px',
                                transition: 'all 0.2s ease-in-out',
                                "&.Mui-selected": {
                                    color: theme.palette.primary.main,
                                    fontWeight: 500,
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                },
                            }}
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Right Content - Form */}
            <Paper sx={{
                flexGrow: 1,
                minWidth: 0,
                borderRadius: 3,
                boxShadow: "none",
                height: { xs: "auto", md: '100%' },
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{ height: { xs: "auto", md: '100%' }, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    {/* <Box sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "primary.main",
                        borderRadius: "8px 8px 0 0",
                        padding: "12px 20px",
                        flexShrink: 0
                    }}>
                        <Typography sx={{ fontWeight: 500, fontSize: 16, color: "white" }}>
                            {tabConfigs[tab].label}
                        </Typography>
                    </Box> */}

                    {/* Content */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0 }}>
                        {renderTabContent()}
                    </Box>
                </Box>
            </Paper>

            {/* Add/Edit Modal - Only show for Active Promos tab */}
            <CommonModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedPromo(null);
                }}
                size="xl"
                title={selectedPromo ? "Edit Promo" : "Add Promo"}
            >
                <PromoForm
                    initialData={selectedPromo ? {
                        _id: selectedPromo.id.toString(),
                        image_url: null,
                        imagePreview: selectedPromo.image_url,
                        bannerTitle: selectedPromo.bannerTitle,
                        bannerDescription: selectedPromo.bannerDescription,
                        startDate: dayjs(selectedPromo.startDate),
                        endDate: dayjs(selectedPromo.endDate),
                        status: selectedPromo.status ?? true,
                        hasForWeb: selectedPromo.hasForWeb ?? false,
                        inventors: selectedPromo.inventors || [],
                    } : undefined}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setModalOpen(false);
                        setSelectedPromo(null);
                    }}
                    loading={formLoading}
                />
            </CommonModal>

            {/* View Modal - Only show for Active Promos tab */}
            <PromoViewModal
                promo={selectedPromo}
                open={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedPromo(null);
                }}
            />

            {/* Actions Menu - Only show for Active Promos tab */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        borderRadius: 2,
                        minWidth: 150,
                    }
                }}
            >
                <MenuItem onClick={() => handleMenuAction('view')}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="View" />
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('edit')}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Edit" />
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('delete')}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete" />
                </MenuItem>
            </Menu>

            {/* Delete Modal - Only show for Active Promos tab */}
            <DeleteModal
                open={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setSelectedActionPromo(null);
                }}
                onConfirm={confirmDelete}
                message="Are you sure you want to delete this promo? This action will permanently remove the promo and cannot be undone."
                itemName={selectedActionPromo?.bannerTitle}
                loading={deleteLoading}
            />

            {/* Email Campaign Modal */}
            <Dialog
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '90vh',
                        maxHeight: '90vh',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    pb: 1, 
                    borderBottom: '1px solid',
                    borderColor: 'grey.200',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'text.primary'
                }}>
                    Create Email Campaign
                </DialogTitle>
                
                <DialogContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3, 
                    pt: 3,
                    px: 3
                }}>
                    {/* Filters Section */}
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'grey.200'
                    }}>
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontSize: 16, 
                            fontWeight: 600,
                            color: 'text.primary'
                        }}>
                            Filter Recipients
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Route Filter */}
                            <Box sx={{ flex: 1 }}>
                                <MultiSearchableDropdown
                                    label="Routes"
                                    options={routeOptions}
                                    value={selectedRoutes}
                                    onChange={handleRoutesChange}
                                    placeholder="Select routes..."
                                    loading={routeOptionsLoading}
                                    sx={{ mb: 0 }}
                                />
                            </Box>

                            {/* Days Filter */}
                            <Box sx={{ flex: 1 }}>
                                <MultiSearchableDropdown
                                    label="Days"
                                    options={dayOptions}
                                    value={selectedDays}
                                    onChange={handleDaysChange}
                                    placeholder="Select days..."
                                    sx={{ mb: 0 }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Recipients Section */}
                    <Box>
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontSize: 16, 
                            fontWeight: 600,
                            color: 'text.primary'
                        }}>
                            Recipients
                        </Typography>
                        <MultiSearchableDropdown
                            label=""
                            options={[
                                {
                                    label: selectedRoutes.length > 0 || selectedDays.length > 0
                                        ? `Select All Filtered Recipients (${emailOptions.length})`
                                        : `Select All Recipients (${emailOptions.length})`,
                                    value: "select-all",
                                },
                                ...emailOptions
                            ]}
                            value={selectedRecipients}
                            onChange={handleRecipientsChange}
                            placeholder="Select recipients..."
                            loading={emailOptionsLoading}
                            sx={{ mb: 0 }}
                        />
                    </Box>

                    {/* Subject Section */}
                    <Box>
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontSize: 16, 
                            fontWeight: 600,
                            color: 'text.primary'
                        }}>
                            Subject
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Enter email subject"
                            value={emailFormData.subject}
                            onChange={(e) => setEmailFormData(prev => ({ ...prev, subject: e.target.value }))}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    fontSize: 14
                                }
                            }}
                        />
                    </Box>

                    {/* Email Content Section */}
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontSize: 16, 
                            fontWeight: 600,
                            color: 'text.primary'
                        }}>
                            Email Content
                        </Typography>
                        <Box sx={{ 
                            flexGrow: 1, 
                            minHeight: 300,
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <TextEditor
                                value={emailFormData.body}
                                onChange={(content) => setEmailFormData(prev => ({ ...prev, body: content }))}
                                placeholder="Enter email content..."
                                height="280px"
                            />
                        </Box>
                    </Box>

                    {/* Attachments Section */}
                    <Box>
                        <Typography variant="h6" sx={{ 
                            mb: 2, 
                            fontSize: 16, 
                            fontWeight: 600,
                            color: 'text.primary'
                        }}>
                            Attachments
                        </Typography>
                        
                        <Box sx={{ 
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            p: 2,
                            bgcolor: 'grey.50',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'primary.50'
                            }
                        }}>
                            {/* Upload Area */}
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                gap: 1,
                                py: 1
                            }}>
                                <input
                                    type="file"
                                    id="attachment-upload"
                                    onChange={handleAttachmentUpload}
                                    style={{ display: 'none' }}
                                    accept="*/*"
                                />
                                <CustomButton
                                    onClick={() => document.getElementById('attachment-upload')?.click()}
                                    size="small"
                                    disabled={attachmentLoading}
                                    icon={attachmentLoading ? <CircularProgress size={14} /> : null}
                                    sx={{ 
                                        borderRadius: 1.5,
                                        px: 2,
                                        py: 0.5,
                                        fontSize: 12,
                                        minWidth: 'auto',
                                        height: 28
                                    }}
                                >
                                    {attachmentLoading ? 'Uploading...' : 'Choose File'}
                                </CustomButton>
                                <Typography variant="caption" sx={{ 
                                    color: 'text.secondary',
                                    fontSize: 11,
                                    textAlign: 'center'
                                }}>
                                    Maximum file size: 5MB
                                </Typography>
                            </Box>
                            
                            {/* Attachments List */}
                            {attachments.length > 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
                                    <Typography variant="subtitle2" sx={{ 
                                        mb: 1.5, 
                                        color: 'text.secondary',
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}>
                                        Uploaded Files ({attachments.length})
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {attachments.map((url, index) => (
                                            <Chip
                                                key={index}
                                                label={url.split('/').pop() || `File ${index + 1}`}
                                                onDelete={() => handleRemoveAttachment(url)}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ 
                                                    borderRadius: 1.5,
                                                    fontSize: 11,
                                                    height: 24,
                                                    '& .MuiChip-label': {
                                                        px: 1
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: 3, 
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'grey.200',
                    bgcolor: 'grey.50'
                }}>
                    <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'flex-end' }}>
                        <CustomButton
                            onClick={() => setEmailModalOpen(false)}
                            type="button"
                            disabled={emailFormLoading}
                            appearance="outlined"
                            sx={{ borderRadius: 2 }}
                            fullWidth={false}
                        >
                            Cancel
                        </CustomButton>
                        <CustomButton
                            onClick={handleSaveAsDraft}
                            type="button"
                            disabled={emailFormLoading}
                            appearance="outlined"
                            sx={{ borderRadius: 2 }}
                            fullWidth={false}
                        >
                            Save as Draft
                        </CustomButton>
                        <CustomButton
                            onClick={handleEmailFormSubmit}
                            type="button"
                            disabled={emailFormLoading}
                            icon={emailFormLoading ? <CircularProgress size={16} /> : null}
                            sx={{ borderRadius: 2 }}
                            fullWidth={false}
                        >
                            {emailFormLoading ? 'Sending...' : 'Send Campaign'}
                        </CustomButton>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Email Campaign View Modal */}
            <Dialog
                open={emailViewModalOpen}
                onClose={() => {
                    setEmailViewModalOpen(false);
                    setSelectedEmailCampaign(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Email Campaign Details
                </DialogTitle>
                
                <DialogContent sx={{ pt: 2 }}>
                    {selectedEmailCampaign && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Subject */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Subject</Typography>
                                <Typography variant="body1" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    {selectedEmailCampaign.subject}
                                </Typography>
                            </Box>

                            {/* Recipients */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Recipients</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {selectedEmailCampaign.to.map((email, index) => (
                                        <Chip
                                            key={index}
                                            label={email}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>

                            {/* CC */}
                            {selectedEmailCampaign.cc && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>CC</Typography>
                                    <Typography variant="body1" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        {selectedEmailCampaign.cc}
                                    </Typography>
                                </Box>
                            )}

                            {/* Status */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Status</Typography>
                                <Chip
                                    label={selectedEmailCampaign.status}
                                    size="small"
                                    color={
                                        selectedEmailCampaign.status === 'sent' ? 'success' :
                                        selectedEmailCampaign.status === 'queued' ? 'warning' :
                                        selectedEmailCampaign.status === 'failed' ? 'error' : 'default'
                                    }
                                />
                            </Box>

                            {/* Created At */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Created At</Typography>
                                <Typography variant="body1" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    {dayjs(selectedEmailCampaign.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                                </Typography>
                            </Box>


                            {/* Attachments */}
                            {selectedEmailCampaign.attachments && selectedEmailCampaign.attachments.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Attachments</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {selectedEmailCampaign.attachments.map((attachment, index) => (
                                            <Chip
                                                key={index}
                                                label={attachment}
                                                size="small"
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Email Body */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Email Content</Typography>
                                <Box 
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: 'grey.50', 
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.300',
                                        minHeight: 200,
                                        maxHeight: 400,
                                        overflow: 'auto'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: selectedEmailCampaign.body }}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 2 }}>
                    <CustomButton
                        onClick={() => {
                            setEmailViewModalOpen(false);
                            setSelectedEmailCampaign(null);
                        }}
                        type="button"
                    >
                        Close
                    </CustomButton>
                </DialogActions>
            </Dialog>

            {/* Send Draft Confirmation Modal */}
            <CommonModal
                open={sendDraftModalOpen}
                onClose={() => {
                    setSendDraftModalOpen(false);
                    setSelectedDraftCampaign(null);
                }}
                size="sm"
                title="Send Email Campaign"
            >
                <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
                    Are you sure you want to send this email campaign "{selectedDraftCampaign?.subject}"? This action will send the email to all recipients and cannot be undone.
                </Typography>

                <Box display="flex" gap={2}>
                    <CustomButton
                        appearance="outlined"
                        buttonType="cancel"
                        onClick={() => {
                            setSendDraftModalOpen(false);
                            setSelectedDraftCampaign(null);
                        }}
                        disabled={sendDraftLoading}
                        sx={{ minWidth: 100 }}
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        appearance="filled"
                        onClick={confirmSendDraft}
                        loading={sendDraftLoading}
                        sx={{ minWidth: 100 }}
                    >
                        Send Email
                    </CustomButton>
                </Box>
            </CommonModal>
        </Box>
    );
};

export default PromoTabs; 