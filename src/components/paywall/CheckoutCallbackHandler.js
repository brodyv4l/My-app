import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useCheckoutCallback } from '../../hooks/useCheckoutCallback';
import { stashCheckoutReturnFromUrl } from '../../services/stripeCheckout';

/** Runs once on web when returning from Stripe Checkout. */
export default function CheckoutCallbackHandler() {
  useLayoutEffect(() => {
    if (Platform.OS === 'web') stashCheckoutReturnFromUrl();
  }, []);

  useCheckoutCallback();
  return null;
}
