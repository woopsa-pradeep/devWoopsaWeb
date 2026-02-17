import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  useMediaQuery,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import { useEffect, useState, useMemo } from "react";
import EditIcon from "@mui/icons-material/Edit";
import {
  getSalesCategories,
  updateSalesCategory,
  getItemGroups,
  createItemGroup,
  updateItemGroup,
  getBrands,
  createBrand,
  updateBrand,
  getPriceClasses,
  updatePriceClass,
  getSalesCategoryGroupsForPriceClass,
} from "../../../redux/apis/distrubutor/settingApis";

import CommonModal from "../../../component/atoms/CommonModal";
import CustomButton from "../../../component/atoms/CustomButton";
import SwitchInput from "../../../component/atoms/SwitchInput";
import TextInput from "../../../component/atoms/TextInput";
import { showSuccessToast, showErrorToast } from "../../../utils/toastUtils";
import { useForm, Controller } from "react-hook-form";

interface SalesCategory {
  Sales_Category: number;
  Category_Desc: string;
  category_taxrate: number;
  Allow_Price_Change: boolean;
  Allow_Price_Change_Remote: boolean;
}

interface SalesCategoryForm {
  Category_Desc: string;
  category_taxrate: number;
  Allow_Price_Change: boolean;
  Allow_Price_Change_Remote: boolean;
}
interface ItemGroup {
  Item_GroupID: number;
  Item_GroupDescription: string;
}

interface ItemGroupForm {
  Item_GroupID: string; // only for CREATE
  Item_GroupDescription: string;
}
interface Brand {
  Brand_ID: number;
  Brand_Family: string;
  Brand_ReceivedStamped: boolean;
  Brand_PM_Status: string;
}
interface PriceClass {
  Price_Class_ID: number;
  Class_Desc: string;
  Rebate_Amount: number;
  SelectionVisible: boolean;
  Allow_Price_Change: boolean;
  Allow_Price_Change_Remote: boolean;
  Sales_Category_Group: string;
  Product_ExpDays: number;
}

interface SalesCategoryGroup {
  value: string;
  label: string;
}

