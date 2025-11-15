"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { api, fetchAddresses, createAddress, type Address as AddressType } from "@/lib/api";
import { me } from "@/lib/auth";

interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

interface District {
  DistrictID: number;
  DistrictName: string;
}

interface Ward {
  WardCode: string;
  WardName: string;
}

interface ShippingFee {
  fee: number;
  insurance_fee: number;
  total: number;
  estimated_deliver_time: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();



  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    hamlet: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ZALOPAY">("COD");
  const [deliverOption, setDeliverOption] = useState<
    "xfast" | "fast" | "standard"
  >("xfast");
  // ZaloPay preferred method per Gateway doc
  const [zlpMethod, setZlpMethod] = useState<
    "gateway" | "vietqr" | "international_card" | "domestic_card_account" | "zalopay_wallet" | "bnpl"
  >("gateway");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Address management
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Shipping fee
  const [shippingFee, setShippingFee] = useState<ShippingFee | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [isAddressChanging, setIsAddressChanging] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication first
  useEffect(() => {
    const token = localStorage.getItem('tpestore_token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Load provinces and addresses on mount (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    loadProvinces();
    loadAddresses();
  }, [isAuthenticated]);

  // Load saved addresses
  const loadAddresses = async () => {
    try {
      const token = localStorage.getItem('tpestore_token');
      if (!token) return; // Don't load if no token
      
      const savedAddresses = await fetchAddresses();
      setAddresses(savedAddresses);
      // Set default address if exists
      const defaultAddress = savedAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        populateAddressInfo(defaultAddress);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      // If it's a 401, user is not authenticated, redirect
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('tpestore_token');
        router.push('/login');
      }
    }
  };

  // Populate form when address is selected
  const populateAddressInfo = async (address: AddressType) => {
    console.log("Populating address info from:", address);
    console.log("Address has province:", address.province, "district:", address.district, "ward:", address.ward);
    console.log("Address has provinceName:", address.provinceName, "districtName:", address.districtName, "wardName:", address.wardName);
    
    // Use stored IDs directly if available
    let provinceId = address.province || "";
    
    // If not, try to find by name
    if (!provinceId && address.provinceName && provinces.length > 0) {
      const foundProvince = provinces.find(p => p.ProvinceName === address.provinceName);
      if (foundProvince) {
        provinceId = foundProvince.ProvinceID.toString();
        console.log("Found province ID by name:", provinceId, "for:", address.provinceName);
      }
    }
    
    // Use stored district and ward IDs directly
    let districtId = address.district || "";
    let wardCode = address.ward || "";
    
    console.log("Initial IDs - province:", provinceId, "district:", districtId, "ward:", wardCode);
    
    // Always load districts if we have provinceId (even if we have districtId)
    let loadedDistricts: District[] = [];
    if (provinceId) {
      console.log("Loading districts for province:", provinceId);
      loadedDistricts = await loadDistricts(provinceId);
    }
    
    // If don't have district ID, try to find by name from loaded districts
    if (!districtId && address.districtName && loadedDistricts.length > 0) {
      const foundDistrict = loadedDistricts.find((d: District) => d.DistrictName === address.districtName);
      if (foundDistrict) {
        districtId = foundDistrict.DistrictID.toString();
        console.log("Found district ID by name:", districtId, "for:", address.districtName);
      }
    }
    
    // Always load wards if we have districtId
    let loadedWards: Ward[] = [];
    if (districtId) {
      console.log("Loading wards for district:", districtId);
      loadedWards = await loadWards(districtId);
      
      // If don't have ward code, try to find by name from loaded wards
      if (!wardCode && address.wardName && loadedWards.length > 0) {
        const foundWard = loadedWards.find((w: Ward) => w.WardName === address.wardName);
        if (foundWard) {
          wardCode = foundWard.WardCode;
          console.log("Found ward code by name:", wardCode, "for:", address.wardName);
        }
      }
    }
    
    // Set all shipping info at once
    console.log("Final IDs being set - province:", provinceId, "district:", districtId, "ward:", wardCode);
    
    setShippingInfo({
      name: address.name,
      phone: address.phone,
      address: address.address,
      province: provinceId,
      district: districtId,
      ward: wardCode,
      hamlet: address.hamlet || "",
      email: shippingInfo.email || "",
    });
    
    console.log("Shipping info set with province:", provinceId, "district:", districtId, "ward:", wardCode);
  };

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  // Populate address info when selectedAddressId changes
  useEffect(() => {
    const loadSelectedAddress = async () => {
      if (selectedAddressId === "new" || selectedAddressId === "" || addresses.length === 0) {
        setIsLoadingSavedAddress(false);
        return;
      }

      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (selectedAddress) {
        setIsLoadingSavedAddress(true);
        await populateAddressInfo(selectedAddress);
        console.log("Address populated, setting isLoadingSavedAddress to false");
        // Small delay to ensure all states are updated
        setTimeout(() => {
          setIsLoadingSavedAddress(false);
          console.log("isLoadingSavedAddress set to false");
        }, 500);
      }
    };

    loadSelectedAddress();
  }, [selectedAddressId, addresses]);

