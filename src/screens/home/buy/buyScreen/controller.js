import I18n from '../../../../translations/text/i18n';

export const fieldVisibility = (item, key) => {
  const fieldConfig = item?.product_form?.[0]?.field_config;
  return !(
    fieldConfig && fieldConfig.some((x) => x.key === key && !x.visibility)
  );
};

export const fieldLabel = (item, key) => {
  const fieldConfig = item?.product_form?.[0]?.field_config ?? [];
  const field = fieldConfig.find((x) => x.key === key);
  return field?.label || I18n.t(key);
};
