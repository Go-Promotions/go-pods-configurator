const gbpCurrency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return gbpCurrency.format(value);
}

export function formatWeightKg(value: number) {
  return `${value.toFixed(0)}kg`;
}