  // Track if we're loading address from saved addresses
  const [isLoadingSavedAddress, setIsLoadingSavedAddress] = useState(false);

  // Load districts when province changes (but not when loading saved address)
  useEffect(() => {
    console.log("useEffect for province change - province:", shippingInfo.province, "isLoadingSavedAddress:", isLoadingSavedAddress);
    if (shippingInfo.province && !isLoadingSavedAddress) {
      console.log("Loading districts because province changed");
      setIsAddressChanging(true);
      loadDistricts(shippingInfo.province);
      // Don't reset district and ward if they already exist
      // Only reset if province actually changed from a different one
    }
  }, [shippingInfo.province, isLoadingSavedAddress]);

  // Load wards when district changes (but not when loading saved address)
  useEffect(() => {
    console.log("useEffect for district change - district:", shippingInfo.district, "isLoadingSavedAddress:", isLoadingSavedAddress);
    if (shippingInfo.district && !isLoadingSavedAddress) {
      console.log("Loading wards because district changed");
      setIsAddressChanging(true);
      loadWards(shippingInfo.district);
      // Don't reset ward if it already exists
      // Only reset if district actually changed from a different one
    }
  }, [shippingInfo.district, isLoadingSavedAddress]);

  // Calculate shipping fee when address is complete
  useEffect(() => {
    console.log("Check calculate shipping - province:", shippingInfo.province, "district:", shippingInfo.district, "ward:", shippingInfo.ward, "isLoadingSavedAddress:", isLoadingSavedAddress);
    if (shippingInfo.province && shippingInfo.district && shippingInfo.ward && !isLoadingSavedAddress) {
      // Clear previous shipping fee to prevent showing old values
      setShippingFee(null);
      // Use setTimeout to ensure state is cleared before calculating
      setTimeout(() => {
        console.log("Calculating shipping fee now");
        calculateShippingFee();
        setIsAddressChanging(false);
      }, 50);
    }
  }, [
    shippingInfo.province,
    shippingInfo.district,
    shippingInfo.ward,
    isLoadingSavedAddress,
  ]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await api.get("/shipping/provinces");
      // GHN API returns { code, message, data: [...] }
      const provincesData = response.data?.data || response.data || [];
      setProvinces(provincesData);
    } catch (error) {
      console.error("Error loading provinces:", error);
      toast.error("Không thể tải danh sách tỉnh/thành phố");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    try {
      const response = await api.get(`/shipping/districts/${provinceId}`);
      // GHN API returns { code, message, data: [...] }
      const districtsData = response.data?.data || response.data || [];
      setDistricts(districtsData);
      return districtsData;
    } catch (error) {
      console.error("Error loading districts:", error);
      toast.error("Không thể tải danh sách quận/huyện");
      return [];
    }
  };

