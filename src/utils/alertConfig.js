import React from 'react';
import { Image, Dimensions } from 'react-native';
import {
  CardVerificationIcon,
  ClearDataIcon,
  DeleteConfirmIcon,
  NfcNotSupportIcon,
  NoBluetoothPermissionIcon,
  NoDeviceFoundIcon,
  SkipCardIcon,
  TurnOnNfcIcon,
} from '../assets/svg';
import I18n from '../translations/text/i18n';

const { width } = Dimensions.get('window');

export const AlertConfig = [
  {
    key: 'nfc_no_turned_on',
    title: I18n.t('nfc_no_turned_on'),
    message: I18n.t('turn_on_nfc_continue'),
    submitText: I18n.t('turn_on'),
    icon: <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
  },
  {
    key: 'nfc_unsupported',
    title: I18n.t('nfc_unsupported'),
    message: I18n.t('nfc_not_support_device'),
    submitText: I18n.t('ok'),
    icon: <NfcNotSupportIcon width={width * 0.27} height={width * 0.27} />,
  },
  {
    key: 'card_not_found_for_farmer',
    title: I18n.t('card_not_found_for_farmer'),
    message: I18n.t('card_not_issued_for_farmer'),
    submitText: I18n.t('ok'),
    icon: (
      <Image
        source={require('../assets/images/card_not_found.png')}
        resizeMode="contain"
        style={{ width: width * 0.3, height: width * 0.3 }}
      />
    ),
  },
  {
    key: 'card_not_found_for_buyer',
    title: I18n.t('card_not_found_for_buyer'),
    message: I18n.t('card_not_issued_for_buyer'),
    submitText: I18n.t('ok'),
    icon: (
      <Image
        source={require('../assets/images/card_not_found.png')}
        resizeMode="contain"
        style={{ width: width * 0.3, height: width * 0.3 }}
      />
    ),
  },
  {
    key: 'issue_card_verification',
    title: I18n.t('confirm_verification'),
    message: I18n.t('confirm_verification_msg'),
    submitText: I18n.t('proceed'),
    icon: <CardVerificationIcon width={width * 0.3} height={width * 0.3} />,
    cancelText: I18n.t('re_scan'),
  },
  {
    key: 'verify_card_transaction',
    title: I18n.t('confirm_verification'),
    message: '',
    submitText: I18n.t('proceed'),
    icon: <CardVerificationIcon width={width * 0.3} height={width * 0.3} />,
    cancelText: I18n.t('re_scan'),
  },
  {
    key: 'card_already_assigned',
    title: '',
    message: I18n.t('force_issue_card'),
    submitText: I18n.t('proceed'),
    icon: (
      <Image
        source={require('../assets/images/card_already_assigned.png')}
        resizeMode="contain"
        style={{ width: width * 0.3, height: width * 0.3 }}
      />
    ),
    cancelText: I18n.t('re_scan'),
  },
  {
    key: 'same_card_used_for',
    title: I18n.t('already_your_card'),
    message: '',
    submitText: I18n.t('ok'),
    icon: (
      <Image
        source={require('../assets/images/card_already_assigned.png')}
        resizeMode="contain"
        style={{ width: width * 0.3, height: width * 0.3 }}
      />
    ),
  },
  {
    key: 'buyer_card_found',
    title: I18n.t('buyer_card_found'),
    message: I18n.t('this_is_buyer_card'),
    submitText: I18n.t('ok'),
    icon: (
      <Image
        source={require('../assets/images/card_already_assigned.png')}
        resizeMode="contain"
        style={{ width: width * 0.3, height: width * 0.3 }}
      />
    ),
  },
  {
    key: 'confirm_skip',
    title: I18n.t('skipped'),
    message: '',
    submitText: I18n.t('proceed'),
    icon: <SkipCardIcon width={width * 0.3} height={width * 0.3} />,
    cancelText: I18n.t('re_scan'),
  },
  {
    key: 'no_printer_connected',
    title: I18n.t('no_device_connected'),
    message: I18n.t('no_printer_message'),
    submitText: I18n.t('go_to_settings'),
    icon: <NoDeviceFoundIcon width={width * 0.27} height={width * 0.27} />,
    cancelText: I18n.t('cancel'),
  },
  {
    key: 'no_bluetooth_permission',
    title: I18n.t('no_bluetooth_permission'),
    message: I18n.t('allow_bluetooth_permissions'),
    submitText: I18n.t('go_to_settings'),
    icon: (
      <NoBluetoothPermissionIcon width={width * 0.27} height={width * 0.27} />
    ),
    cancelText: I18n.t('cancel'),
  },
  {
    key: 'allow_bluetooth_permission',
    title: I18n.t('permissions_not_allowed'),
    message: I18n.t('allow_bluetooth_permissions_2'),
    submitText: I18n.t('allow'),
    icon: (
      <NoBluetoothPermissionIcon width={width * 0.27} height={width * 0.27} />
    ),
    cancelText: I18n.t('do_not_allow'),
  },
  {
    key: 'delete_transaction',
    title: I18n.t('delete_transaction'),
    message: I18n.t('are_you_sure_delete_transaction'),
    submitText: I18n.t('ok'),
    icon: <DeleteConfirmIcon width={width * 0.23} height={width * 0.23} />,
    cancelText: I18n.t('cancel'),
  },
  {
    key: 'clear_data_warning',
    title: I18n.t('clear_data_warning'),
    message: I18n.t('clear_data_warning2'),
    submitText: I18n.t('clear_and_logout'),
    icon: <ClearDataIcon width={width * 0.25} height={width * 0.25} />,
    cancelText: I18n.t('cancel'),
  },
];
