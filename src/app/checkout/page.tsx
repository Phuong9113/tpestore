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
import { api } from "@/lib/api";
import { PayPalProvider } from "@/components/PayPalProvider";
import { PayPalButton } from "@/components/PayPalButton";

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

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tpestore_token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để tiếp tục');
      router.push('/login');
      return;
    }
  }, [router]);


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

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PAYPAL">("COD");
  const [deliverOption, setDeliverOption] = useState<
    "xfast" | "fast" | "standard"
  >("xfast");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Shipping fee
  const [shippingFee, setShippingFee] = useState<ShippingFee | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [isAddressChanging, setIsAddressChanging] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (shippingInfo.province) {
      setIsAddressChanging(true);
      loadDistricts(shippingInfo.province);
      setDistricts([]);
      setWards([]);
      setShippingInfo((prev) => ({ ...prev, district: "", ward: "" }));
      // Clear shipping fee when province changes
      setShippingFee(null);
    }
  }, [shippingInfo.province]);

  // Load wards when district changes
  useEffect(() => {
    if (shippingInfo.district) {
      setIsAddressChanging(true);
      loadWards(shippingInfo.district);
      setWards([]);
      setShippingInfo((prev) => ({ ...prev, ward: "" }));
      // Clear shipping fee when district changes
      setShippingFee(null);
    }
  }, [shippingInfo.district]);

  // Calculate shipping fee when address is complete
  useEffect(() => {
    if (shippingInfo.province && shippingInfo.district && shippingInfo.ward) {
      // Clear previous shipping fee to prevent showing old values
      setShippingFee(null);
      // Use setTimeout to ensure state is cleared before calculating
      setTimeout(() => {
        calculateShippingFee();
        setIsAddressChanging(false);
      }, 50);
    }
  }, [
    shippingInfo.province,
    shippingInfo.district,
    shippingInfo.ward,
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
    } catch (error) {
      console.error("Error loading districts:", error);
      toast.error("Không thể tải danh sách quận/huyện");
    }
  };

  const loadWards = async (districtId: string) => {
    try {
      const response = await api.get(`/shipping/wards/${districtId}`);
      // GHN API returns { code, message, data: [...] }
      const wardsData = response.data?.data || response.data || [];
      setWards(wardsData);
    } catch (error) {
      console.error("Error loading wards:", error);
      toast.error("Không thể tải danh sách phường/xã");
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

      const response = await api.post("/shipping/calculate-fee", {
        fromDistrictId: "1442",
        toDistrictId: shippingInfo.district,
        toWardCode: shippingInfo.ward,
        weight: 200,
        codAmount: totalPrice,
        items: shippingItems // Send items array for auto service type selection
      });

      console.log("GHN API response:", response);
      const shippingData = response.data || response;
      setShippingFee(shippingData);
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

    if (
      !shippingInfo.name ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.province ||
      !shippingInfo.district ||
      !shippingInfo.ward
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    // Validate phone number format (Vietnamese phone number)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(shippingInfo.phone)) {
      toast.error("Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }

    try {
      setLoading(true);

      // Create order
      const orderData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingInfo: {
          ...shippingInfo,
          shippingFee: shippingFee?.total || 0,
        },
        paymentMethod,
        deliverOption,
      };

      console.log("Creating order with data:", orderData);
      let response;
      try {
        response = await api.post("/orders", orderData);
        console.log("Order creation response:", response);
      } catch (error: any) {
        console.error("Error creating order:", error);
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

      if (paymentMethod === "COD") {
        // COD - create shipping order
        try {
          console.log("Creating shipping order for COD...");
          const shippingResponse = await api.post("/shipping/create-order", {
            toName: shippingInfo.name,
            toPhone: shippingInfo.phone,
            toAddress: shippingInfo.address,
            toWardCode: shippingInfo.ward,
            toDistrictId: shippingInfo.district,
            toProvinceId: shippingInfo.province,
            codAmount: totalPrice + (shippingFee?.total || 0),
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
      }
      // For PayPal, we'll show the PayPal button instead of redirecting
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

  const handlePayPalSuccess = (orderId: string) => {
    clearCart();
    router.push("/profile?tab=orders");
  };

  const handlePayPalError = (error: string) => {
    toast.error(error);
  };

  const formatVND = (value: number | undefined) =>
    (value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

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
                    placeholder="Nhập email (không bắt buộc)"
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
                      disabled={
                        !shippingInfo.province || districts.length === 0
                      }
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
                  onValueChange={(value: "COD" | "PAYPAL") =>
                    setPaymentMethod(value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="COD" id="cod" />
                    <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PAYPAL" id="paypal" />
                    <Label htmlFor="paypal">Thanh toán qua PayPal</Label>
                  </div>
                </RadioGroup>
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

                {paymentMethod === "COD" ? (
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
                    {loading ? "Đang xử lý..." : "Đặt hàng COD"}
                  </Button>
                ) : (
                  <div className="space-y-4">
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
                      {loading ? "Đang tạo đơn hàng..." : "Tạo đơn hàng PayPal"}
                    </Button>

                    {createdOrderId && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Thanh toán PayPal</h4>
                        <PayPalProvider>
                          <PayPalButton
                            orderId={createdOrderId}
                            totalAmount={totalPrice + (shippingFee?.total || 0)}
                            onSuccess={handlePayPalSuccess}
                            onError={handlePayPalError}
                          />
                        </PayPalProvider>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