  const loadWards = async (districtId: string) => {
    try {
      const response = await api.get(`/shipping/wards/${districtId}`);
      // GHN API returns { code, message, data: [...] }
      const wardsData = response.data?.data || response.data || [];
      setWards(wardsData);
      return wardsData;
    } catch (error) {
      console.error("Error loading wards:", error);
      toast.error("Không thể tải danh sách phường/xã");
      return [];
    }
  };

  const calculateShippingFee = async () => {
    try {
      setLoadingFee(true);
      // Clear previous shipping fee immediately to prevent showing old values
      setShippingFee(null);
      
      // Prepare items array for shipping calculation
      const shippingItems = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        weight: 200, // Default weight per item
        code: item.id
      }));

      console.log("Calculating shipping fee with:", {
        fromDistrictId: "1442",
        toDistrictId: shippingInfo.district,
        toWardCode: shippingInfo.ward,
        weight: 200,
        codAmount: totalPrice,
        items: shippingItems
      });

      const response = await api.post("/shipping/fee", {
        fromDistrictId: "1442",
        toDistrictId: shippingInfo.district,
        toWardCode: shippingInfo.ward,
        weight: 200,
        codAmount: totalPrice,
        items: shippingItems // Send items array for auto service type selection
      });

      console.log("GHN API response:", response);
      const shippingData = response.data || response;
      console.log("Setting shipping fee:", shippingData);
      setShippingFee(shippingData);
      console.log("Shipping fee set to state");
      toast.success(`Phí vận chuyển: ${formatVND(shippingData.total)}`);
    } catch (error) {
      console.error("Error calculating shipping fee:", error);
      // Fallback to mock fee nếu GHN API fail
      const mockShippingFee = {
        total: 30000,
        service_fee: 30000,
        insurance_fee: 0,
        pick_station_fee: 0,
        coupon_value: 0,
        r2s_fee: 0,
        return_again: 0,
        document_return: 0,
        double_check: 0,
        cod_fee: 0,
        pick_remote_areas_fee: 0,
        deliver_remote_areas_fee: 0,
        cod_failed_fee: 0,
        fee: 30000,
        estimated_deliver_time: "1-2 ngày",
      };
      setShippingFee(mockShippingFee);
      toast.info("Sử dụng phí vận chuyển mặc định: 30,000₫");
    } finally {
      setLoadingFee(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submitting with selectedAddressId:", selectedAddressId);
    console.log("Current shippingInfo:", shippingInfo);
    console.log("Available addresses:", addresses);

    // Check if required fields are filled
    const isFormValid = shippingInfo.name && 
                       shippingInfo.phone && 
                       shippingInfo.address && 
                       shippingInfo.province && 
                       shippingInfo.district && 
                       shippingInfo.ward;

    if (!isFormValid) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      console.error("Validation failed - missing fields:", {
        name: shippingInfo.name,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        province: shippingInfo.province,
        district: shippingInfo.district,
        ward: shippingInfo.ward
      });
      return;
    }

    // Validate phone number format (Vietnamese phone number)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(shippingInfo.phone)) {
      toast.error("Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }

    // No email validation (email optional at checkout)

    try {
      setLoading(true);

      // Find names from IDs
      const provinceName = provinces.find(p => p.ProvinceID.toString() === shippingInfo.province)?.ProvinceName || 
                          shippingInfo.province || 
                          addresses.find(a => a.id === selectedAddressId && a.provinceName)?.provinceName || "";
      const districtName = districts.find(d => d.DistrictID.toString() === shippingInfo.district)?.DistrictName || 
                          shippingInfo.district ||
                          addresses.find(a => a.id === selectedAddressId && a.districtName)?.districtName || "";
      const wardName = wards.find(w => w.WardCode === shippingInfo.ward)?.WardName || 
                      shippingInfo.ward ||
                      addresses.find(a => a.id === selectedAddressId && a.wardName)?.wardName || "";

      // Create order
      const orderData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingInfo: {
          ...shippingInfo,
          provinceName: provinceName,
          districtName: districtName,
          wardName: wardName,
          shippingFee: shippingFee?.total || 0,
        },
        paymentMethod,
        deliverOption,
      };

      console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
      let response;
      try {
        response = await api.post("/orders", orderData);
        console.log("Order creation response:", response);
      } catch (error: any) {
        console.error("Error creating order:", error);
        console.error("Order data that failed:", JSON.stringify(orderData, null, 2));
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem('tpestore_token');
          router.push('/login');
          return;
        } else if (error.message.includes("Products not found")) {
          toast.error("Một số sản phẩm không còn tồn tại. Vui lòng làm mới giỏ hàng.");
          clearCart();
          window.location.reload();
          return;
        } else {
          toast.error("Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.");
          return;
        }
      }
      const orderId = response.id || response.data?.id;
      setCreatedOrderId(orderId);

      // Save address if requested
      if (saveNewAddress && selectedAddressId === "new") {
        try {
          await createAddress({
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            address: shippingInfo.address,
            province: shippingInfo.province,
            district: shippingInfo.district,
            ward: shippingInfo.ward,
            provinceName: provinceName,
            districtName: districtName,
            wardName: wardName,
            hamlet: shippingInfo.hamlet,
            isDefault: false
          });
          toast.success("Địa chỉ đã được lưu");
        } catch (error) {
          console.error("Error saving address:", error);
          // Don't fail the order if address save fails
        }
      }

      if (paymentMethod === "COD") {
        // COD - create shipping order
        try {
          console.log("Creating shipping order for COD...");
          console.log("Shipping info for GHN:", {
            ward: shippingInfo.ward,
            district: shippingInfo.district,
            province: shippingInfo.province,
            address: shippingInfo.address
          });
          const shippingResponse = await api.post("/shipping/order", {
            orderId: orderId, // Link shipping order to database order
            toName: shippingInfo.name,
            toPhone: shippingInfo.phone,
            // KHÔNG truyền toAddress để tránh GHN gọi Google API (chỉ dùng ID: toWardCode, toDistrictId, toProvinceId)
            toWardCode: shippingInfo.ward,
            toDistrictId: shippingInfo.district,
            toProvinceId: shippingInfo.province,
            codAmount: totalPrice,
            content: `Đơn hàng từ TPE Store - ${items.length} sản phẩm`,
            weight: 200, // gram
            // serviceTypeId will be auto-selected by backend based on item count
            length: 20,
            width: 20,
            height: 20,
            items: items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              weight: 200,
              price: item.price,
            })),
          });

          console.log("Shipping order created:", shippingResponse);
          toast.success("Đơn hàng COD đã được tạo thành công!");
          clearCart();
          router.push("/");
        } catch (shippingError) {
          console.error("Error creating shipping order:", shippingError);
          // Order was created successfully, but shipping order failed
          toast.warning("Đơn hàng đã được tạo nhưng có lỗi khi tạo đơn vận chuyển. Vui lòng liên hệ hỗ trợ.");
          clearCart();
          router.push("/profile?tab=orders");
        }
      } else if (paymentMethod === "ZALOPAY") {
        // ZaloPay - create payment order
        try {
          console.log("Creating ZaloPay payment order...");
          const zalopayResponse = await api.post("/zalopay/create-order", {
            orderId: orderId,
            amount: totalPrice + (shippingFee?.total || 0),
            description: `Thanh toán đơn hàng ${orderId}`,
            returnUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
            bankCode: "",
            preferredPaymentMethods:
              zlpMethod === "gateway" ? [] :
              zlpMethod === "vietqr" ? ["vietqr"] :
              zlpMethod === "international_card" ? ["international_card"] :
              zlpMethod === "domestic_card_account" ? ["domestic_card","account"] :
              zlpMethod === "zalopay_wallet" ? ["zalopay_wallet"] :
              zlpMethod === "bnpl" ? ["bnpl"] : []
          });

          console.log("ZaloPay order created:", zalopayResponse);
          const orderUrl = zalopayResponse?.order_url || zalopayResponse?.data?.order_url;

          if (orderUrl) {
            toast.success("Đang chuyển hướng đến ZaloPay...");
            window.location.href = orderUrl;
          } else {
            toast.error("Không thể tạo đơn thanh toán ZaloPay");
          }
        } catch (zalopayError) {
          console.error("Error creating ZaloPay order:", zalopayError);
          toast.error("Có lỗi khi tạo đơn thanh toán ZaloPay. Vui lòng thử lại.");
        }
      }
      // Order created successfully
    } catch (error) {
      console.error("Error creating order:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string" &&
        (error as { message: string }).message.includes("Products not found")
      ) {
        toast.error("Một số sản phẩm trong giỏ hàng không còn tồn tại. Vui lòng làm mới trang và thử lại.");
        // Clear cart and reload to get fresh data
        clearCart();
        window.location.reload();
      } else {
        toast.error("Có lỗi xảy ra khi tạo đơn hàng");
      }
    } finally {
      setLoading(false);
    }
  };


  const formatVND = (value: number | undefined) =>
    (value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Giỏ hàng trống
          </h1>
          <p className="text-muted-foreground mb-6">
            Bạn cần có sản phẩm trong giỏ hàng để thanh toán
          </p>
          <Button onClick={() => router.push("/products")}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address selector - Always show */}
                <div>
                  <Label htmlFor="address-select">
                    {addresses.length > 0 ? "Chọn địa chỉ đã lưu" : "Nhập địa chỉ giao hàng"}
                  </Label>
                  {addresses.length > 0 && (
                    <Select
                      value={selectedAddressId}
                      onValueChange={handleAddressSelect}
                    >
                      <SelectTrigger id="address-select" className="w-full">
                        <SelectValue placeholder="Chọn địa chỉ hoặc nhập mới" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="new">Nhập địa chỉ mới</SelectItem>
                        {addresses.map((address) => {
                          // Don't truncate - let it fill the select width naturally
                          let displayText = address.name + " - " + address.address;
                          
                          // Add (Mặc định) if needed
                          if (address.isDefault) {
                            displayText += " (Mặc định)";
                          }
                          
                          return (
                            <SelectItem key={address.id} value={address.id}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Save address checkbox - only show when entering new address */}
                {selectedAddressId === "new" && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="save-address"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="save-address" className="text-sm cursor-pointer">
                      Lưu địa chỉ này cho lần sau
                    </Label>
                  </div>
                )}

                {/* Address form - Show based on selection */}
                {selectedAddressId === "new" || addresses.length === 0 ? (
                <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      value={shippingInfo.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Nhập email nhận thông báo đơn hàng (không bắt buộc)"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ chi tiết *</Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Số nhà, tên đường, tên khu phố..."
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tỉnh/Thành phố *</Label>
                    <Select
                      value={shippingInfo.province || ""}
                      onValueChange={(value) =>
                        handleInputChange("province", value)
                      }
                      disabled={loadingProvinces}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={`province-${province.ProvinceID}`}
                            value={province.ProvinceID.toString()}
                          >
                            {province.ProvinceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quận/Huyện *</Label>
                    <Select
                      value={shippingInfo.district || ""}
                      onValueChange={(value) =>
                        handleInputChange("district", value)
                      }
                      disabled={!shippingInfo.province || districts.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem
                            key={`district-${district.DistrictID}`}
                            value={district.DistrictID.toString()}
                          >
                            {district.DistrictName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Phường/Xã *</Label>
                    <Select
                      value={shippingInfo.ward || ""}
                      onValueChange={(value) =>
                        handleInputChange("ward", value)
                      }
                      disabled={!shippingInfo.district || wards.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn phường/xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem
                            key={`ward-${ward.WardCode}`}
                            value={ward.WardCode}
                          >
                            {ward.WardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="hamlet">Thôn/Ấp</Label>
                  <Input
                    id="hamlet"
                    value={shippingInfo.hamlet}
                    onChange={(e) =>
                      handleInputChange("hamlet", e.target.value)
                    }
                    placeholder="Nhập thôn/ấp (không bắt buộc)"
                  />
                </div>
                </>
                ) : (
                  <div className="border border-border rounded-lg p-4 bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-3">
                      Thông tin từ địa chỉ đã chọn
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 break-words">
                        <span className="text-sm font-medium text-foreground min-w-[80px]">Họ và tên:</span>
                        <span className="text-sm text-foreground flex-1 break-words">{shippingInfo.name}</span>
                      </div>
                      <div className="flex items-start gap-2 break-words">
                        <span className="text-sm font-medium text-foreground min-w-[80px]">SĐT:</span>
                        <span className="text-sm text-foreground flex-1 break-words">{shippingInfo.phone}</span>
                      </div>
                      <div className="flex items-start gap-2 break-words">
                        <span className="text-sm font-medium text-foreground min-w-[80px]">Địa chỉ:</span>
                        <span className="text-sm text-foreground flex-1 break-words">
                          {shippingInfo.address}
                          {shippingInfo.ward && `, ${shippingInfo.ward}`}
                          {shippingInfo.district && `, ${shippingInfo.district}`}
                          {shippingInfo.province && `, ${shippingInfo.province}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedAddressId("new")}
                        className="text-sm text-primary hover:underline mt-2"
                      >
                        Hoặc nhập địa chỉ mới
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Info Note */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin vận chuyển</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    • Cước vận chuyển sẽ được tính tự động dựa theo số lượng sản phẩm trong đơn hàng.
                  </p>
                  <p>
                    • Nếu dưới 10 sản phẩm: Được phân loại là <span className="font-medium text-foreground">hàng nhẹ</span> với mức phí ship thấp hơn.
                  </p>
                  <p>
                    • Nếu từ 10 sản phẩm trở lên: Được phân loại là <span className="font-medium text-foreground">hàng nặng</span>; mức phí vận chuyển sẽ cao hơn hàng nhẹ.
                  </p>
                  {shippingFee && !loadingFee && !isAddressChanging && (
                    <p className="text-green-600 font-medium">
                      Phí vận chuyển: {formatVND(shippingFee.total)}
                    </p>
                  )}
                  {(loadingFee || isAddressChanging) && (
                    <p className="text-blue-600 font-medium">
                      Đang tính phí vận chuyển...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: "COD" | "ZALOPAY") =>
                    setPaymentMethod(value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="COD" id="cod" />
                    <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ZALOPAY" id="zalopay" />
                    <Label htmlFor="zalopay">Thanh toán bằng ZaloPay</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "ZALOPAY" && (
                  <div className="mt-4 space-y-2">
                    <Label>Hình thức qua Cổng ZaloPay</Label>
                    <RadioGroup
                      value={zlpMethod}
                      onValueChange={(value: any) => setZlpMethod(value)}
                      className="grid grid-cols-1 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gateway" id="zlp-gateway" />
                        <Label htmlFor="zlp-gateway">Để khách chọn trên cổng</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vietqr" id="zlp-vietqr" />
                        <Label htmlFor="zlp-vietqr">ZaloPay QR đa năng (VietQR)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="international_card" id="zlp-intl" />
                        <Label htmlFor="zlp-intl">Thẻ quốc tế</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="domestic_card_account" id="zlp-domestic" />
                        <Label htmlFor="zlp-domestic">Thẻ ATM/Internet Banking</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="zalopay_wallet" id="zlp-wallet" />
                        <Label htmlFor="zlp-wallet">Ví ZaloPay</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bnpl" id="zlp-bnpl" />
                        <Label htmlFor="zlp-bnpl">Trả sau (BNPL)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatVND(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      {formatVND(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span>{formatVND(totalPrice)}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span>
                      {loadingFee || isAddressChanging
                        ? "Đang tính..."
                        : shippingFee
                        ? formatVND(shippingFee.total)
                        : "Chưa chọn địa chỉ"}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span>
                      {loadingFee || isAddressChanging
                        ? "Đang tính..."
                        : formatVND(totalPrice + (shippingFee?.total || 0))}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    loading ||
                    !shippingInfo.province ||
                    !shippingInfo.district ||
                    !shippingInfo.ward
                  }
                >
                  {loading 
                    ? "Đang xử lý..." 
                    : paymentMethod === "COD" 
                      ? "Đặt hàng COD" 
                      : "Thanh toán ZaloPay"
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
