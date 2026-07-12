import { useLocalSearchParams } from 'expo-router';

import { OrderConfirmationScreen } from '@/features/checkout/screens/OrderConfirmationScreen';

export default function OrderConfirmationRoute() {
  const { currency = 'USD', orderNumber = '', total = '0' } = useLocalSearchParams<{
    currency?: string;
    orderNumber?: string;
    total?: string;
  }>();

  return (
    <OrderConfirmationScreen
      currency={currency}
      orderNumber={orderNumber}
      total={Number(total)}
    />
  );
}