const InventorySettings = ({ activeTab }: { activeTab: number }) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  /* ---------- SALES CATEGORY ---------- */
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<SalesCategory | null>(null);
  const {
    register: registerSales,
    handleSubmit: handleSubmitSales,
    reset: resetSales,
    control: controlSales,
  } = useForm<SalesCategoryForm>();

  /* ---------- ITEM GROUP ---------- */
  const [itemGroupLoading, setItemGroupLoading] = useState(false);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
  const [itemGroupOpen, setItemGroupOpen] = useState(false);
  const {
    register: registerGroup,
    handleSubmit: handleSubmitGroup,
    reset: resetGroup,
  } = useForm<ItemGroupForm>();

  /* ---------- BRANDS ---------- */
  const [brandLoading, setBrandLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const {
    register: registerBrand,
    handleSubmit: handleSubmitBrand,
    reset: resetBrand,
    control: controlBrand,
    formState: { errors: brandErrors },
  } = useForm<Brand>({
    defaultValues: {
      Brand_Family: "",
      Brand_PM_Status: "",
      Brand_ReceivedStamped: false,
    },
  });

  /* ---------- PRICE CLASS ---------- */
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceClasses, setPriceClasses] = useState<PriceClass[]>([]);
  const [editingPriceClass, setEditingPriceClass] = useState<PriceClass | null>(
    null,
  );
  const [priceEditOpen, setPriceEditOpen] = useState(false);
  const [salesCategoryGroups, setSalesCategoryGroups] = useState<
    SalesCategoryGroup[]
  >([]);
  const {
    register: registerPrice,
    handleSubmit: handleSubmitPrice,
    reset: resetPrice,
    control: controlPrice,
    formState: { errors: priceErrors },
  } = useForm<PriceClass>({
    defaultValues: {
      Class_Desc: "",
      Rebate_Amount: 0,
      SelectionVisible: false,
      Allow_Price_Change: false,
      Allow_Price_Change_Remote: false,
      Sales_Category_Group: "",
      Product_ExpDays: 0,
    },
  });

  const fetchSalesCategories = async () => {
    try {
      setSalesLoading(true);

      const res: any = await getSalesCategories();
      console.log("API response ", res.data.data);
      const normalized: SalesCategory[] = (res?.data?.data || []).map(
        (item: any) => ({
          Sales_Category: Number(item.Sales_Category),
          Category_Desc: item.Category_Desc ?? "",

          category_taxrate: Number(item.category_taxrate ?? 0),

          Allow_Price_Change: Boolean(item.Allow_Price_Change),
          Allow_Price_Change_Remote: Boolean(item.Allow_Price_Change_Remote),
        }),
      );

      setSalesCategories(normalized);
    } catch {
      showErrorToast("Failed to load sales categories");
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchItemGroups = async () => {
    try {
      setItemGroupLoading(true);
      const data = await getItemGroups();
      setItemGroups(data);
    } catch (error) {
      console.error("Error fetching item groups:", error);
      showErrorToast("Failed to load item groups");
    } finally {
      setItemGroupLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      setBrandLoading(true);
      const data = await getBrands();
      setBrands(data ?? []);
    } catch {
      showErrorToast("Failed to load brands");
    } finally {
      setBrandLoading(false);
    }
  };

  const fetchPriceClasses = async () => {
    try {
      setPriceLoading(true);
      const data = await getPriceClasses();

      const normalized: PriceClass[] = (data ?? []).map((pc: any) => ({
        Price_Class_ID: Number(pc.Price_Class_ID),
        Class_Desc: pc.Class_Desc ?? "",
        Rebate_Amount: Number(pc.Rebate_Amount ?? 0),
        SelectionVisible: Boolean(pc.SelectionVisible),
        Allow_Price_Change: Boolean(pc.Allow_Price_Change),
        Allow_Price_Change_Remote: Boolean(pc.Allow_Price_Change_Remote),
        Sales_Category_Group: String(pc.Sales_Category_Group ?? ""),
        Product_ExpDays: Number(pc.Product_ExpDays ?? 0),
      }));

      setPriceClasses(normalized);
    } catch {
      showErrorToast("Failed to load price classes");
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchSalesCategoryGroups = async () => {
    try {
      const data = await getSalesCategoryGroupsForPriceClass();

      const mapped = data.map((item) => ({
        value: String(item.Sales_Category),
        label: item.Category_Desc,
      }));

      setSalesCategoryGroups(mapped);
    } catch {
      showErrorToast("Failed to load sales category groups");
    }
  };

  useEffect(() => {
    if (activeTab === 0) fetchSalesCategories();
    if (activeTab === 1) fetchItemGroups();
    if (activeTab === 2) fetchBrands();
    if (activeTab === 3) {
      fetchPriceClasses();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSalesCategoryGroups();
  }, []);

  const buildPriceClassPayload = (
    pc: PriceClass,
    overrides: Partial<PriceClass> = {},
  ) => ({
    Class_Desc: overrides.Class_Desc ?? pc.Class_Desc,
    Rebate_Amount: overrides.Rebate_Amount ?? pc.Rebate_Amount,

    SelectionVisible: overrides.SelectionVisible ?? pc.SelectionVisible,

    Allow_Price_Change: overrides.Allow_Price_Change ?? pc.Allow_Price_Change,

    Allow_Price_Change_Remote:
      overrides.Allow_Price_Change_Remote ?? pc.Allow_Price_Change_Remote,

    Sales_Category_Group:
      overrides.Sales_Category_Group ?? pc.Sales_Category_Group,

    Product_ExpDays: overrides.Product_ExpDays ?? pc.Product_ExpDays,
  });

  const salesCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    salesCategoryGroups.forEach((g: SalesCategoryGroup) => {
      map[g.value] = g.label;
    });
    return map;
  }, [salesCategoryGroups]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* ================= SALES CATEGORY TAB ================= */}
        {activeTab === 0 && (
          <>
            {salesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{ maxHeight: 600, overflowY: "auto" }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Category
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Tax Rate
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Price Change
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Remote Price Change
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {salesCategories.map((item: SalesCategory) => (
                      <TableRow key={item.Sales_Category} hover>
                        <TableCell>{item.Category_Desc}</TableCell>
                        <TableCell>{item.category_taxrate}%</TableCell>

                        {/* Price Change */}
                        <TableCell>
                          <SwitchInput
                            checked={item.Allow_Price_Change}
                            onChange={async (v) => {
                              try {
                                await updateSalesCategory(item.Sales_Category, {
                                  Allow_Price_Change: v,
                                });
                                showSuccessToast("Updated");
                                fetchSalesCategories();
                              } catch {
                                showErrorToast("Update failed");
                              }
                            }}
                            isShowLabel={false}
                          />
                        </TableCell>

                        {/*  Remote Price Change */}
                        <TableCell>
                          <SwitchInput
                            checked={item.Allow_Price_Change_Remote}
                            onChange={async (v) => {
                              try {
                                await updateSalesCategory(item.Sales_Category, {
                                  Allow_Price_Change_Remote: v,
                                });
                                showSuccessToast("Updated");
                                fetchSalesCategories();
                              } catch {
                                showErrorToast("Update failed");
                              }
                            }}
                            isShowLabel={false}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            onClick={() => {
                              setSelectedCategory(item);
                              resetSales({
                                Category_Desc: item.Category_Desc,
                                category_taxrate: item.category_taxrate,
                                Allow_Price_Change: item.Allow_Price_Change,
                                Allow_Price_Change_Remote:
                                  item.Allow_Price_Change_Remote,
                              });
                              setEditOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Edit Sales Category Modal */}
            <CommonModal
              open={editOpen}
              onClose={() => setEditOpen(false)}
              title="Edit Sales Category"
            >
              <form
                onSubmit={handleSubmitSales(async (data) => {
                  if (!selectedCategory) return;

                  await updateSalesCategory(
                    selectedCategory.Sales_Category,
                    data,
                  );
                  showSuccessToast("Category updated");
                  setEditOpen(false);
                  fetchSalesCategories();
                })}
              >
                <TextInput
                  label="Category Name"
                  {...registerSales("Category_Desc", { required: true })}
                />
                <TextInput
                  label="Tax Rate"
                  type="number"
                  inputProps={{ min: 0 }}
                  {...registerSales("category_taxrate", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Tax Rate cannot be less than 0",
                    },
                    validate: (v) => v >= 0 || "Tax Rate cannot be negative",
                  })}
                />

                <Controller
                  name="Allow_Price_Change"
                  control={controlSales}
                  render={({ field }) => (
                    <SwitchInput
                      label="Allow Price Change"
                      checked={field.value}
                      onChange={field.onChange}
                      isShowLabel={false}
                    />
                  )}
                />

                <Controller
                  name="Allow_Price_Change_Remote"
                  control={controlSales}
                  render={({ field }) => (
                    <SwitchInput
                      label="Allow Remote Price Change"
                      checked={field.value}
                      onChange={field.onChange}
                      isShowLabel={false}
                    />
                  )}
                />

                <CustomButton type="submit">Save</CustomButton>
              </form>
            </CommonModal>
          </>
        )}

        {/* ================= ITEM GROUP TAB ================= */}
        {activeTab === 1 && (
          <>
            {/* Add Button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: -3,
                mb: 1,
              }}
            >
              <CustomButton
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{
                  width: "auto",
                  minWidth: "unset",
                  px: 2,
                }}
                onClick={() => {
                  setEditingGroup(null);
                  resetGroup({
                    Item_GroupID: "",
                    Item_GroupDescription: "",
                  });
                  setItemGroupOpen(true);
                }}
              >
                + Add Item Group
              </CustomButton>
            </Box>

            {/* List */}
            {itemGroupLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 600,
                  overflowY: "auto",
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Group ID
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Description
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {itemGroups.map((group: ItemGroup) => (
                      <TableRow key={group.Item_GroupID} hover>
                        <TableCell>{group.Item_GroupID}</TableCell>
                        <TableCell>{group.Item_GroupDescription}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => {
                              setEditingGroup(group);
                              resetGroup({
                                Item_GroupID: String(group.Item_GroupID),
                                Item_GroupDescription:
                                  group.Item_GroupDescription,
                              });
                              setItemGroupOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {/* Modal */}
            <CommonModal
              open={itemGroupOpen}
              onClose={() => setItemGroupOpen(false)}
              title={editingGroup ? "Edit Item Group" : "Add Item Group"}
            >
              <form
                onSubmit={handleSubmitGroup(async (data) => {
                  if (editingGroup) {
                    await updateItemGroup(editingGroup.Item_GroupID, {
                      Item_GroupDescription: data.Item_GroupDescription,
                    });
                  } else {
                    await createItemGroup(data);
                  }

                  showSuccessToast("Saved");
                  setItemGroupOpen(false);
                  fetchItemGroups();
                })}
              >
                {!editingGroup && (
                  <TextInput
                    label="Group ID"
                    {...registerGroup("Item_GroupID", { required: true })}
                  />
                )}

                <TextInput
                  label="Description"
                  {...registerGroup("Item_GroupDescription", {
                    required: true,
                  })}
                />

                <CustomButton type="submit">Save</CustomButton>
              </form>
            </CommonModal>
          </>
        )}
        {/* Brands tabs  */}
        {activeTab === 2 && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: -3,
                mb: 1,
              }}
            >
              <CustomButton
                appearance="filled"
                size="small"
                fullWidth={false}
                sx={{
                  width: "auto",
                  minWidth: "unset",
                  px: 2,
                }}
                onClick={() => {
                  setEditingBrand(null);
                  resetBrand({
                    Brand_Family: "",
                    Brand_ReceivedStamped: false,
                    Brand_PM_Status: "",
                  });
                  setBrandOpen(true);
                }}
              >
                + Add Brand
              </CustomButton>
            </Box>

            {/* Brand List */}
            {brandLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 600,
                  overflowY: "auto",
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Brand
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        PM Status
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Received
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {brands.map((brand: Brand) => (
                      <TableRow key={brand.Brand_ID} hover>
                        <TableCell>{brand.Brand_Family}</TableCell>
                        <TableCell>{brand.Brand_PM_Status}</TableCell>
                        <TableCell>
                          <SwitchInput
                            checked={brand.Brand_ReceivedStamped}
                            onChange={async (v) => {
                              try {
                                await updateBrand(brand.Brand_ID, {
                                  Brand_Family: brand.Brand_Family,
                                  Brand_ReceivedStamped: v,
                                  Brand_PM_Status: brand.Brand_PM_Status,
                                });

                                showSuccessToast("Updated");
                                fetchBrands();
                              } catch {
                                showErrorToast("Update failed");
                              }
                            }}
                            isShowLabel={false}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => {
                              setEditingBrand(brand);
                              resetBrand(brand);
                              setBrandOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Brand Modal */}
            <CommonModal
              open={brandOpen}
              onClose={() => setBrandOpen(false)}
              title={editingBrand ? "Edit Brand" : "Add Brand"}
            >
              <form
                onSubmit={handleSubmitBrand(async (data) => {
                  try {
                    if (editingBrand) {
                      await updateBrand(editingBrand.Brand_ID, data);
                    } else {
                      await createBrand(data);
                    }

                    showSuccessToast("Brand saved");
                    setBrandOpen(false);
                    fetchBrands();
                  } catch {
                    showErrorToast("Failed to save brand");
                  }
                })}
              >
                <TextInput
                  label="Brand Family"
                  {...registerBrand("Brand_Family", {
                    required: "Brand Family is required",
                    validate: (v) =>
                      v.trim() !== "" || "Brand_Family cannot be empty",
                  })}
                  error={!!brandErrors.Brand_Family}
                  helperText={brandErrors.Brand_Family?.message}
                />

                <TextInput
                  label="PM Status"
                  {...registerBrand("Brand_PM_Status", {
                    validate: (v) =>
                      v === undefined ||
                      v === "" ||
                      typeof v === "string" ||
                      "Brand_PM_Status must be a string",
                  })}
                  error={!!brandErrors.Brand_PM_Status}
                  helperText={brandErrors.Brand_PM_Status?.message}
                />

                <Controller
                  name="Brand_ReceivedStamped"
                  control={controlBrand}
                  render={({ field }) => (
                    <SwitchInput
                      checked={!!field.value}
                      onChange={field.onChange}
                      isShowLabel={false}
                    />
                  )}
                />

                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <CustomButton type="submit">Save</CustomButton>
                </Box>
              </form>
            </CommonModal>
          </>
        )}
        {activeTab === 3 && (
          <>
            {/* Mobile hint */}
            {isMobile && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Swipe left to see more →
              </Typography>
            )}
            {priceLoading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  width: "100%",
                  maxHeight: 600,
                  overflowX: "auto",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { height: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#b0b0b0",
                    borderRadius: 4,
                  },
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 160,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Class
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 90,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Rebate
                      </TableCell>

                      <TableCell
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 160,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Category Group
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 110,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Expiry
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 90,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Visible
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 120,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Price
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 130,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Remote
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "#3f748f",
                          color: "#fff",
                          minWidth: 70,
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        Edit
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceClasses.map((pc: PriceClass) => (
                      <TableRow key={pc.Price_Class_ID} hover>
                        <TableCell>{pc.Class_Desc}</TableCell>

                        <TableCell align="center">{pc.Rebate_Amount}</TableCell>

                        <TableCell>
                          {salesCategoryMap[pc.Sales_Category_Group] ??
                            pc.Sales_Category_Group}
                        </TableCell>

                        <TableCell align="center">
                          {pc.Product_ExpDays}
                        </TableCell>

                        {/* Visible */}
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center">
                            <SwitchInput
                              checked={pc.SelectionVisible}
                              onChange={async (v) => {
                                try {
                                  await updatePriceClass(
                                    pc.Price_Class_ID,
                                    buildPriceClassPayload(pc, {
                                      SelectionVisible: v,
                                    }),
                                  );
                                  showSuccessToast("Updated");
                                  fetchPriceClasses();
                                } catch {
                                  showErrorToast("Update failed");
                                }
                              }}
                              isShowLabel={false}
                              size="small"
                            />
                          </Box>
                        </TableCell>

                        {/* Price Change */}
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center">
                            <SwitchInput
                              checked={pc.Allow_Price_Change}
                              onChange={async (v) => {
                                try {
                                  await updatePriceClass(
                                    pc.Price_Class_ID,
                                    buildPriceClassPayload(pc, {
                                      Allow_Price_Change: v,
                                    }),
                                  );
                                  showSuccessToast("Updated");
                                  fetchPriceClasses();
                                } catch {
                                  showErrorToast("Update failed");
                                }
                              }}
                              isShowLabel={false}
                              size="small"
                            />
                          </Box>
                        </TableCell>

                        {/* Remote Change */}
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center">
                            <SwitchInput
                              checked={pc.Allow_Price_Change_Remote}
                              onChange={async (v) => {
                                try {
                                  await updatePriceClass(
                                    pc.Price_Class_ID,
                                    buildPriceClassPayload(pc, {
                                      Allow_Price_Change_Remote: v,
                                    }),
                                  );
                                  showSuccessToast("Updated");
                                  fetchPriceClasses();
                                } catch {
                                  showErrorToast("Update failed");
                                }
                              }}
                              isShowLabel={false}
                              size="small"
                            />
                          </Box>
                        </TableCell>

                        {/* Edit */}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingPriceClass(pc);
                              resetPrice(pc);
                              setPriceEditOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* EDIT PRICE CLASS MODAL */}
            <CommonModal
              open={priceEditOpen}
              onClose={() => setPriceEditOpen(false)}
              title="Edit Price Class"
            >
              <Box
                display="flex"
                flexDirection="column"
                gap={2}
                maxHeight="70vh"
                overflow="auto"
              >
                <form
                  onSubmit={handleSubmitPrice(async (data) => {
                    if (!editingPriceClass) return;

                    const payload = {
                      Class_Desc: data.Class_Desc,
                      Rebate_Amount: data.Rebate_Amount,
                      SelectionVisible: data.SelectionVisible,
                      Allow_Price_Change: data.Allow_Price_Change,
                      Allow_Price_Change_Remote: data.Allow_Price_Change_Remote,
                      Sales_Category_Group: data.Sales_Category_Group,
                      Product_ExpDays: data.Product_ExpDays,
                    };

                    await updatePriceClass(
                      editingPriceClass.Price_Class_ID,
                      payload,
                    );

                    showSuccessToast("Updated");
                    setPriceEditOpen(false);
                    fetchPriceClasses();
                  })}
                >
                  <TextInput
                    label="Class Description"
                    {...registerPrice("Class_Desc", {
                      validate: (v) =>
                        !v ||
                        typeof v === "string" ||
                        "Class_Desc must be a string",
                    })}
                    error={!!priceErrors.Class_Desc}
                    helperText={priceErrors.Class_Desc?.message}
                  />

                  <TextInput
                    label="Rebate Amount"
                    type="number"
                    inputProps={{ min: 0 }}
                    {...registerPrice("Rebate_Amount", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Rebate Amount cannot be less than 0",
                      },
                      validate: (v) =>
                        v >= 0 || "Rebate Amount cannot be negative",
                    })}
                    error={!!priceErrors.Rebate_Amount}
                    helperText={priceErrors.Rebate_Amount?.message}
                  />

                  <Controller
                    name="Sales_Category_Group"
                    control={controlPrice}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!priceErrors.Sales_Category_Group}
                      >
                        <InputLabel>Sales Category Group</InputLabel>
                        <Select
                          label="Sales Category Group"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        >
                          {salesCategoryGroups.map((group) => (
                            <MenuItem key={group.value} value={group.value}>
                              {group.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <TextInput
                    label="Product Expiry Days"
                    type="number"
                    inputProps={{ min: 0 }}
                    {...registerPrice("Product_ExpDays", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Product Expiry Days cannot be less than 0",
                      },
                      validate: (v) =>
                        Number.isInteger(v) ||
                        "Product Expiry Days must be an integer",
                    })}
                    error={!!priceErrors.Product_ExpDays}
                    helperText={priceErrors.Product_ExpDays?.message}
                  />

                  <Controller
                    name="SelectionVisible"
                    control={controlPrice}
                    render={({ field }) => (
                      <SwitchInput
                        label="Selection Visible"
                        checked={!!field.value}
                        onChange={field.onChange}
                        isShowLabel={false}
                      />
                    )}
                  />

                  <Controller
                    name="Allow_Price_Change"
                    control={controlPrice}
                    render={({ field }) => (
                      <SwitchInput
                        label="Allow Price Change"
                        checked={!!field.value}
                        onChange={field.onChange}
                        isShowLabel={false}
                      />
                    )}
                  />

                  <Controller
                    name="Allow_Price_Change_Remote"
                    control={controlPrice}
                    render={({ field }) => (
                      <SwitchInput
                        label="Allow Remote Price Change"
                        checked={!!field.value}
                        onChange={field.onChange}
                        isShowLabel={false}
                      />
                    )}
                  />

                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    gap={1.5}
                    mt={2}
                  >
                    <CustomButton
                      appearance="outlined"
                      type="button"
                      onClick={() => setPriceEditOpen(false)}
                    >
                      Cancel
                    </CustomButton>

                    <CustomButton appearance="filled" type="submit">
                      Save
                    </CustomButton>
                  </Box>
                </form>
              </Box>
            </CommonModal>
          </>
        )}
      </Box>
    </Box>
  );
};

export default InventorySettings;
