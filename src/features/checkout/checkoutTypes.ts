export type CheckoutDetails = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};

export type CheckoutErrors = Partial<Record<keyof CheckoutDetails, string>>;

export type OrderRequest = {
  customer: CheckoutDetails;
  items: {
    productId: string;
    quantity: number;
  }[];
};

export type OrderResult = {
  id: string;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
};
